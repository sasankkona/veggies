import React, { useEffect, useState } from 'react';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  // For product form
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);

  // For order status update
  const [orderStatusUpdates, setOrderStatusUpdates] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/admin/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!productName || !productPrice || Number(productPrice) <= 0) {
      setError('Please enter valid product name and price');
      return;
    }

    try {
      let res;
      if (editingProductId) {
        res = await fetch(`http://localhost:5000/admin/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: productName, price_per_unit: Number(productPrice) }),
        });
      } else {
        res = await fetch('http://localhost:5000/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: productName, price_per_unit: Number(productPrice) }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      setProductName('');
      setProductPrice('');
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProduct = (product) => {
    setProductName(product.name);
    setProductPrice(product.price_per_unit);
    setEditingProductId(product.id);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete product');
      }
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrderStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const updateOrderStatus = async (orderId) => {
    const newStatus = orderStatusUpdates[orderId];
    if (!newStatus) return;
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order status');
      }
      setOrderStatusUpdates((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Manage Products</h3>
        <form onSubmit={handleProductSubmit} className="mb-4 max-w-md space-y-2">
          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price per Unit"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {editingProductId ? 'Update Product' : 'Add Product'}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setProductName('');
                setProductPrice('');
              }}
              className="ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
        </form>
        {loadingProducts ? (
          <p>Loading products...</p>
        ) : (
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Price per Unit</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-4 py-2">${product.price_per_unit.toFixed(2)}</td>
                  <td className="border px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2">Manage Orders</h3>
        {loadingOrders ? (
          <p>Loading orders...</p>
        ) : (
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Order ID</th>
                <th className="border px-4 py-2 text-left">Buyer Name</th>
                <th className="border px-4 py-2 text-left">Contact Info</th>
                <th className="border px-4 py-2 text-left">Delivery Address</th>
                <th className="border px-4 py-2 text-left">Status</th>
                <th className="border px-4 py-2 text-left">Items</th>
                <th className="border px-4 py-2 text-left">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 align-top">
                  <td className="border px-4 py-2">{order.id}</td>
                  <td className="border px-4 py-2">{order.buyer_name}</td>
                  <td className="border px-4 py-2">{order.contact_info}</td>
                  <td className="border px-4 py-2">{order.delivery_address}</td>
                  <td className="border px-4 py-2">{order.status}</td>
                  <td className="border px-4 py-2">
                    <ul className="list-disc list-inside">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.name} - Qty: {item.quantity} - Price: ${item.price_per_unit.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="border px-4 py-2">
                    <select
                      value={orderStatusUpdates[order.id] || order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <button
                      onClick={() => updateOrderStatus(order.id)}
                      disabled={!orderStatusUpdates[order.id]}
                      className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
