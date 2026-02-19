const Store = require('./Store');
const User = require('./User');
const Item = require('./Item');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define Relationships
Store.hasMany(User, { foreignKey: 'store_id' });
User.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Item, { foreignKey: 'store_id' });
Item.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Order, { foreignKey: 'store_id' });
Order.belongsTo(Store, { foreignKey: 'store_id' });

Item.hasMany(OrderItem, { foreignKey: 'item_id' });
OrderItem.belongsTo(Item, { foreignKey: 'item_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = { Store, User, Item, Order, OrderItem };
