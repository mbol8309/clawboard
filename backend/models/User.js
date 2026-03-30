const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  });
};
