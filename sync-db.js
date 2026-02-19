const sequelize = require('./config/database');
const Item = require('./models/Item');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const StoreProfile = require('./models/StoreProfile');
const User = require('./models/User');

async function sync() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Force: true drops tables if they exist. Use with caution in prod.
        // For development, it's fine.
        await sequelize.sync({ force: false, alter: true });
        console.log('Database synchronized.');

        // Initialize Store Profile if empty
        const profile = await StoreProfile.findOne();
        if (!profile) {
            await StoreProfile.create({});
            console.log('Default Store Profile created.');
        }

        // Initialize Default Admin User if empty
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            await User.create({
                username: 'admin',
                password: 'admin', // In real app, hash this!
                role: 'admin'
            });
            console.log('Default Admin User created (admin/admin).');
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

sync();
