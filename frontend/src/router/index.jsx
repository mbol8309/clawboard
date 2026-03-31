import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProjectBoard from '../pages/ProjectBoard';
import Settings from '../pages/Settings';
import Logs from '../pages/admin/Logs';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore((s) => ({ token: s.token, user: s.user }));
  if (!token) return <Navigate to="/" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/projects/:id', element: <ProtectedRoute><ProjectBoard /></ProtectedRoute> },
  { path: '/settings', element: <ProtectedRoute><Settings /></ProtectedRoute> },
  { path: '/admin/logs', element: <AdminRoute><Logs /></AdminRoute> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
