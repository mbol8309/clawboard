const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  return sequelize.define('ApiKey', {
    id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    keyHash: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: true },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  });
};
