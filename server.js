const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs-extra');

// Database Models
const sequelize = require('./config/database');
const { Store, User, Item, Order, OrderItem } = require('./models');

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

// --- MIDDLEWARE HELPERS ---

// 1. Get/Set Guest User ID
const getUserId = (req, res) => {
    let userId = req.cookies.user_id;
    if (!userId) {
        userId = uuidv4();
        res.cookie('user_id', userId, { maxAge: 9000000000, httpOnly: true });
    }
    return userId;
};

// 2. Authentication Middleware
const authMiddleware = async (req, res, next) => {
    const userId = req.cookies.auth_user_id;
    if (userId) {
        try {
            const user = await User.findByPk(userId);
            if (user) {
                req.user = user;
                res.locals.user = user; // Make user available in views
                return next();
            }
        } catch (err) {
            console.error(err);
        }
    }
    req.user = null;
    res.locals.user = null;
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/admin/login');
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).send('Access Denied: Super Admin Only');
    }
    next();
};

const requireStoreAccess = (req, res, next) => {
    const targetStoreId = parseInt(req.params.storeId);
    
    if (!req.user) return res.redirect('/admin/login');

    // Super Admin can access any store
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Store Admin/Staff can only access their own store
    if (req.user.store_id === targetStoreId) {
        return next();
    }

    res.status(403).send('Access Denied: You do not have permission for this store.');
};

