import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer, Stack, Group, Text, TextInput, Textarea, Button, Badge,
  Select, Timeline, CloseButton, ScrollArea, Divider, ActionIcon
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconSend, IconRobot, IconUser } from '@tabler/icons-react';
import { STATUS_CONFIG, ALL_STATUSES } from './statusColors';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

function TaskDetailContent({ taskId, onClose, onDeleted }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newMsg, setNewMsg] = useState('');
  const [editTitle, setEditTitle] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}`)).data,
    enabled: !!taskId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [task?.TaskMessages?.length]);

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['task', taskId]);
      qc.invalidateQueries(['tasks']);
      notifications.show({ message: 'Estado actualizado', color: 'green' });
    },
  });

  const updateTask = useMutation({
    mutationFn: (data) => api.put(`/tasks/${taskId}`, data),
    onSuccess: () => { qc.invalidateQueries(['task', taskId]); qc.invalidateQueries(['tasks']); },
  });

  const sendMessage = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/messages`, { content: newMsg }),
    onSuccess: () => { setNewMsg(''); qc.invalidateQueries(['task', taskId]); },
  });

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries(['tasks']);
      onDeleted?.();
      onClose();
      notifications.show({ message: 'Tarea eliminada', color: 'blue' });
    },
  });

  if (isLoading) return <Text p="md" c="dimmed">Cargando...</Text>;
  if (!task) return null;

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.backlog;
  const statusOptions = ALL_STATUSES.map((s) => ({
    value: s,
    label: `${STATUS_CONFIG[s].icon} ${STATUS_CONFIG[s].label}`,
  }));

  return (
    <Stack gap={0} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Group px="md" py="sm" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Stack gap={4} style={{ flex: 1 }}>
          {editTitle !== null ? (
            <TextInput
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => {
                if (editTitle.trim()) updateTask.mutate({ title: editTitle, description: task.description });
                setEditTitle(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              size="sm"
              fw={600}
            />
          ) : (
            <Text
              fw={600}
              size="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => setEditTitle(task.title)}
            >
              {task.title}
            </Text>
          )}
          <Badge color={cfg.color} variant="light" size="sm">{cfg.icon} {cfg.label}</Badge>
        </Stack>
        <CloseButton onClick={onClose} />
      </Group>

      {/* Status select */}
      <Stack px="md" py="sm" gap="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Select
          label="Estado"
          size="sm"
          data={statusOptions}
          value={task.status}
          onChange={(val) => val && updateStatus.mutate(val)}
        />
      </Stack>

      {/* Description */}
      <Stack px="md" py="sm" gap="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Textarea
          label="Descripción"
          size="sm"
          autosize
          minRows={2}
          maxRows={5}
          defaultValue={task.description || ''}
          onBlur={(e) => {
            if (e.target.value !== (task.description || '')) {
              updateTask.mutate({ title: task.title, description: e.target.value });
            }
          }}
          placeholder="Descripción de la tarea..."
        />
      </Stack>

      {/* Messages / Timeline */}
      <ScrollArea style={{ flex: 1 }} px="md" py="sm">
        {task.TaskMessages?.length > 0 ? (
          <Timeline bulletSize={24} lineWidth={2}>
            {task.TaskMessages.map((m) => {
              const mCfg = STATUS_CONFIG[m.taskStatus] || STATUS_CONFIG.backlog;
              const isUser = m.authorType === 'user';
              const time = new Date(m.createdAt).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              });
              return (
                <Timeline.Item
                  key={m.id}
                  color={mCfg.color}
                  bullet={isUser ? <IconUser size={12} /> : <IconRobot size={12} />}
                  title={
                    <Group gap="xs" mb={4}>
                      <Text size="sm" fw={600}>{isUser ? '👤 Miguel' : '🤖 Noa'}</Text>
                      <Badge color={mCfg.color} variant="light" size="xs">{mCfg.label}</Badge>
                      <Text size="xs" c="dimmed">{time}</Text>
                    </Group>
                  }
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
                </Timeline.Item>
              );
            })}
          </Timeline>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="xl">Sin mensajes aún</Text>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <Stack px="md" py="sm" gap="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Group gap="xs" align="flex-end">
          <Textarea
            style={{ flex: 1 }}
            size="sm"
            rows={2}
            placeholder="Escribe un mensaje..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newMsg.trim()) {
                e.preventDefault();
                sendMessage.mutate();
              }
            }}
          />
          <ActionIcon
            size="lg"
            variant="filled"
            disabled={!newMsg.trim() || sendMessage.isPending}
            onClick={() => newMsg.trim() && sendMessage.mutate()}
          >
            <IconSend size={16} />
          </ActionIcon>
        </Group>

        {user?.role === 'admin' && (
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            size="xs"
            onClick={() => deleteTask.mutate()}
            loading={deleteTask.isPending}
          >
            Eliminar tarea
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export default function TaskDetail({ taskId, onClose, onDeleted }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!taskId) return null;

  if (isMobile) {
    return (
      <Drawer
        opened={!!taskId}
        onClose={onClose}
        position="bottom"
        size="90%"
        withCloseButton={false}
        padding={0}
      >
        <TaskDetailContent taskId={taskId} onClose={onClose} onDeleted={onDeleted} />
      </Drawer>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 420,
      background: 'white',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--mantine-color-default-border)',
    }}>
      <TaskDetailContent taskId={taskId} onClose={onClose} onDeleted={onDeleted} />
    </div>
  );
}
