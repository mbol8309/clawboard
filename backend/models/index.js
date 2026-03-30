const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
});

const User = require('./User')(sequelize);
const Project = require('./Project')(sequelize);
const Task = require('./Task')(sequelize);
const TaskMessage = require('./TaskMessage')(sequelize);
const ApiKey = require('./ApiKey')(sequelize);

// Associations
User.hasMany(Project, { foreignKey: 'createdBy' });
Project.belongsTo(User, { foreignKey: 'createdBy' });

Project.hasMany(Task, { foreignKey: 'projectId' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

Task.hasMany(TaskMessage, { foreignKey: 'taskId' });
TaskMessage.belongsTo(Task, { foreignKey: 'taskId' });

User.hasMany(ApiKey, { foreignKey: 'userId' });
ApiKey.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Project, Task, TaskMessage, ApiKey };
