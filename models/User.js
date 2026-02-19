const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'staff'),
        defaultValue: 'admin'
    },
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = User;
