import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppShell, Container, Grid, Card, Badge, Button, Group, Text, Title,
  Modal, TextInput, Textarea, ActionIcon, Anchor, Stack, Loader, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconExternalLink, IconLogout, IconSettings, IconFileText, IconPencil, IconFolder } from '@tabler/icons-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import FolderBrowser from '../components/FolderBrowser';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', repositoryUrl: '', localPath: '', context: '' });
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects?limit=100')).data,
  });

  const createProject = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      closeModal();
      notifications.show({ message: 'Proyecto creado', color: 'green' });
    },
    onError: () => notifications.show({ message: 'Error al crear proyecto', color: 'red' }),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      closeModal();
      notifications.show({ message: 'Proyecto actualizado', color: 'green' });
    },
    onError: () => notifications.show({ message: 'Error al actualizar proyecto', color: 'red' }),
  });

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', repositoryUrl: '', localPath: '', context: '' });
    setShowModal(true);
  };

  const openEdit = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setForm({
      name: project.name || '',
      description: project.description || '',
      repositoryUrl: project.repositoryUrl || '',
      localPath: project.localPath || '',
      context: project.context || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setForm({ name: '', description: '', repositoryUrl: '', localPath: '', context: '' });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, ...form });
    } else {
      createProject.mutate(form);
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Title order={4}>ClawBoard</Title>
            <Badge size="xs" variant="light">beta</Badge>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">{user?.email}</Text>
            {user?.role === 'admin' && (
              <ActionIcon variant="subtle" color="gray" onClick={() => navigate('/settings')}>
                <IconSettings size={18} />
              </ActionIcon>
            )}
            {user?.role === 'admin' && (
              <Tooltip label="Logs">
                <ActionIcon variant="subtle" color="gray" onClick={() => navigate('/admin/logs')}>
                  <IconFileText size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            <ActionIcon variant="subtle" color="red" onClick={() => { logout(); navigate('/'); }}>
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Group justify="space-between" mb="lg">
            <Title order={3}>Proyectos</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Nuevo proyecto
            </Button>
          </Group>

          {isLoading ? (
            <Loader />
          ) : (
            <Grid>
              {data?.data?.map((project) => (
                <Grid.Col key={project.id} span={{ base: 12, sm: 6, lg: 4 }}>
                  <Card
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    component={Link}
                    to={`/projects/${project.id}`}
                    style={{ textDecoration: 'none', cursor: 'pointer' }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>{project.name}</Text>
                      <Group gap={4}>
                        <Tooltip label="Editar proyecto">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={(e) => openEdit(e, project)}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        {project.repositoryUrl && (
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            component="a"
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                    {project.description && (
                      <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                        {project.description}
                      </Text>
                    )}
                    <Group gap="xs">
                      <Badge color={project.status === 'active' ? 'green' : 'gray'} variant="light" size="sm">
                        {project.status}
                      </Badge>
                      {project.context && (
                        <Badge color="blue" variant="light" size="sm">Contexto ✓</Badge>
                      )}
                      {project.localPath && (
                        <Badge color="cyan" variant="light" size="sm" leftSection={<IconFolder size={10} />}>
                          Local
                        </Badge>
                      )}
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Container>
      </AppShell.Main>

      <Modal
        opened={showModal}
        onClose={closeModal}
        title={editingProject ? `Editar: ${editingProject.name}` : 'Nuevo proyecto'}
        size="lg"
      >
        <Stack gap="sm">
          <TextInput
            label="Nombre"
            required
            placeholder="Mi proyecto"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Descripción"
            placeholder="Descripción del proyecto"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextInput
            label="Repository URL"
            placeholder="https://github.com/..."
            value={form.repositoryUrl}
            onChange={(e) => setForm({ ...form, repositoryUrl: e.target.value })}
          />
          <TextInput
            label="Ruta local del proyecto"
            placeholder="Selecciona una carpeta del servidor..."
            value={form.localPath}
            readOnly
            rightSection={
              <ActionIcon variant="subtle" onClick={() => setShowFolderBrowser(true)}>
                <IconFolder size={16} />
              </ActionIcon>
            }
            onClick={() => setShowFolderBrowser(true)}
            styles={{ input: { cursor: 'pointer' } }}
          />
          <Textarea
            label="Contexto técnico del proyecto"
            placeholder="Stack, convenciones, rutas de archivos, librerías principales..."
            description="Este contexto se pasa automáticamente a los modelos de IA al procesar tareas"
            autosize
            minRows={4}
            maxRows={15}
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} loading={isPending}>
              {editingProject ? 'Guardar cambios' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <FolderBrowser
        opened={showFolderBrowser}
        onClose={() => setShowFolderBrowser(false)}
        onSelect={(path) => setForm({ ...form, localPath: path })}
        initialPath={form.localPath}
      />
    </AppShell>
  );
}
