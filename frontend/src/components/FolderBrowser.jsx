import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Modal, Button, Group, Text, Stack, TextInput, ActionIcon, ScrollArea, UnstyledButton, Loader
} from '@mantine/core';
import { IconFolder, IconArrowUp, IconCheck } from '@tabler/icons-react';
import api from '../services/api';

export default function FolderBrowser({ opened, onClose, onSelect, initialPath }) {
  const [currentDir, setCurrentDir] = useState(initialPath || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['browse-folders', currentDir],
    queryFn: async () => (await api.get('/projects/browse-folders', { params: { dir: currentDir || undefined } })).data,
    enabled: opened,
    keepPreviousData: true,
  });

  const handleSelect = () => {
    if (data?.current) {
      onSelect(data.current);
      onClose();
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Seleccionar carpeta del proyecto" size="md">
      <Stack gap="sm">
        <Group gap="xs">
          <ActionIcon
            variant="light"
            disabled={!data?.parent || data?.parent === data?.current}
            onClick={() => setCurrentDir(data.parent)}
          >
            <IconArrowUp size={16} />
          </ActionIcon>
          <TextInput
            flex={1}
            size="xs"
            value={data?.current || currentDir}
            readOnly
            styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
          />
        </Group>

        <ScrollArea h={300} offsetScrollbars>
          {isLoading ? (
            <Group justify="center" py="xl"><Loader size="sm" /></Group>
          ) : error ? (
            <Text c="red" size="sm" ta="center" py="xl">No se puede leer este directorio</Text>
          ) : data?.folders?.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">Carpeta vacía (se puede seleccionar)</Text>
          ) : (
            <Stack gap={2}>
              {data?.folders?.map((folder) => (
                <UnstyledButton
                  key={folder.path}
                  onClick={() => setCurrentDir(folder.path)}
                  px="sm"
                  py={6}
                  style={{ borderRadius: 6 }}
                  className="folder-item"
                  styles={{
                    root: {
                      '&:hover': { backgroundColor: 'var(--mantine-color-gray-1)' },
                    },
                  }}
                >
                  <Group gap="xs">
                    <IconFolder size={16} color="var(--mantine-color-blue-5)" />
                    <Text size="sm">{folder.name}</Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>

        <Group justify="space-between">
          <Text size="xs" c="dimmed" maw={300} truncate>
            {data?.current}
          </Text>
          <Group gap="xs">
            <Button variant="default" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm"
              leftSection={<IconCheck size={14} />}
              onClick={handleSelect}
              disabled={!data?.current}
            >
              Seleccionar
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
