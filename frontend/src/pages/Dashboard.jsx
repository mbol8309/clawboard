import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, LogOut, Settings } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';
import { STATUS_COLORS, STATUS_LABELS } from '../components/statusColors';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const toast = useToast();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', repositoryUrl: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects?limit=100')).data,
  });

  const createProject = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => { qc.invalidateQueries(['projects']); setShowModal(false); setForm({ name: '', description: '', repositoryUrl: '' }); toast('Proyecto creado', 'success'); },
    onError: () => toast('Error al crear proyecto', 'error'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">ClawBoard</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">beta</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.email}</span>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/settings')} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><Settings size={18} /></button>
          )}
          <button onClick={() => { logout(); navigate('/'); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><LogOut size={18} /></button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Proyectos</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Nuevo proyecto
          </button>
        </div>

        {isLoading ? (
          <div className="text-gray-400 text-sm">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-gray-800">{project.name}</h2>
                  {project.repositoryUrl && (
                    <a href={project.repositoryUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-blue-500">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                {project.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-4">Nuevo proyecto</h2>
            <div className="flex flex-col gap-3">
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Repository URL" value={form.repositoryUrl} onChange={(e) => setForm({ ...form, repositoryUrl: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => form.name.trim() && createProject.mutate(form)} disabled={!form.name.trim() || createProject.isPending} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
