# AGENT.md — ClawBoard

## Descripción
Tablero Kanban para gestión de proyectos y tareas entre Miguel (humano) y Noa (agente IA).
Permite crear proyectos con su repo, gestionar tareas por estados y mantener un historial de conversación por tarea.

## Stack
- **Backend:** Node.js + Express + Sequelize + SQLite (migrable a MySQL)
- **Auth:** JWT (usuarios humanos) + API Key (agente IA)
- **Frontend:** React + Vite + **Mantine** (UI framework) + React Query + @dnd-kit (drag & drop)
- **CI/CD:** GitHub Actions → self-hosted runner Pi (dev)

## Por qué Mantine
- Mobile-first, componentes responsivos por defecto
- Drawer para panel de detalle de tarea (mobile-friendly)
- Timeline para historial de mensajes
- Notifications integradas (reemplaza ToastProvider)
- Modal, Card, Badge, Button ya responsivos y pulidos

## Regla obligatoria — Git
Todo cambio debe pushearse inmediatamente:
```bash
git add -A && git commit -m "descripción" && git push origin dev
```
NO hacer push a main — solo a dev.

## Modelo de datos

### User
- id, email, passwordHash, role (admin | user), active

### Project
- id, name, description, repositoryUrl, status (active | closed | archived), createdBy (FK User)

### Task
- id, projectId (FK), title, description, status (backlog | proposed | ready | in_progress | review | done | error), order (INTEGER, para ordenar en columna)

### TaskMessage
- id, taskId (FK), authorType (user | agent), authorId (FK User, nullable), content (TEXT markdown), taskStatus (estado de la tarea cuando se escribió), createdAt

### ApiKey
- id, userId (FK), name, keyHash, lastUsedAt, active

## Estados de tarea y colores
- backlog → gris (#6b7280)
- proposed → azul (#3b82f6)
- ready → amarillo (#f59e0b)
- in_progress → naranja (#f97316)
- review → morado (#8b5cf6)
- done → verde (#22c55e)
- error → rojo (#ef4444)

## Flujo
1. Miguel crea tarea en backlog
2. Noa hace polling → analiza backlog → escribe propuesta en TaskMessages → mueve a proposed
3. Miguel revisa → conversan en el historial → Miguel mueve a ready
4. Noa ve ready → trabaja → mueve a in_progress → termina → mueve a review con resumen
5. Miguel revisa → done (ok) o ready con notas (cambios) o error

## API para agente IA
Autenticación: header `X-API-Key: <key>`

- `GET /api/agent/tasks?status=backlog,ready` — tareas pendientes
- `GET /api/agent/projects` — proyectos activos
- `POST /api/agent/tasks/:id/messages` — añadir mensaje al historial
- `PATCH /api/agent/tasks/:id/status` — cambiar estado de tarea

## Despliegue
- Dev: http://clawboard.raspberrypi.lan (puerto 3003, Tailscale: http://100.117.252.96 vía nginx)
- Repo: github.com/mbol8309/clawboard (privado)
- Nginx: subdominio clawboard.raspberrypi.lan en Pi
