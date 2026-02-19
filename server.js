const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs-extra');

// Database Models
const sequelize = require('./config/database');
const Item = require('./models/Item');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const StoreProfile = require('./models/StoreProfile');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// File Upload Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper: Get User ID from Cookie
const getUserId = (req, res) => {
    let userId = req.cookies.user_id;
    if (!userId) {
        userId = uuidv4();
        res.cookie('user_id', userId, { maxAge: 9000000000, httpOnly: true });
    }
    return userId;
};

// --- ROUTES ---

// 1. Customer Routes

// Home / Menu
app.get('/', async (req, res) => {
    getUserId(req, res); // Ensure cookie is set
    try {
        const items = await Item.findAll({ where: { is_available: true } });
        const store = await StoreProfile.findOne();
        res.render('index', { items, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Cart (In-memory cart for simplicity or stored in cookie? Better in session/cookie or local storage. 
// For this simple app, let's use a simple client-side cart or cookie-based cart.
// Since the prompt mentions "simpan cookie setiap user", I'll use cookies to track the user ID, 
// but for the cart itself, passing it via form or local storage is easier. 
// However, the flowchart implies "Tambah Menu -> Masukan Jumlah".
// I'll implement a simple cart using a cookie `cart` which stores JSON string of items.
// Or better, just handle it in the frontend with localStorage and send to backend on checkout.
// Backend cart is more robust. Let's use a temporary `Order` with status 'cart' in DB? 
// No, the prompt says "Order History", so 'cart' is pre-order.
// Let's stick to a simple array in cookie `cart_items` for simplicity.)

app.post('/cart/add', (req, res) => {
    const { itemId, quantity } = req.body;
    let cart = req.cookies.cart || [];
    
    // Check if item already exists
    const existingItemIndex = cart.findIndex(item => item.itemId === itemId);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity = parseInt(cart[existingItemIndex].quantity) + parseInt(quantity);
    } else {
        cart.push({ itemId, quantity: parseInt(quantity) });
    }
    
    res.cookie('cart', cart, { maxAge: 9000000000, httpOnly: true });
    res.redirect('/');
});

app.get('/cart', async (req, res) => {
    const cart = req.cookies.cart || [];
    const userId = getUserId(req, res);
    
    try {
        // Fetch item details
        const cartItems = [];
        let total = 0;
        
        for (const cartItem of cart) {
            const item = await Item.findByPk(cartItem.itemId);
            if (item) {
                cartItems.push({
                    item: item,
                    quantity: cartItem.quantity,
                    subtotal: item.price * cartItem.quantity
                });
                total += item.price * cartItem.quantity;
            }
        }
        
        const store = await StoreProfile.findOne();
        res.render('cart', { cartItems, total, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/cart/remove', (req, res) => {
    const { itemId } = req.body;
    let cart = req.cookies.cart || [];
    cart = cart.filter(item => item.itemId !== itemId);
    res.cookie('cart', cart, { maxAge: 9000000000, httpOnly: true });
    res.redirect('/cart');
});

// Checkout & Place Order
app.post('/checkout', async (req, res) => {
    const userId = getUserId(req, res);
    const cart = req.cookies.cart || [];
    
    if (cart.length === 0) return res.redirect('/');

    try {
        let totalAmount = 0;
        const orderItemsData = [];

        for (const cartItem of cart) {
            const item = await Item.findByPk(cartItem.itemId);
            if (item) {
                totalAmount += item.price * cartItem.quantity;
                orderItemsData.push({
                    item_id: item.id,
                    quantity: cartItem.quantity,
                    price_at_time: item.price
                });
            }
        }

        const order = await Order.create({
            user_uuid: userId,
            total_amount: totalAmount,
            order_number: `ORD-${Date.now().toString().slice(-6)}`,
            status: 'pending' // Pending payment
        });

        for (const itemData of orderItemsData) {
            await OrderItem.create({
                ...itemData,
                order_id: order.id
            });
        }

        // Clear cart
        res.clearCookie('cart');
        res.redirect(`/payment/${order.id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Payment Page
app.get('/payment/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, include: [Item] }]
        });
        if (!order) return res.status(404).send('Order not found');
        
        const store = await StoreProfile.findOne();
        res.render('payment', { order, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Confirm Payment (Simulated)
app.post('/payment/:id/confirm', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (order) {
            order.status = 'paid'; // Or 'completed'
            await order.save();
        }
        res.redirect(`/history`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// History
app.get('/history', async (req, res) => {
    const userId = getUserId(req, res);
    try {
        const orders = await Order.findAll({
            where: { user_uuid: userId },
            include: [{ model: OrderItem, include: [Item] }],
            order: [['createdAt', 'DESC']]
        });
        const store = await StoreProfile.findOne();
        res.render('history', { orders, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// 2. Admin Routes

// Login
app.get('/admin', (req, res) => {
    res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        
        if (user && user.password === password) {
            res.cookie('admin_auth', 'true', { httpOnly: true });
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { error: 'Invalid Username or Password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Admin Middleware
const adminAuth = (req, res, next) => {
    if (req.cookies.admin_auth === 'true') {
        next();
    } else {
        res.redirect('/admin');
    }
};

app.get('/admin/logout', (req, res) => {
    res.clearCookie('admin_auth');
    res.redirect('/admin');
});

// Dashboard
app.get('/admin/dashboard', adminAuth, async (req, res) => {
    try {
        const items = await Item.findAll();
        const store = await StoreProfile.findOne();
        res.render('admin/dashboard', { items, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Item
app.post('/admin/items/add', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        await Item.create({
            name,
            description,
            price,
            image_url: req.file ? `/uploads/${req.file.filename}` : null
        });
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding item');
    }
});

// Update Store Profile
app.post('/admin/store/update', adminAuth, async (req, res) => {
    try {
        const { name, description, password } = req.body;
        const store = await StoreProfile.findOne();
        
        store.name = name;
        store.description = description;
        if (password) store.admin_password = password;
        
        await store.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating store');
    }
});

// Kitchen / Calling Page
app.get('/admin/kitchen', adminAuth, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { status: ['paid', 'pending'] }, // Show active orders
            include: [{ model: OrderItem, include: [Item] }],
            order: [['createdAt', 'ASC']]
        });
        res.render('admin/kitchen', { orders });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/admin/order/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (order) {
            order.status = status;
            await order.save();
        }
        res.redirect('/admin/kitchen');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating order');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
