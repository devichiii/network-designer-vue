const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // подключение к БД

const Network = sequelize.define('Network', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
});

module.exports = Network;
