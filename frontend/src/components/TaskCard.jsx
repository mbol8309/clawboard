import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STATUS_COLORS, STATUS_LABELS } from './statusColors';
import { MessageSquare } from 'lucide-react';

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colors = STATUS_COLORS[task.status] || STATUS_COLORS.backlog;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="text-sm font-medium text-gray-800 mb-2 leading-snug">{task.title}</div>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {STATUS_LABELS[task.status]}
        </span>
        {task.TaskMessages?.length > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <MessageSquare size={12} />
            {task.TaskMessages.length}
          </span>
        )}
      </div>
    </div>
  );
}
