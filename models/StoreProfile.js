const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreProfile = sequelize.define('StoreProfile', {
    name: {
        type: DataTypes.STRING,
        defaultValue: 'Self Service Cafe'
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Nikmati pengalaman memesan tanpa antri.'
    },
    admin_password: {
        type: DataTypes.STRING,
        defaultValue: 'admin' // In real app, hash this!
    }
});

module.exports = StoreProfile;
