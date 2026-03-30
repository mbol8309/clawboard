import React, { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@mantine/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { ALL_STATUSES } from './statusColors';
import api from '../services/api';

export default function KanbanBoard({ tasks, onTaskClick, onAddTask }) {
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tasksByStatus = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id));
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const targetStatus = ALL_STATUSES.includes(over.id)
      ? over.id
      : tasks.find((t) => t.id === over.id)?.status;
    if (task && targetStatus && task.status !== targetStatus) {
      updateStatus.mutate({ id: task.id, status: targetStatus });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea type="auto">
        <div style={{ display: 'flex', gap: 16, paddingBottom: 16, minWidth: 'max-content' }}>
          {ALL_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={onTaskClick}
              onAddTask={status === 'backlog' ? onAddTask : undefined}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
