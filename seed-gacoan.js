const sequelize = require('./config/database');
const Item = require('./models/Item');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

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
    {
        name: "Mie Hompimpa Level 2",
        description: "Mie dengan rasa gurih pedas asin level 2. Mulai menantang.",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Hompimpa+Lv2",
        is_available: true
    },
    {
        name: "Mie Hompimpa Level 3",
        description: "Mie dengan rasa gurih pedas asin level 3. Pedas nampol!",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Hompimpa+Lv3",
        is_available: true
    },
    {
        name: "Mie Gacoan Level 1",
        description: "Mie dengan rasa manis pedas level 1. Best seller!",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Gacoan+Lv1",
        is_available: true
    },
    {
        name: "Mie Gacoan Level 2",
        description: "Mie dengan rasa manis pedas level 2.",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Gacoan+Lv2",
        is_available: true
    },
    {
        name: "Mie Gacoan Level 3",
        description: "Mie dengan rasa manis pedas level 3. Pedas manis bikin nagih.",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Mie+Gacoan+Lv3",
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
    {
        name: "Udang Rambutan",
        description: "Bola udang goreng dengan kulit pangsit krispi.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Udang+Rambutan",
        is_available: true
    },
    {
        name: "Siomay",
        description: "Siomay ayam udang kukus yang lembut.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Siomay",
        is_available: true
    },
    {
        name: "Pangsit Goreng",
        description: "Pangsit goreng renyah dengan isian daging ayam.",
        price: 9500,
        image_url: "https://via.placeholder.com/300x200?text=Pangsit+Goreng",
        is_available: true
    },
    {
        name: "Lumpia Udang",
        description: "Lumpia goreng isi udang yang gurih.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Lumpia+Udang",
        is_available: true
    },

    // Beverages
    {
        name: "Es Gobak Sodor",
        description: "Es buah segar dengan potongan buah asli dan sirup manis.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Es+Gobak+Sodor",
        is_available: true
    },
    {
        name: "Es Teklek",
        description: "Minuman segar dengan rasa buah yang unik.",
        price: 5900,
        image_url: "https://via.placeholder.com/300x200?text=Es+Teklek",
        is_available: true
    },
    {
        name: "Es Sluku Bathok",
        description: "Es susu dengan rasa mocha yang creamy.",
        price: 5900,
        image_url: "https://via.placeholder.com/300x200?text=Es+Sluku+Bathok",
        is_available: true
    },
    {
        name: "Es Petak Umpet",
        description: "Minuman segar dengan rasa tropical.",
        price: 8600,
        image_url: "https://via.placeholder.com/300x200?text=Es+Petak+Umpet",
        is_available: true
    },
    {
        name: "Mineral Water",
        description: "Air mineral botol.",
        price: 4000,
        image_url: "https://via.placeholder.com/300x200?text=Mineral+Water",
        is_available: true
    }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Clear existing data (Order matters for FK)
        await OrderItem.destroy({ where: {}, truncate: false });
        await Order.destroy({ where: {}, truncate: false });
        await Item.destroy({ where: {}, truncate: false });
        console.log('Existing data cleared.');

        // Insert new items
        await Item.bulkCreate(gacoanMenu);
        console.log(`Successfully injected ${gacoanMenu.length} menu items.`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
