import React from 'react';
import { Paper, Badge, Text, Group, Stack } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { STATUS_CONFIG } from './statusColors';

export default function TaskCard({ task, onClick }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog;

  return (
    <Paper
      style={{ cursor: 'pointer' }}
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
