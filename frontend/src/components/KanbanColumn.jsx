import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import { STATUS_COLORS, STATUS_LABELS } from './statusColors';

export default function KanbanColumn({ status, tasks, onTaskClick, onAddTask }) {
  const { setNodeRef } = useDroppable({ id: status });
  const colors = STATUS_COLORS[status] || STATUS_COLORS.backlog;

  return (
    <div className="flex flex-col w-64 min-w-[256px] bg-gray-50 rounded-xl border border-gray-200">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{STATUS_LABELS[status]}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>{tasks.length}</span>
          {status === 'backlog' && (
            <button onClick={onAddTask} className={`ml-1 ${colors.text} hover:opacity-70 rounded`}>
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 p-2 flex flex-col gap-2 min-h-[100px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
