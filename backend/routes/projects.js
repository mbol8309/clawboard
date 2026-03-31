const express = require('express');
const fs = require('fs');
const path = require('path');
const { Project, Task } = require('../models');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// GET /api/projects/browse-folders?dir=/some/path
router.get('/browse-folders', async (req, res) => {
  try {
    const dirPath = req.query.dir || (process.platform === 'win32' ? 'C:\\' : '/');
    const resolved = path.resolve(dirPath);

    const entries = await fs.promises.readdir(resolved, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        path: path.join(resolved, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ current: resolved, parent: path.dirname(resolved), folders });
  } catch (err) {
    res.status(400).json({ error: 'No se puede leer el directorio', details: err.message });
  }
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = status ? { status } : {};
    const offset = (page - 1) * limit;
    const { count, rows } = await Project.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });
    res.json({ total: count, page: parseInt(page), limit: parseInt(limit), data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { name, description, repositoryUrl, localPath } = req.body;
    const project = await Project.create({ name, description, repositoryUrl, localPath, createdBy: req.user.id });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, { include: [Task] });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    await project.update(req.body);
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    await project.update({ status: 'archived' });
    res.json({ message: 'Archived' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
