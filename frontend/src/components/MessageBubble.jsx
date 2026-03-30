import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from './statusColors';

export default function MessageBubble({ message }) {
  const isUser = message.authorType === 'user';
  const colors = STATUS_COLORS[message.taskStatus] || STATUS_COLORS.backlog;
  const time = new Date(message.createdAt).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 ${colors.bg} ${colors.border} border`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-600">{isUser ? 'Miguel' : 'Noa 🌊'}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
            {STATUS_LABELS[message.taskStatus] || message.taskStatus}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{time}</span>
        </div>
        <div className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
