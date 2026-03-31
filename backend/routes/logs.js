const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');

// GET /api/logs — lista ficheros disponibles
router.get('/', verifyToken, requireRole('admin'), (req, res) => {
  try {
    if (!fs.existsSync(LOG_DIR)) return res.json({ files: [] });
    const files = fs.readdirSync(LOG_DIR)
      .filter(f => f.endsWith('.log'))
      .sort().reverse()
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(LOG_DIR, f)).size,
        date: f.replace('app-', '').replace('.log', ''),
      }));
    res.json({ files });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/logs/:filename — contenido del fichero
router.get('/:filename', verifyToken, requireRole('admin'), (req, res) => {
  try {
    const filename = req.params.filename.replace(/[^a-zA-Z0-9\-\.]/g, '');
    const filePath = path.join(LOG_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    const { page = 1, limit = 200, search } = req.query;
    let lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).reverse();

    if (search) lines = lines.filter(l => l.toLowerCase().includes(search.toLowerCase()));

    const total = lines.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const data = lines.slice(offset, offset + parseInt(limit));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), lines: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
