# AGENT.md — ClawBoard

## Descripción
Tablero Kanban para gestión de proyectos y tareas entre Miguel (humano) y Noa (agente IA).
Permite crear proyectos con su repo y contexto técnico, gestionar tareas por estados y mantener historial de conversación por tarea.

## Stack
- **Backend:** Node.js + Express + Sequelize + SQLite (migrable a MySQL)
- **Auth:** JWT (usuarios humanos) + API Key (agente IA)
- **Logs:** Winston con rotación diaria (`logs/app-YYYY-MM-DD.log`, 30 días)
- **Cron interno:** node-cron cada 5 min — revisa tareas pendientes y notifica al agente
- **Frontend:** React + Vite + Mantine (UI) + React Query + @hello-pangea/dnd (drag & drop)
- **CI/CD:** GitHub Actions → self-hosted runner Pi (dev)

## Regla obligatoria — Git
Todo cambio debe pushearse inmediatamente:
```bash
git add -A && git commit -m "descripción" && git push origin dev
```
NO hacer push a main — solo a dev.

## Modelo de datos

### Project
- id, name, description, repositoryUrl, status (active|closed|archived), createdBy (FK User)
- **context** (TEXT) — contexto técnico del proyecto en markdown (stack, rutas, convenciones, etc.)

### Task
- id, projectId (FK), title, description, status, order (INTEGER)

### TaskMessage
- id, taskId (FK), authorType (user|agent), authorId (FK nullable), content (TEXT markdown), taskStatus (estado cuando se escribió), createdAt

### ApiKey
- id, name, keyHash, lastUsedAt, active

---

## Estados de tarea y colores
- `backlog` → gris — tarea creada por Miguel, pendiente de análisis
- `proposed` → azul — Noa escribió su propuesta, esperando respuesta de Miguel
- `ready` → amarillo — Miguel aprobó, lista para implementar
- `in_progress` → naranja — Noa está implementando
- `review` → morado — implementado y desplegado, Miguel revisa
- `done` → verde — validado por Miguel
- `error` → rojo — algo falló durante la implementación

---

## Flujo completo

### Miguel crea tarea en backlog
→ Backend dispara `POST /hooks/wake` al gateway de OpenClaw via túnel SSH (localhost:18799)
→ Noa recibe el wake, lee `clawboard-poll.md` y actúa

### Noa procesa backlog
1. Lee título, descripción y contexto del proyecto (`task.Project.context`)
2. Escribe propuesta técnica en el historial: `POST /api/agent/tasks/:id/messages`
3. Mueve a `proposed`: `PATCH /api/agent/tasks/:id/status`

### Miguel revisa proposed
- Si está de acuerdo → mueve a `ready`
- Si quiere cambios → escribe mensaje → backend dispara wake → Noa responde y ajusta

### Noa procesa ready
1. Lee historial completo para entender qué hacer exactamente
2. Mueve a `in_progress`
3. Implementa el código
4. **OBLIGATORIO:** pushea a `dev` + despliega en Pi antes de mover a review
5. Escribe resumen con URL donde se puede ver: `POST /api/agent/tasks/:id/messages`
6. Mueve a `review`
7. Si falla → mueve a `error` con explicación

### Miguel revisa review
- Si OK → mueve a `done`
- Si hay cambios → mueve a `ready` con comentario → Noa reimplementa
- Si hay fallos → comenta en review → Noa responde y propone corrección → vuelve a `proposed`

### Cron interno (node-cron cada 5 min)
- Revisa tareas en: `backlog`, `ready`, `proposed` (último msg de usuario), `review` (último msg de usuario)
- Por cada tarea pendiente: dispara `POST /hooks/wake` con contexto de la tarea
- Espera 30s entre tareas para no saturar el agente
- Es la red de seguridad cuando algún push inmediato falló

---

## Sistema de notificaciones (push inmediato)

En `backend/routes/tasks.js`, función `notifyAgent()` que llama a `POST http://localhost:18799/hooks/wake`:

| Evento | Cuándo se dispara |
|--------|------------------|
| Nueva tarea creada | `POST /api/tasks` con status=backlog |
| Tarea movida a ready | `PATCH /api/tasks/:id/status` → ready (por usuario) |
| Tarea movida a proposed con cambios | `PATCH /api/tasks/:id/status` → proposed (por usuario) |
| Mensaje de usuario en proposed | `POST /api/tasks/:id/messages` (por usuario, tarea en proposed) |

El hook llega al gateway de OpenClaw via **túnel SSH reverso** (PC → Pi, puerto 18799).
Servicio: `gateway-tunnel.service` (systemd user, autorestarta si cae).

---

## API para el agente IA
Autenticación: header `X-API-Key: noa-agent-key`

- `GET /api/agent/tasks?status=backlog,ready,proposed,review` — tareas con contexto completo (incluye Project.context y TaskMessages)
- `GET /api/agent/projects` — proyectos activos
- `POST /api/agent/tasks/:id/messages` — añadir mensaje como agente
- `PATCH /api/agent/tasks/:id/status` — cambiar estado

---

## Infraestructura de despliegue

### Dev (Raspberry Pi)
- Frontend: http://100.117.252.96:8080 (Tailscale) | http://clawboard.raspberrypi.lan (LAN)
- Backend: puerto 3003, systemd `clawboard-api`
- BD: SQLite en `/srv/projects/clawboard/backend/database.sqlite`
- Logs: `/srv/projects/clawboard/backend/logs/`

### Túnel SSH (PC → Pi)
- Servicio: `~/.config/systemd/user/gateway-tunnel.service`
- Expone gateway OpenClaw (PC:18789) como Pi:18799
- Comando: `ssh -R 18799:127.0.0.1:18789 mbolivar@100.117.252.96`

### Instrucciones de acción del agente
Ver: `/home/mbolivar/.openclaw/workspace/memory/clawboard-poll.md`

---

## Comandos útiles
```bash
# Build y deploy frontend
cd /home/mbolivar/Projects/clawboard/frontend && npm run build
rsync -av dist/ mbolivar@raspberrypi.lan:/srv/projects/clawboard/frontend/

# Deploy backend
rsync -av --exclude='node_modules' --exclude='.git' --exclude='database.sqlite' --exclude='.env' --exclude='logs/' \
  /home/mbolivar/Projects/clawboard/backend/ mbolivar@raspberrypi.lan:/srv/projects/clawboard/backend/
ssh mbolivar@raspberrypi.lan "cd /srv/projects/clawboard/backend && npm install --omit=dev && sudo systemctl restart clawboard-api"

# Ver logs en tiempo real
ssh mbolivar@raspberrypi.lan "tail -f /srv/projects/clawboard/backend/logs/app-\$(date +%Y-%m-%d).log"

# Estado del túnel
systemctl --user status gateway-tunnel
```
