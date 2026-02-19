const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('online_order_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize;
