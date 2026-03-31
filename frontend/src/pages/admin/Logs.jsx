import { useState, useEffect, useCallback } from 'react';
import {
  Box, Select, TextInput, ScrollArea, Pagination, Button, Group,
  Text, Title, Stack, Paper, Loader, Center
} from '@mantine/core';
import { IconRefresh, IconSearch, IconFileText } from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3003';

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Logs() {
  const token = useAuthStore((s) => s.token);
  const headers = { Authorization: `Bearer ${token}` };

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 500);

  // Load file list
  useEffect(() => {
    fetch(`${API}/api/logs`, { headers })
      .then(r => r.json())
      .then(d => {
        setFiles(d.files || []);
        if (d.files?.length > 0 && !selectedFile) setSelectedFile(d.files[0].name);
      })
      .catch(() => {});
  }, [refreshKey]);

  // Load log content
  const fetchLogs = useCallback(() => {
    if (!selectedFile) return;
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 200 });
    if (debouncedSearch) params.set('search', debouncedSearch);
    fetch(`${API}/api/logs/${selectedFile}?${params}`, { headers })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedFile, page, debouncedSearch, refreshKey]);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedFile]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const fileOptions = files.map(f => ({ value: f.name, label: `${f.date} (${(f.size / 1024).toFixed(1)} KB)` }));

  return (
    <Box p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}><IconFileText size={20} style={{ marginRight: 6 }} />Logs</Title>
        <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => setRefreshKey(k => k + 1)}>
          Refresh
        </Button>
      </Group>

      <Stack gap="sm" mb="md">
        <Select
          label="Fichero de log"
          placeholder="Selecciona un fichero"
          data={fileOptions}
          value={selectedFile}
          onChange={setSelectedFile}
        />
        <TextInput
          label="Buscar"
          placeholder="Filtrar líneas..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
        />
      </Stack>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <Paper withBorder>
          <ScrollArea h={500}>
            <Box p="sm" style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {data?.lines?.length === 0 && <Text c="dimmed">No hay líneas.</Text>}
              {data?.lines?.map((line, i) => (
                <Text key={i} size="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{line}</Text>
              ))}
            </Box>
          </ScrollArea>
        </Paper>
      )}

      {data && data.total > 200 && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(data.total / 200)}
          />
        </Group>
      )}
    </Box>
  );
}
