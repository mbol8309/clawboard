const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  return sequelize.define('Task', {
    id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
    projectId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'backlog' },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
  });
};
