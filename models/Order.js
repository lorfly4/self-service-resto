const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    order_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_uuid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'completed', 'cancelled'),
        defaultValue: 'pending'
    }
});

module.exports = Order;