// 3. Store Resolution Middleware (for Customer Routes)
const resolveStore = async (req, res, next) => {
    const slug = req.params.slug;
    try {
        const store = await Store.findOne({ where: { slug } });
        if (!store) {
            return res.status(404).send('Store not found');
        }
        req.store = store;
        res.locals.store = store; // Make store available in views
        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

app.use(authMiddleware);

// --- ROUTES ---

// === LANDING PAGE (List Stores) ===
app.get('/', async (req, res) => {
    try {
        const stores = await Store.findAll();
        res.render('landing', { stores });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// === CUSTOMER ROUTES (Storefront) ===

// Store Home
app.get('/stores/:slug', resolveStore, async (req, res) => {
    getUserId(req, res);
    try {
        const items = await Item.findAll({ 
            where: { 
                store_id: req.store.id,
                is_available: true 
            } 
        });
        res.render('index', { items, store: req.store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Cart
app.get('/stores/:slug/cart', resolveStore, async (req, res) => {
    // Cart is stored in cookie `cart_${storeId}` to separate carts per store
    const cartCookieName = `cart_${req.store.id}`;
    const cart = req.cookies[cartCookieName] || [];
    
    try {
        const cartItems = [];
        let total = 0;
        
        for (const cartItem of cart) {
            const item = await Item.findByPk(cartItem.itemId);
            if (item && item.store_id === req.store.id) {
                cartItems.push({
                    item: item,
                    quantity: cartItem.quantity,
                    subtotal: item.price * cartItem.quantity
                });
                total += item.price * cartItem.quantity;
            }
        }
        
        res.render('cart', { cartItems, total, store: req.store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/stores/:slug/cart/add', resolveStore, (req, res) => {
    const { itemId, quantity } = req.body;
    const cartCookieName = `cart_${req.store.id}`;
    let cart = req.cookies[cartCookieName] || [];
    
    const existingItemIndex = cart.findIndex(item => item.itemId === itemId);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity = parseInt(cart[existingItemIndex].quantity) + parseInt(quantity);
    } else {
        cart.push({ itemId, quantity: parseInt(quantity) });
    }
    
    res.cookie(cartCookieName, cart, { maxAge: 9000000000, httpOnly: true });
    res.redirect(`/stores/${req.params.slug}`);
});

app.post('/stores/:slug/cart/remove', resolveStore, (req, res) => {
    const { itemId } = req.body;
    const cartCookieName = `cart_${req.store.id}`;
    let cart = req.cookies[cartCookieName] || [];
    cart = cart.filter(item => item.itemId !== itemId);
    res.cookie(cartCookieName, cart, { maxAge: 9000000000, httpOnly: true });
    res.redirect(`/stores/${req.params.slug}/cart`);
});

// Checkout
app.post('/stores/:slug/checkout', resolveStore, async (req, res) => {
    const userId = getUserId(req, res);
    const cartCookieName = `cart_${req.store.id}`;
    const cart = req.cookies[cartCookieName] || [];
    
    if (cart.length === 0) return res.redirect(`/stores/${req.params.slug}`);

    try {
        let totalAmount = 0;
        const orderItemsData = [];

        for (const cartItem of cart) {
            const item = await Item.findByPk(cartItem.itemId);
            if (item && item.store_id === req.store.id) {
                totalAmount += item.price * cartItem.quantity;
                orderItemsData.push({
                    item_id: item.id,
                    quantity: cartItem.quantity,
                    price_at_time: item.price
                });
            }
        }

        const order = await Order.create({
            store_id: req.store.id,
            user_uuid: userId,
            customer_name: 'Guest', // Can be updated in payment page
            total_amount: totalAmount,
            order_number: `ORD-${Date.now().toString().slice(-6)}`,
            status: 'pending'
        });

        for (const itemData of orderItemsData) {
            await OrderItem.create({
                ...itemData,
                order_id: order.id
            });
        }

        res.clearCookie(cartCookieName);
        res.redirect(`/stores/${req.params.slug}/payment/${order.id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Payment
app.get('/stores/:slug/payment/:id', resolveStore, async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, store_id: req.store.id },
            include: [{ model: OrderItem, include: [Item] }]
        });
        if (!order) return res.status(404).send('Order not found');
        
        res.render('payment', { order, store: req.store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/stores/:slug/payment/:id/confirm', resolveStore, async (req, res) => {
    try {
        const order = await Order.findOne({ where: { id: req.params.id, store_id: req.store.id } });
        if (order) {
            order.status = 'paid';
            if (req.body.customer_name) {
                order.customer_name = req.body.customer_name;
            }
            await order.save();
        }
        res.redirect(`/stores/${req.params.slug}/history`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// History
app.get('/stores/:slug/history', resolveStore, async (req, res) => {
    const userId = getUserId(req, res);
    try {
        const orders = await Order.findAll({
            where: { 
                user_uuid: userId,
                store_id: req.store.id
            },
            include: [{ model: OrderItem, include: [Item] }],
            order: [['createdAt', 'DESC']]
        });
        res.render('history', { orders, store: req.store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// === AUTHENTICATION ===

app.get('/admin/login', (req, res) => {
    if (req.user) {
        if (req.user.role === 'super_admin') return res.redirect('/super-admin/dashboard');
        return res.redirect(`/admin/store/${req.user.store_id}/dashboard`);
    }
    res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        
        if (user && user.password === password) {
            res.cookie('auth_user_id', user.id, { httpOnly: true });
            
            if (user.role === 'super_admin') {
                return res.redirect('/super-admin/dashboard');
            } else {
                return res.redirect(`/admin/store/${user.store_id}/dashboard`);
            }
        } else {
            res.render('admin/login', { error: 'Invalid Username or Password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/admin/logout', (req, res) => {
    res.clearCookie('auth_user_id');
    res.redirect('/admin/login');
});


// === SUPER ADMIN ROUTES ===

app.get('/super-admin/dashboard', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const stores = await Store.findAll({
            include: [{ model: User, required: false }]
        });
        res.render('super-admin/dashboard', { stores });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/super-admin/stores/add', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { name, slug, description, bank_name, bank_account_number, bank_account_holder, admin_username, admin_password } = req.body;
        
        const store = await Store.create({
            name, slug, description, bank_name, bank_account_number, bank_account_holder
        });

        // Create Admin for this store
        await User.create({
            username: admin_username,
            password: admin_password,
            role: 'admin',
            store_id: store.id
        });

        res.redirect('/super-admin/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating store: ' + err.message);
    }
});


// === STORE ADMIN ROUTES ===

// Dashboard
app.get('/admin/store/:storeId/dashboard', requireAuth, requireStoreAccess, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const store = await Store.findByPk(storeId);
        const items = await Item.findAll({ where: { store_id: storeId } });
        res.render('admin/dashboard', { items, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update Store Profile
app.post('/admin/store/:storeId/update', requireAuth, requireStoreAccess, async (req, res) => {
    try {
        const { name, description, bank_name, bank_account_number, bank_account_holder } = req.body;
        const store = await Store.findByPk(req.params.storeId);
        
        store.name = name;
        store.description = description;
        store.bank_name = bank_name;
        store.bank_account_number = bank_account_number;
        store.bank_account_holder = bank_account_holder;
        
        await store.save();
        res.redirect(`/admin/store/${req.params.storeId}/dashboard`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating store');
    }
});

// Add Item
app.post('/admin/store/:storeId/items/add', requireAuth, requireStoreAccess, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        await Item.create({
            store_id: req.params.storeId,
            name,
            description,
            price,
            image_url: req.file ? `/uploads/${req.file.filename}` : null
        });
        res.redirect(`/admin/store/${req.params.storeId}/dashboard`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding item');
    }
});

// Kitchen
app.get('/admin/store/:storeId/kitchen', requireAuth, requireStoreAccess, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const store = await Store.findByPk(storeId);
        const orders = await Order.findAll({
            where: { 
                store_id: storeId,
                status: ['paid', 'pending'] 
            },
            include: [{ model: OrderItem, include: [Item] }],
            order: [['createdAt', 'ASC']]
        });
        res.render('admin/kitchen', { orders, store });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/admin/store/:storeId/order/:orderId/status', requireAuth, requireStoreAccess, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({ 
            where: { 
                id: req.params.orderId,
                store_id: req.params.storeId
            } 
        });
        if (order) {
            order.status = status;
            await order.save();
        }
        res.redirect(`/admin/store/${req.params.storeId}/kitchen`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating order');
    }
});


// Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
};

startServer();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
