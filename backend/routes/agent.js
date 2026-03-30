const express = require('express');
const { Op } = require('sequelize');
const { Task, TaskMessage, Project } = require('../models');
const { verifyApiKey } = require('../middleware/auth');
const router = express.Router();

router.use(verifyApiKey);

// GET /api/agent/tasks
router.get('/tasks', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = { [Op.in]: status.split(',') };
    const tasks = await Task.findAll({
      where,
      include: [
        { model: Project },
        { model: TaskMessage, order: [['createdAt', 'ASC']] }
      ],
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json({ data: tasks, total: tasks.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agent/projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({ where: { status: 'active' } });
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agent/tasks/:id/messages
router.post('/tasks/:id/messages', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const msg = await TaskMessage.create({
      taskId: task.id,
      authorType: 'agent',
      authorId: null,
      content: req.body.content,
      taskStatus: task.status,
    });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/agent/tasks/:id/status
router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.update({ status: req.body.status });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
