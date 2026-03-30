import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Badge, Text, Group, Stack } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { STATUS_CONFIG } from './statusColors';

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog;

  return (
    <Paper
      ref={setNodeRef}
      style={{ ...style, cursor: 'pointer' }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      shadow="xs"
      p="sm"
      radius="md"
      withBorder
      styles={{
        root: {
          '&:hover': { boxShadow: 'var(--mantine-shadow-md)' }
        }
      }}
    >
      <Stack gap={6}>
        <Text fw={600} size="sm" style={{ lineHeight: 1.3 }}>{task.title}</Text>
        <Group justify="space-between">
          <Badge color={cfg.color} variant="light" size="sm">
            {cfg.icon} {cfg.label}
          </Badge>
          {task.TaskMessages?.length > 0 && (
            <Group gap={4}>
              <IconMessage size={12} color="gray" />
              <Text size="xs" c="dimmed">{task.TaskMessages.length}</Text>
            </Group>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
