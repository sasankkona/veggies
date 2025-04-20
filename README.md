<<<<<<< HEAD
# veggies
=======
# Bulk Vegetable/Fruit Ordering Platform

This is a full-stack web application to facilitate bulk vegetable and fruit orders. Buyers can browse products, place bulk orders, and track their order status. Admins can manage orders and inventory efficiently.

## Features

### For Buyers
- Browse product catalog with name and price per unit.
- Place bulk orders specifying product, quantity, and delivery details.
- Track order status: Pending, In Progress, Delivered.

### For Admins
- View all placed orders with buyer and delivery details.
- Update order status.
- Manage inventory: add, edit, remove products.

## Technology Stack

- Backend: Node.js, Express, PostgreSQL
- Frontend: React.js, Vite
- Database: PostgreSQL (hosted on Neon.tech or local)
- Styling: Tailwind CSS

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- PostgreSQL database (Neon.tech or local)
- .env file with `DATABASE_URL` configured

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the backend server:
   ```
   npm run dev
   ```
   The backend server runs on port 5000 by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend dev server:
   ```
   npm run dev
   ```
   The frontend server runs on port 5173 by default. Open the URL shown in the terminal (e.g., http://localhost:5173).

## Usage

- Access the frontend URL in your browser.
- Browse products, place orders, track orders.
- Access the admin dashboard to manage orders and inventory.

## Notes

- CORS is configured to allow frontend requests.
- SSL is configured for PostgreSQL connection.
- No authentication implemented (optional feature).
- Email notifications not implemented (optional feature).

## License

This project is open source and free to use.
>>>>>>> 2e5ed93 (project)
