import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@mantine/core';
import KanbanColumn from './KanbanColumn';
import { ALL_STATUSES } from './statusColors';
import api from '../services/api';

export default function KanbanBoard({ tasks, onTaskClick, onAddTask }) {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });

  const tasksByStatus = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);
    if (task && task.status !== newStatus) {
      updateStatus.mutate({ id: draggableId, status: newStatus });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ScrollArea type="auto">
        <div style={{ display: 'flex', gap: 16, paddingBottom: 16, minWidth: 'max-content' }}>
          {ALL_STATUSES.map(status => (
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
    </DragDropContext>
  );
}
