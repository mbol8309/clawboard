const { Task, TaskMessage, Project } = require('../models');
const { Op } = require('sequelize');
const http = require('http');

const HOOK_URL = process.env.OPENCLAW_HOOK_URL || 'http://localhost:18799/hooks/wake';
const HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN || 'clawboard-hook-secret';

function sendWake(text) {
  const body = JSON.stringify({ text, mode: 'now' });
  const urlObj = new URL(HOOK_URL);
  const req = http.request({
    hostname: urlObj.hostname, port: urlObj.port || 80, path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HOOK_TOKEN}`,
      'Content-Length': Buffer.byteLength(body),
    }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => console.log(`[poller] wake sent: ${d}`));
  });
  req.on('error', e => console.error(`[poller] error: ${e.message}`));
  req.write(body); req.end();
}

async function notifyPendingTasks() {
  try {
    // Tareas en backlog
    const backlog = await Task.findAll({ where: { status: 'backlog' }, include: [Project] });

    // Tareas en ready
    const ready = await Task.findAll({ where: { status: 'ready' }, include: [Project] });

    // Tareas en proposed con último mensaje de usuario
    const proposed = await Task.findAll({
      where: { status: 'proposed' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });
    const proposedWithUserMsg = proposed.filter(t => {
      const msgs = t.TaskMessages || [];
      return msgs.length > 0 && msgs[0].authorType === 'user';
    });

    // Tareas en review con último mensaje de usuario
    const review = await Task.findAll({
      where: { status: 'review' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });
    const reviewWithUserMsg = review.filter(t => {
      const msgs = t.TaskMessages || [];
      return msgs.length > 0 && msgs[0].authorType === 'user';
    });

    const pending = [...backlog, ...ready, ...proposedWithUserMsg, ...reviewWithUserMsg];

    if (pending.length === 0) {
      console.log('[poller] no pending tasks');
      return;
    }

    console.log(`[poller] ${pending.length} tasks need attention`);

    // Enviar un wake por cada tarea
    for (const task of pending) {
      const text = `ClawBoard poll: tarea "${task.title}" (ID: ${task.id}, estado: ${task.status}, proyecto: ${task.Project?.name}). Lee /home/mbolivar/.openclaw/workspace/memory/clawboard-poll.md y actúa.`;
      sendWake(text);
      // Esperar 30s entre tareas para no saturar
      await new Promise(r => setTimeout(r, 30000));
    }
  } catch (err) {
    console.error('[poller] error:', err.message);
  }
}

module.exports = { notifyPendingTasks };
