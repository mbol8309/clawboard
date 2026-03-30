import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetail from '../components/TaskDetail';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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
    mutationFn: (title) => api.post('/tasks', { projectId: id, title }),
    onSuccess: () => { qc.invalidateQueries(['tasks', id]); setNewTaskTitle(''); setShowAddTask(false); toast('Tarea creada', 'success'); },
  });

  const tasks = tasksData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-base font-bold text-gray-900">{project?.name || 'Cargando...'}</h1>
          {project?.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{project.repositoryUrl}</a>
          )}
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={14} /> Tarea
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-6">
        <KanbanBoard
          tasks={tasks}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
          onAddTask={() => setShowAddTask(true)}
        />
      </div>

      {/* Task detail panel */}
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onDeleted={() => { qc.invalidateQueries(['tasks', id]); }}
        />
      )}

      {/* Add task modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-3">Nueva tarea</h2>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Título de la tarea"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newTaskTitle.trim() && createTask.mutate(newTaskTitle)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddTask(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button onClick={() => newTaskTitle.trim() && createTask.mutate(newTaskTitle)} disabled={!newTaskTitle.trim()} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
