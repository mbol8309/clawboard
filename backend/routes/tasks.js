const express = require('express');
const { Task, TaskMessage, Project } = require('../models');
const { verifyToken, authOrApiKey } = require('../middleware/auth');
const router = express.Router();

// GET /api/tasks
router.get('/', verifyToken, async (req, res) => {
  try {
    const { projectId, status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    const offset = (page - 1) * limit;
    const { count, rows } = await Task.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });
    res.json({ total: count, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tasks
router.post('/', verifyToken, async (req, res) => {
  try {
    const { projectId, title, description, status } = req.body;
    const task = await Task.create({ projectId, title, description, status: status || 'backlog' });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tasks/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: TaskMessage, order: [['createdAt', 'ASC']] }]
    });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/tasks/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    const { title, description } = req.body;
    await task.update({ title, description });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', authOrApiKey, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    const oldStatus = task.status;
    const { status } = req.body;
    await task.update({ status });
    // Auto message
    const isAgent = req.authType === 'apikey';
    await TaskMessage.create({
      taskId: task.id,
      authorType: isAgent ? 'agent' : 'user',
      authorId: isAgent ? null : req.user.id,
      content: `Status changed: ${oldStatus} → ${status}`,
      taskStatus: status,
    });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tasks/:id/order
router.patch('/:id/order', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    await task.update({ order: req.body.order });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    await TaskMessage.destroy({ where: { taskId: task.id } });
    await task.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tasks/:id/messages
router.post('/:id/messages', authOrApiKey, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    const isAgent = req.authType === 'apikey';
    const msg = await TaskMessage.create({
      taskId: task.id,
      authorType: isAgent ? 'agent' : 'user',
      authorId: isAgent ? null : req.user.id,
      content: req.body.content,
      taskStatus: task.status,
    });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
