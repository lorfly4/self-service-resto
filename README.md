# Self Service Ordering System

This is a modern, minimalist self-service ordering system built with Express.js and MySQL.

## Features

- **Customer Side**:
  - Browse Menu (Name, Image, Price)
  - Add to Cart & Manage Quantity
  - Checkout with Order Summary
  - Dummy Payment (Bank Transfer)
  - Order History (Cookie-based tracking)
  - Modern UI with Tailwind CSS

- **Admin Side**:
  - Login (Default password: `admin`)
  - Dashboard:
    - Update Store Profile (Name, Description, Password)
    - Add Menu Items (Image Upload supported)
    - Manage Menu Availability
  - Kitchen / Caller View:
    - View Active Orders
    - Voice Call Order Numbers (Text-to-Speech)
    - Mark Orders as Completed

## Prerequisites

- Node.js installed
- MySQL Database running (Default: `root` user, no password)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   Make sure your MySQL server is running.
   ```bash
   npm run setup
   ```
   This will create the database `online_order_db` and the necessary tables.

## Running the Application

1. **Start the Server**:
   ```bash
   npm start
   ```

2. **Access the App**:
   - **Customer Menu**: [http://localhost:3000](http://localhost:3000)
   - **Admin Login**: [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

- `server.js`: Main application file.
- `models/`: Sequelize models (Item, Order, etc.).
- `views/`: EJS templates for frontend.
- `public/`: Static assets (CSS, Uploaded Images).
- `config/`: Database configuration.
