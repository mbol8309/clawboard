import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Trash2 } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, ALL_STATUSES } from './statusColors';
import MessageBubble from './MessageBubble';
import api from '../services/api';
import { useToast } from './ToastProvider';

export default function TaskDetail({ taskId, onClose, onDeleted }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [newMsg, setNewMsg] = useState('');
  const [editTitle, setEditTitle] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}`)).data,
    enabled: !!taskId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [task?.TaskMessages?.length]);

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['task', taskId]); qc.invalidateQueries(['tasks']); toast('Estado actualizado', 'success'); },
  });

  const updateTask = useMutation({
    mutationFn: (data) => api.put(`/tasks/${taskId}`, data),
    onSuccess: () => { qc.invalidateQueries(['task', taskId]); qc.invalidateQueries(['tasks']); },
  });

  const sendMessage = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/messages`, { content: newMsg }),
    onSuccess: () => { setNewMsg(''); qc.invalidateQueries(['task', taskId]); },
  });

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); onDeleted?.(); onClose(); toast('Tarea eliminada', 'info'); },
  });

  if (!taskId) return null;

  const colors = task ? (STATUS_COLORS[task.status] || STATUS_COLORS.backlog) : {};

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl flex flex-col z-40 border-l border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200">
        <div className="flex-1 mr-2">
          {editTitle !== null ? (
            <input
              autoFocus
              className="w-full text-base font-semibold border-b border-blue-400 outline-none pb-1"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => { if (editTitle.trim()) updateTask.mutate({ title: editTitle, description: task.description }); setEditTitle(null); }}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            />
          ) : (
            <h2 className="text-base font-semibold text-gray-800 cursor-pointer hover:text-blue-600" onClick={() => setEditTitle(task?.title || '')}>
              {isLoading ? 'Cargando...' : task?.title}
            </h2>
          )}
          {task && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${colors.bg} ${colors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {STATUS_LABELS[task.status]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => deleteTask.mutate()} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded"><X size={18} /></button>
        </div>
      </div>

      {/* Status buttons */}
      {task && (
        <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1">
          {ALL_STATUSES.map((s) => {
            const c = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => updateStatus.mutate(s)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${task.status === s ? `${c.bg} ${c.text} ${c.border} font-semibold` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {task?.TaskMessages?.map((m) => <MessageBubble key={m.id} message={m} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={2}
            placeholder="Escribe un mensaje..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && newMsg.trim()) { e.preventDefault(); sendMessage.mutate(); } }}
          />
          <button
            onClick={() => newMsg.trim() && sendMessage.mutate()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!newMsg.trim() || sendMessage.isPending}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
