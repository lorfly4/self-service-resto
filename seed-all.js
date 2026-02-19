const sequelize = require('./config/database');
const Item = require('./models/Item');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Store = require('./models/Store');

const gacoanMenu = [
    // Noodles
    {
        name: "Mie Suit",
        description: "Mie original dengan rasa gurih asin tanpa cabai. Cocok untuk yang tidak suka pedas.",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Suit",
        is_available: true
    },
    {
        name: "Mie Hompimpa Level 1",
        description: "Mie dengan rasa gurih pedas asin level 1. Pedasnya pas!",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Hompimpa+Lv1",
        is_available: true
    },
    // Dimsum
    {
        name: "Udang Keju",
        description: "Bola udang goreng dengan isian keju lumer. Wajib coba!",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Udang+Keju",
        is_available: true
    },
    // Beverages
    {
        name: "Es Gobak Sodor",
        description: "Es buah segar dengan potongan buah asli dan sirup manis.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Es+Gobak+Sodor",
        is_available: true
    }
];

const bahariMenu = [
    {
        name: "Nasi Rames",
        description: "Nasi dengan aneka lauk pauk pilihan.",
        price: 15000,
        image_url: "https://via.placeholder.com/300x200?text=Nasi+Rames",
        is_available: true
    },
    {
        name: "Telur Dadar",
        description: "Telur dadar goreng khas warteg.",
        price: 5000,
        image_url: "https://via.placeholder.com/300x200?text=Telur+Dadar",
        is_available: true
    },
    {
        name: "Ayam Goreng",
        description: "Ayam goreng bumbu kuning.",
        price: 12000,
        image_url: "https://via.placeholder.com/300x200?text=Ayam+Goreng",
        is_available: true
    },
    {
        name: "Es Teh Manis",
        description: "Minuman sejuta umat.",
        price: 3000,
        image_url: "https://via.placeholder.com/300x200?text=Es+Teh",
        is_available: true
    }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Clear existing data
        // await OrderItem.destroy({ where: {}, truncate: false });
        // await Order.destroy({ where: {}, truncate: false });
        // await Item.destroy({ where: {}, truncate: false });
        // console.log('Existing data cleared.');

        // 1. Seed Mie Gacoan
        const gacoanStore = await Store.findOne({ where: { slug: 'mie-gacoan-tebet' } });
        if (gacoanStore) {
            console.log(`Seeding ${gacoanStore.name}...`);
            const gacoanItems = gacoanMenu.map(item => ({ ...item, store_id: gacoanStore.id }));
            // Check if items exist to avoid duplicates if running multiple times without clear
            for (const item of gacoanItems) {
                const exists = await Item.findOne({ where: { name: item.name, store_id: gacoanStore.id } });
                if (!exists) {
                    await Item.create(item);
                }
            }
            console.log(`Done seeding ${gacoanStore.name}.`);
        }

        // 2. Seed Warteg Bahari
        const bahariStore = await Store.findOne({ where: { slug: 'warteg-bahari' } });
        if (bahariStore) {
            console.log(`Seeding ${bahariStore.name}...`);
            const bahariItems = bahariMenu.map(item => ({ ...item, store_id: bahariStore.id }));
             for (const item of bahariItems) {
                const exists = await Item.findOne({ where: { name: item.name, store_id: bahariStore.id } });
                if (!exists) {
                    await Item.create(item);
                }
            }
            console.log(`Done seeding ${bahariStore.name}.`);
        }

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
