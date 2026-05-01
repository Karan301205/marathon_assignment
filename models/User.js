const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

module.exports = User;