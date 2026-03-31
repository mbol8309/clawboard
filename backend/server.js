require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize, User, ApiKey } = require('./models');
const logger = require('./config/logger');
const cron = require('node-cron');
const { notifyPendingTasks } = require('./jobs/taskPoller');

const app = express();
app.use(cors());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/apikeys', require('./routes/apikeys'));
app.use('/api/logs', require('./routes/logs'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Cron: cada 5 minutos revisar tareas pendientes
cron.schedule('*/5 * * * *', () => {
  notifyPendingTasks();
});

const seedAdmin = async () => {
  const existing = await User.findOne({ where: { email: 'admin@admin.com' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await User.create({ email: 'admin@admin.com', passwordHash, role: 'admin' });
    console.log('Admin user created');
  }
  const noaKeyExists = await ApiKey.findOne({ where: { name: 'Noa Agent' } });
  if (!noaKeyExists) {
    const keyHash = await bcrypt.hash('noa-agent-key', 10);
    await ApiKey.create({ name: 'Noa Agent', keyHash });
    console.log('Noa Agent API key created');
  }
};

const start = async () => {
  await sequelize.sync({ alter: false });
  await seedAdmin();
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log(`ClawBoard API running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = { app, sequelize, seedAdmin };
