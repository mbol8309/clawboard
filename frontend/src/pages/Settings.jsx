import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container, Title, Table, Button, Modal, TextInput, Badge,
  Group, ActionIcon, Text, Stack, Code, CopyButton, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlus, IconTrash, IconCopy, IconCheck } from '@tabler/icons-react';
import api from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const { data: keys } = useQuery({
    queryKey: ['apikeys'],
    queryFn: async () => (await api.get('/apikeys')).data,
  });

  const createKey = useMutation({
    mutationFn: (name) => api.post('/apikeys', { name }),
    onSuccess: (res) => {
      qc.invalidateQueries(['apikeys']);
      setRevealedKey(res.data.key);
      setNewKeyName('');
      setShowCreate(false);
    },
    onError: () => notifications.show({ message: 'Error al crear key', color: 'red' }),
  });

  const revokeKey = useMutation({
    mutationFn: (id) => api.delete(`/apikeys/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['apikeys']);
      notifications.show({ message: 'Key revocada', color: 'blue' });
    },
  });

  const rows = keys?.map((k) => (
    <Table.Tr key={k.id}>
      <Table.Td>
        <Text fw={500} size="sm">{k.name}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color="green" variant="light" size="sm">activa</Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('es-ES') : 'Nunca'}
        </Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon color="red" variant="subtle" onClick={() => revokeKey.mutate(k.id)}>
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="md" py="xl">
      <Group mb="lg" gap="sm">
        <ActionIcon variant="subtle" color="gray" onClick={() => navigate('/dashboard')}>
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Title order={3}>Configuración — API Keys</Title>
      </Group>

      <Group justify="space-between" mb="md">
        <Text fw={500} c="dimmed">API Keys activas</Text>
        <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => setShowCreate(true)}>
          Nueva key
        </Button>
      </Group>

      <Table withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Último uso</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows?.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed" ta="center" py="sm">No hay API keys</Text>
              </Table.Td>
            </Table.Tr>
          ) : rows}
        </Table.Tbody>
      </Table>

      {/* Create modal */}
      <Modal opened={showCreate} onClose={() => setShowCreate(false)} title="Nueva API Key">
        <Stack gap="sm">
          <TextInput
            autoFocus
            label="Nombre"
            placeholder="Noa Agent"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              disabled={!newKeyName.trim()}
              loading={createKey.isPending}
              onClick={() => newKeyName.trim() && createKey.mutate(newKeyName)}
            >
              Crear
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reveal key modal */}
      <Modal opened={!!revealedKey} onClose={() => setRevealedKey(null)} title="⚠️ Guarda esta key">
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Esta es la única vez que verás esta key. Cópiala ahora.</Text>
          <Code block style={{ wordBreak: 'break-all' }}>{revealedKey}</Code>
          <Group justify="flex-end">
            <CopyButton value={revealedKey || ''} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado!' : 'Copiar'} withArrow position="right">
                  <Button
                    color={copied ? 'teal' : 'blue'}
                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    onClick={copy}
                  >
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
            <Button variant="default" onClick={() => setRevealedKey(null)}>Cerrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
