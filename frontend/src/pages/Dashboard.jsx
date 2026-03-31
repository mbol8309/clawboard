import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppShell, Container, Grid, Card, Badge, Button, Group, Text, Title,
  Modal, TextInput, Textarea, ActionIcon, Anchor, Stack, Loader
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconExternalLink, IconLogout, IconSettings, IconFileText } from '@tabler/icons-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', repositoryUrl: '', context: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects?limit=100')).data,
  });

  const createProject = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      setShowModal(false);
      setForm({ name: '', description: '', repositoryUrl: '', context: '' });
      notifications.show({ message: 'Proyecto creado', color: 'green' });
    },
    onError: () => notifications.show({ message: 'Error al crear proyecto', color: 'red' }),
  });

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
    >
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
              <ActionIcon variant="subtle" color="gray" title="Logs" onClick={() => navigate('/admin/logs')}>
                <IconFileText size={18} />
              </ActionIcon>
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
            <Button leftSection={<IconPlus size={16} />} onClick={() => setShowModal(true)}>
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
                    {project.description && (
                      <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                        {project.description}
                      </Text>
                    )}
                    <Badge
                      color={project.status === 'active' ? 'green' : 'gray'}
                      variant="light"
                      size="sm"
                    >
                      {project.status}
                    </Badge>
                    {project.context && (
                      <Badge color="blue" variant="light" size="sm" ml="xs">
                        Contexto ✓
                      </Badge>
                    )}
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Container>
      </AppShell.Main>

      <Modal opened={showModal} onClose={() => setShowModal(false)} title="Nuevo proyecto">
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
          <Textarea
            label="Contexto técnico del proyecto"
            placeholder="Stack, convenciones, rutas de archivos, librerías principales..."
            description="Este contexto se pasa automáticamente a los modelos de IA al procesar tareas"
            autosize
            minRows={4}
            maxRows={12}
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              onClick={() => form.name.trim() && createProject.mutate(form)}
              disabled={!form.name.trim()}
              loading={createProject.isPending}
            >
              Crear
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
