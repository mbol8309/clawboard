import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Copy, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

export default function Settings() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [copied, setCopied] = useState(false);

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
    onError: () => toast('Error al crear key', 'error'),
  });

  const revokeKey = useMutation({
    mutationFn: (id) => api.delete(`/apikeys/${id}`),
    onSuccess: () => { qc.invalidateQueries(['apikeys']); toast('Key revocada', 'info'); },
  });

  const copyKey = () => {
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></button>
        <h1 className="text-base font-bold text-gray-900">Configuración — API Keys</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">API Keys activas</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={14} /> Nueva key
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {keys?.length === 0 && <div className="px-4 py-3 text-sm text-gray-400">No hay API keys</div>}
          {keys?.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm text-gray-800">{k.name}</div>
                <div className="text-xs text-gray-400">
                  {k.lastUsedAt ? `Último uso: ${new Date(k.lastUsedAt).toLocaleString('es-ES')}` : 'Nunca usado'}
                </div>
              </div>
              <button onClick={() => revokeKey.mutate(k.id)} className="text-gray-400 hover:text-red-500 p-1 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold mb-3">Nueva API Key</h2>
            <input
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Nombre (ej: Noa Agent)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancelar</button>
              <button onClick={() => newKeyName.trim() && createKey.mutate(newKeyName)} disabled={!newKeyName.trim()} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal key modal */}
      {revealedKey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold mb-2">⚠️ Guarda esta key</h2>
            <p className="text-sm text-gray-500 mb-3">Esta es la única vez que verás esta key. Cópiala ahora.</p>
            <div className="bg-gray-100 rounded-lg px-4 py-3 font-mono text-sm break-all text-gray-800 mb-4">{revealedKey}</div>
            <div className="flex gap-2">
              <button onClick={copyKey} className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button onClick={() => setRevealedKey(null)} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
