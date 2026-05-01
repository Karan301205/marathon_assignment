const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Budget = sequelize.define('Budget', {
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false }, // 1-12
  year: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Budget;