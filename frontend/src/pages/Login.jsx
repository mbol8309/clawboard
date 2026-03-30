import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextInput, PasswordInput, Button, Title, Text, Stack, Center
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch {
      notifications.show({ title: 'Error', message: 'Credenciales inválidas', color: 'red' });
    }
  };

  return (
    <Center mih="100vh" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
      <Container size={400} w="100%">
        <Paper shadow="xl" p="xl" radius="md" withBorder>
          <Stack gap="xs" mb="lg" align="center">
            <Title order={2}>ClawBoard</Title>
            <Text size="sm" c="dimmed">Human × AI Kanban</Text>
          </Stack>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="admin@admin.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <PasswordInput
                label="Contraseña"
                error={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" loading={isSubmitting} fullWidth mt="sm">
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}
