import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Manual CORS headers to ensure Access-Control-Allow-Origin is set
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

// PostgreSQL client setup
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Bulk Vegetable/Fruit Ordering Platform API');
});

// GET /products - fetch product catalog
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /orders - place a new order
app.post('/orders', async (req, res) => {
  const { buyer_name, contact_info, delivery_address, items } = req.body;
  if (!buyer_name || !contact_info || !delivery_address || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid order details' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderInsertText = `
      INSERT INTO orders (buyer_name, contact_info, delivery_address)
      VALUES ($1, $2, $3) RETURNING id, status, created_at
    `;
    const orderResult = await client.query(orderInsertText, [buyer_name, contact_info, delivery_address]);
    const orderId = orderResult.rows[0].id;

    const orderItemsInsertText = `
      INSERT INTO order_items (order_id, product_id, quantity)
      VALUES ($1, $2, $3)
    `;

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid product_id or quantity in items' });
      }
      await client.query(orderItemsInsertText, [orderId, product_id, quantity]);
    }

    await client.query('COMMIT');
    res.status(201).json({ order_id: orderId, status: orderResult.rows[0].status, created_at: orderResult.rows[0].created_at });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error placing order', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /orders/:id - get order status and details
app.get('/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.quantity, p.id as product_id, p.name, p.price_per_unit
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      id: order.id,
      buyer_name: order.buyer_name,
      contact_info: order.contact_info,
      delivery_address: order.delivery_address,
      status: order.status,
      created_at: order.created_at,
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching order', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes - prefix /admin

// GET /admin/orders - get all orders with details
app.get('/admin/orders', async (req, res) => {
  try {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT oi.id, oi.quantity, p.id as product_id, p.name, p.price_per_unit
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching admin orders', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /admin/orders/:id - update order status
app.put('/admin/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const updateResult = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, orderId]);
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Error updating order status', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/products - add new product
app.post('/admin/products', async (req, res) => {
  const { name, price_per_unit } = req.body;
  if (!name || !price_per_unit || price_per_unit <= 0) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  try {
    const insertResult = await pool.query(
      'INSERT INTO products (name, price_per_unit) VALUES ($1, $2) RETURNING *',
      [name, price_per_unit]
    );
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error('Error adding product', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /admin/products/:id - update product
app.put('/admin/products/:id', async (req, res) => {
  const productId = req.params.id;
  const { name, price_per_unit } = req.body;
  if (!name || !price_per_unit || price_per_unit <= 0) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  try {
    const updateResult = await pool.query(
      'UPDATE products SET name = $1, price_per_unit = $2 WHERE id = $3 RETURNING *',
      [name, price_per_unit, productId]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Error updating product', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/products/:id - delete product
app.delete('/admin/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const deleteResult = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
