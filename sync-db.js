const sequelize = require('./config/database');
const { Store, User, Item, Order, OrderItem } = require('./models');

async function sync() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Use alter: true to update tables without dropping data if possible
        await sequelize.sync({ force: true });
        console.log('Database synchronized.');

        // Initialize Super Admin if not exists
        const superAdmin = await User.findOne({ where: { role: 'super_admin' } });
        if (!superAdmin) {
            await User.create({
                username: 'superadmin',
                password: 'superadmin', // In real app, hash this!
                role: 'super_admin'
            });
            console.log('Super Admin created (superadmin/superadmin).');
        }

        // Initialize Default Store (Mie Gacoan) if not exists
        let defaultStore = await Store.findOne({ where: { slug: 'mie-gacoan-tebet' } });
        if (!defaultStore) {
            defaultStore = await Store.create({
                name: 'Mie Gacoan Tebet',
                slug: 'mie-gacoan-tebet',
                description: 'Mie Pedas No. 1 di Indonesia',
                bank_name: 'BCA',
                bank_account_number: '1234567890',
                bank_account_holder: 'PT Pesta Pora Abadi'
            });
            console.log('Default Store created.');
        }

        // Initialize Default Store Admin
        const storeAdmin = await User.findOne({ where: { username: 'admin_gacoan' } });
        if (!storeAdmin) {
            await User.create({
                username: 'admin_gacoan',
                password: 'password',
                role: 'admin',
                store_id: defaultStore.id
            });
            console.log('Default Store Admin created (admin_gacoan/password).');
        }

        // Initialize Second Store (Warteg Bahari)
        let secondStore = await Store.findOne({ where: { slug: 'warteg-bahari' } });
        if (!secondStore) {
            secondStore = await Store.create({
                name: 'Warteg Bahari',
                slug: 'warteg-bahari',
                description: 'Murah Meriah Muntah',
                bank_name: 'BRI',
                bank_account_number: '0987654321',
                bank_account_holder: 'Ibu Bahari'
            });
            console.log('Second Store created.');
        }

        // Initialize Second Store Admin
        const secondStoreAdmin = await User.findOne({ where: { username: 'admin_bahari' } });
        if (!secondStoreAdmin) {
            await User.create({
                username: 'admin_bahari',
                password: 'password',
                role: 'admin',
                store_id: secondStore.id
            });
            console.log('Second Store Admin created (admin_bahari/password).');
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

sync();
