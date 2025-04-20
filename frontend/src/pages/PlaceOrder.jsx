import React, { useEffect, useState } from 'react';

function PlaceOrder() {
  const [products, setProducts] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/products')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message));
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = field === 'quantity' ? parseInt(value, 10) : value;
    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    // Validate order items
    if (orderItems.length === 0 || orderItems.some(item => !item.product_id || item.quantity <= 0)) {
      setError('Please select valid products and quantities.');
      return;
    }

    const orderData = {
      buyer_name: buyerName,
      contact_info: contactInfo,
      delivery_address: deliveryAddress,
      items: orderItems,
    };

    try {
      const res = await fetch('http://localhost:5000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to place order');
      }
      const data = await res.json();
      setMessage(`Order placed successfully! Your order ID is ${data.order_id}`);
      setBuyerName('');
      setContactInfo('');
      setDeliveryAddress('');
      setOrderItems([{ product_id: '', quantity: 1 }]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Place Bulk Order</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label className="block font-semibold mb-1">Buyer Name</label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Contact Information</label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Delivery Address</label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Order Items</label>
          {orderItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                value={item.product_id}
                onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                required
                className="border px-2 py-1 rounded flex-grow"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (${product.price_per_unit.toFixed(2)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                required
                className="w-20 border px-2 py-1 rounded"
              />
              {orderItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Place Order
        </button>
      </form>
    </div>
  );
}

export default PlaceOrder;
