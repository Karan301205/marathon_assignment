const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Category;