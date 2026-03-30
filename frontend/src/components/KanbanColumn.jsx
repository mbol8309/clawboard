import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Paper, Badge, Text, ActionIcon, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import TaskCard from './TaskCard';
import { STATUS_CONFIG } from './statusColors';

const HEADER_BG = {
  gray: '#f3f4f6',
  blue: '#dbeafe',
  yellow: '#fef9c3',
  orange: '#ffedd5',
  violet: '#ede9fe',
  green: '#dcfce7',
  red: '#fee2e2',
};

export default function KanbanColumn({ status, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef } = useDroppable({ id: status });
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.backlog;

  return (
    <Paper
      withBorder
      radius="md"
      style={{ width: 256, minWidth: 256, display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <Group
        px="sm"
        py="xs"
        justify="space-between"
        style={{
          background: HEADER_BG[cfg.color] || '#f3f4f6',
          borderRadius: 'var(--mantine-radius-md) var(--mantine-radius-md) 0 0',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Group gap="xs">
          <Text size="sm" fw={600}>{cfg.icon} {cfg.label}</Text>
        </Group>
        <Group gap={4}>
          <Badge color={cfg.color} variant="filled" size="sm" circle>
            {tasks.length}
          </Badge>
          {onAddTask && (
            <ActionIcon size="sm" variant="subtle" color={cfg.color} onClick={onAddTask}>
              <IconPlus size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Cards */}
      <Stack
        ref={setNodeRef}
        gap="xs"
        p="xs"
        style={{ flex: 1, minHeight: 100 }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </Stack>
    </Paper>
  );
}
