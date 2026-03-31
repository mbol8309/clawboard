const express = require('express');
const http = require('http');
const { Task, TaskMessage, Project } = require('../models');
const { verifyToken, authOrApiKey } = require('../middleware/auth');
const router = express.Router();

// Push a OpenClaw hook para procesar una tarea de forma independiente
function notifyAgent(task, action) {
  const HOOK_URL = process.env.OPENCLAW_HOOK_URL || 'http://100.77.100.17:18789/hooks/agent';
  const HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN || 'clawboard-hook-secret';

  const message = `Lee /home/mbolivar/.openclaw/workspace/memory/clawboard-poll.md para las reglas.
Acción requerida: ${action}
Tarea ID: ${task.id}
Título: ${task.title}
Descripción: ${task.description || '(sin descripción)'}
Estado actual: ${task.status}
API Key ClawBoard: noa-agent-key
URL ClawBoard: http://localhost:3003
Procesa SOLO esta tarea de forma independiente.`;

  const body = JSON.stringify({ message, agentId: 'main' });

  const urlObj = new URL(HOOK_URL);
  const req = http.request({
    hostname: urlObj.hostname,
    port: urlObj.port || 80,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HOOK_TOKEN}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => console.log(`[hook] notified agent for task ${task.id}: ${data}`));
  });
  req.on('error', (e) => console.error(`[hook] error notifying agent: ${e.message}`));
  req.write(body);
  req.end();
}

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

// POST /api/tasks — nueva tarea → push si va a backlog
router.post('/', verifyToken, async (req, res) => {
  try {
    const { projectId, title, description, status } = req.body;
    const task = await Task.create({ projectId, title, description, status: status || 'backlog' });
    res.status(201).json(task);
    // Push inmediato si es backlog
    if ((status || 'backlog') === 'backlog') {
      notifyAgent(task, 'Nueva tarea en backlog — analizar y escribir propuesta, mover a proposed');
    }
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

// PATCH /api/tasks/:id/status — cambio de estado → push si es ready o proposed+user
router.patch('/:id/status', authOrApiKey, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });
    if (!task) return res.status(404).json({ error: 'Not found' });
    const oldStatus = task.status;
    const { status } = req.body;
    await task.update({ status });

    // Auto message del cambio
    const isAgent = req.authType === 'apikey';
    await TaskMessage.create({
      taskId: task.id,
      authorType: isAgent ? 'agent' : 'user',
      authorId: isAgent ? null : req.user?.id,
      content: `Status changed: ${oldStatus} → ${status}`,
      taskStatus: status,
    });

    res.json(task);

    // Push según el nuevo estado (solo si lo mueve un usuario, no el agente)
    if (!isAgent) {
      if (status === 'ready') {
        notifyAgent(task, 'Tarea movida a ready por el usuario — implementar lo acordado, mover a in_progress y luego a review con resumen');
      } else if (status === 'proposed') {
        // El usuario comentó y movió de vuelta a proposed con cambios
        notifyAgent(task, 'Tarea en proposed con comentario del usuario — revisar historial y responder con propuesta actualizada');
      }
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tasks/:id/messages — mensaje de usuario en proposed → push
router.post('/:id/messages', authOrApiKey, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    const isAgent = req.authType === 'apikey';
    const msg = await TaskMessage.create({
      taskId: task.id,
      authorType: isAgent ? 'agent' : 'user',
      authorId: isAgent ? null : req.user?.id,
      content: req.body.content,
      taskStatus: task.status,
    });
    res.status(201).json(msg);

    // Si el usuario escribe en proposed → notificar al agente
    if (!isAgent && task.status === 'proposed') {
      notifyAgent(task, 'El usuario respondió en una tarea proposed — leer su mensaje y responder con propuesta actualizada');
    }
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

module.exports = router;
