const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ApiKey } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireRole('admin'));

// GET /api/apikeys
router.get('/', async (req, res) => {
  try {
    const keys = await ApiKey.findAll({ where: { active: true } });
    res.json(keys.map(k => ({ id: k.id, name: k.name, userId: k.userId, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/apikeys
router.post('/', async (req, res) => {
  try {
    const { name, userId } = req.body;
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);
    const apiKey = await ApiKey.create({ name, keyHash, userId: userId || null });
    res.status(201).json({ id: apiKey.id, name: apiKey.name, key: rawKey });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/apikeys/:id
router.delete('/:id', async (req, res) => {
  try {
    const apiKey = await ApiKey.findByPk(req.params.id);
    if (!apiKey) return res.status(404).json({ error: 'Not found' });
    await apiKey.update({ active: false });
    res.json({ message: 'Revoked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
