import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductCatalog from './pages/ProductCatalog';
import PlaceOrder from './pages/PlaceOrder';
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="container mx-auto p-4">
        <nav className="mb-4 flex space-x-4 border-b pb-2">
          <Link to="/" className="text-blue-600 hover:underline">Product Catalog</Link>
          <Link to="/place-order" className="text-blue-600 hover:underline">Place Order</Link>
          <Link to="/order-tracking" className="text-blue-600 hover:underline">Order Tracking</Link>
          <Link to="/admin" className="text-blue-600 hover:underline">Admin Dashboard</Link>
        </nav>
        <Routes>
          <Route path="/" element={<ProductCatalog />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
