const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  return sequelize.define('TaskMessage', {
    id: { type: DataTypes.UUID, defaultValue: () => uuidv4(), primaryKey: true },
    taskId: { type: DataTypes.UUID, allowNull: false },
    authorType: { type: DataTypes.STRING, allowNull: false }, // 'user' | 'agent'
    authorId: { type: DataTypes.UUID, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    taskStatus: { type: DataTypes.STRING, allowNull: false },
  });
};
