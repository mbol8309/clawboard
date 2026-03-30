const express = require('express');
const { Task, TaskMessage, Project } = require('../models');
const { verifyApiKey } = require('../middleware/auth');
const router = express.Router();

router.use(verifyApiKey);

// GET /api/agent/tasks
router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status.split(',');
    const tasks = await Task.findAll({
      where,
      include: [
        { model: Project },
        { model: TaskMessage, limit: 10, order: [['createdAt', 'DESC']] }
      ],
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agent/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({ where: { status: 'active' } });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
