import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Paper, Badge, Text, ActionIcon, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import TaskCard from './TaskCard';
import { STATUS_CONFIG } from './statusColors';

const HEADER_BG = {
  gray: '#f3f4f6', blue: '#dbeafe', yellow: '#fef9c3',
  orange: '#ffedd5', violet: '#ede9fe', green: '#dcfce7', red: '#fee2e2',
};

export default function KanbanColumn({ status, tasks, onTaskClick, onAddTask }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.backlog;

  return (
    <Paper withBorder radius="md" style={{ width: 256, minWidth: 256, display: 'flex', flexDirection: 'column' }}>
      <Group px="sm" py="xs" justify="space-between" style={{
        background: HEADER_BG[cfg.color] || '#f3f4f6',
        borderRadius: 'var(--mantine-radius-md) var(--mantine-radius-md) 0 0',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}>
        <Text size="sm" fw={600}>{cfg.icon} {cfg.label}</Text>
        <Group gap={4}>
          <Badge color={cfg.color} variant="filled" size="sm" circle>{tasks.length}</Badge>
          {onAddTask && (
            <ActionIcon size="sm" variant="subtle" color={cfg.color} onClick={onAddTask}>
              <IconPlus size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            gap="xs"
            p="xs"
            style={{
              flex: 1,
              minHeight: 120,
              background: snapshot.isDraggingOver ? `${HEADER_BG[cfg.color]}` : 'transparent',
              transition: 'background 0.15s',
              borderRadius: '0 0 var(--mantine-radius-md) var(--mantine-radius-md)',
            }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.85 : 1,
                    }}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick(task)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <Text size="xs" c="dimmed" ta="center" py="md">Arrastra aquí</Text>
            )}
          </Stack>
        )}
      </Droppable>
    </Paper>
  );
}
