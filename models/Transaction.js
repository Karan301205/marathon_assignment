const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  // DECIMAL(12,2) ensures we handle money correctly without float errors
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  description: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: true }
});

module.exports = Transaction;