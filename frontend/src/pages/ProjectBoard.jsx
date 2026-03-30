import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppShell, Group, Title, Text, Button, ActionIcon, Anchor, Modal, TextInput, Textarea
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetail from '../components/TaskDetail';
import api from '../services/api';

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => (await api.get(`/tasks?projectId=${id}&limit=200`)).data,
    refetchInterval: 10000,
  });

  const createTask = useMutation({
    mutationFn: ({ title, description }) => api.post('/tasks', { projectId: id, title, description }),
    onSuccess: () => {
      qc.invalidateQueries(['tasks', id]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowAddTask(false);
      notifications.show({ message: 'Tarea creada', color: 'green' });
    },
  });

  const tasks = tasksData?.data || [];

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <ActionIcon variant="subtle" color="gray" onClick={() => navigate('/dashboard')}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={5} style={{ lineHeight: 1.2 }}>{project?.name || 'Cargando...'}</Title>
            {project?.repositoryUrl && (
              <Anchor href={project.repositoryUrl} target="_blank" size="xs">
                {project.repositoryUrl}
              </Anchor>
            )}
          </div>
          <Button
            leftSection={<IconPlus size={14} />}
            size="xs"
            ml="auto"
            onClick={() => setShowAddTask(true)}
          >
            Tarea
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
            onAddTask={() => setShowAddTask(true)}
          />
        </div>
      </AppShell.Main>

      {/* Task detail panel */}
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onDeleted={() => { qc.invalidateQueries(['tasks', id]); }}
        />
      )}

      {/* Add task modal */}
      <Modal opened={showAddTask} onClose={() => setShowAddTask(false)} title="Nueva tarea">
        <TextInput
          autoFocus
          placeholder="Título de la tarea"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          mb="sm"
        />
        <Textarea
          placeholder="Descripción (opcional)"
          value={newTaskDesc}
          onChange={(e) => setNewTaskDesc(e.target.value)}
          autosize
          minRows={2}
          maxRows={5}
          mb="sm"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskDesc(''); }}>Cancelar</Button>
          <Button
            disabled={!newTaskTitle.trim()}
            loading={createTask.isPending}
            onClick={() => newTaskTitle.trim() && createTask.mutate({ title: newTaskTitle, description: newTaskDesc })}
          >
            Crear
          </Button>
        </Group>
      </Modal>
    </AppShell>
  );
}
