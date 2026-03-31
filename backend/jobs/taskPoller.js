const { Task, TaskMessage, Project } = require('../models');
const http = require('http');

const HOOK_URL = process.env.OPENCLAW_HOOK_URL || 'http://localhost:18799/hooks/wake';
const HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN || 'clawboard-hook-secret';

function sendWake(text) {
  const body = JSON.stringify({ text, mode: 'now' });
  const urlObj = new URL(HOOK_URL);
  const req = http.request({
    hostname: urlObj.hostname, port: parseInt(urlObj.port) || 80, path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HOOK_TOKEN}`,
      'Content-Length': Buffer.byteLength(body),
    }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => console.log(`[poller] wake sent: ${d.substring(0, 50)}`));
  });
  req.on('error', e => console.error(`[poller] error: ${e.message}`));
  req.write(body); req.end();
}

async function notifyPendingTasks() {
  try {
    // Tareas en backlog
    const backlog = await Task.findAll({
      where: { status: 'backlog' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });

    // Tareas en ready
    const ready = await Task.findAll({
      where: { status: 'ready' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });

    // Tareas en proposed con último mensaje de usuario
    const proposed = await Task.findAll({
      where: { status: 'proposed' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });
    const proposedPending = proposed.filter(t => {
      const msgs = t.TaskMessages || [];
      return msgs.length > 0 && msgs[0].authorType === 'user';
    });

    // Tareas en review con último mensaje de usuario
    const review = await Task.findAll({
      where: { status: 'review' },
      include: [Project, { model: TaskMessage, order: [['createdAt', 'DESC']], limit: 1 }]
    });
    const reviewPending = review.filter(t => {
      const msgs = t.TaskMessages || [];
      return msgs.length > 0 && msgs[0].authorType === 'user';
    });

    const pending = [...backlog, ...ready, ...proposedPending, ...reviewPending];

    if (pending.length === 0) {
      console.log('[poller] no pending tasks');
      return;
    }

    console.log(`[poller] ${pending.length} tasks need attention`);

    for (const task of pending) {
      const lastMsg = (task.TaskMessages || [])[0];
      const lastMsgText = lastMsg ? `Último mensaje (${lastMsg.authorType}): ${(lastMsg.content || '').substring(0, 150)}` : 'Sin mensajes previos';
      const projectCtx = task.Project?.context ? `\n\nContexto técnico:\n${task.Project.context.substring(0, 400)}` : '';

      const text = `ClawBoard tarea pendiente.
ID: ${task.id}
Estado: ${task.status}
Título: ${task.title}

Lee /home/mbolivar/.openclaw/workspace/memory/clawboard-poll.md y procesa esta tarea usando su ID.`;

      sendWake(text);
      await new Promise(r => setTimeout(r, 30000));
    }
  } catch (err) {
    console.error('[poller] error:', err.message);
  }
}

module.exports = { notifyPendingTasks };
