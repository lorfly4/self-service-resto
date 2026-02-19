const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customer_name: {
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
