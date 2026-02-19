const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Item = require('./Item');
const Order = require('./Order');

const OrderItem = sequelize.define('OrderItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price_at_time: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Associations
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Item.hasMany(OrderItem, { foreignKey: 'item_id' });
OrderItem.belongsTo(Item, { foreignKey: 'item_id' });

module.exports = OrderItem;
