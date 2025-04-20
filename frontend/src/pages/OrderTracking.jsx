import React, { useState } from 'react';

function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`http://localhost:5000/orders/${orderId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Order not found');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderId.trim() === '') {
      setError('Please enter an order ID');
      return;
    }
    fetchOrder();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Track Your Order</h2>
      <form onSubmit={handleSubmit} className="mb-4 max-w-sm">
        <input
          type="text"
          placeholder="Enter your order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Track Order
        </button>
      </form>
      {loading && <p>Loading order details...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {order && (
        <div className="border p-4 rounded max-w-lg">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Buyer Name:</strong> {order.buyer_name}</p>
          <p><strong>Contact Info:</strong> {order.contact_info}</p>
          <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Created At:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <h3 className="mt-4 font-semibold">Items:</h3>
          <ul className="list-disc list-inside">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.name} - Quantity: {item.quantity} - Price per unit: ${item.price_per_unit.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
