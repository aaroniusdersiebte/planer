// src/components/focus/SubtaskDraggableList.jsx
import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { FiCheck, FiX, FiMenu } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function SubtaskDraggableList({ taskId }) {
  const { tasks, updateSubtask, deleteSubtask } = useAppStore();
  
  // Hole die aktuelle Aufgabe direkt aus dem Store für Echtzeit-Updates
  const task = tasks.find(t => t.id === taskId);
  
  if (!task || !task.subtasks || task.subtasks.length === 0) {
    return <div className="text-gray-400 text-sm">Keine Unteraufgaben vorhanden</div>;
  }

  const handleToggleComplete = (subtaskId, completed) => {
    updateSubtask(taskId, subtaskId, { completed: !completed });
    window.electron.hapticFeedback();
  };

  return (
    <Droppable droppableId={taskId} type="subtask">
      {(provided) => (
        <div 
          className="space-y-2"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {task.subtasks.map((subtask, index) => (
            <Draggable 
              key={subtask.id} 
              draggableId={subtask.id} 
              index={index}
            >
              {(provided) => (
                <div 
                  className="flex items-center group bg-gray-600 rounded-sm px-2 py-1"
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                >
                  {/* Drag Handle */}
                  <div 
                    className="text-gray-500 cursor-grab pr-2" 
                    {...provided.dragHandleProps}
                  >
                    <FiMenu size={14} />
                  </div>
                  
                  {/* Checkbox */}
                  <button
                    className={`w-4 h-4 rounded-sm border ${
                      subtask.completed 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-500 hover:border-orange-500'
                    } flex items-center justify-center mr-2`}
                    onClick={() => handleToggleComplete(subtask.id, subtask.completed)}
                  >
                    {subtask.completed && <FiCheck size={10} />}
                  </button>
                  
                  {/* Subtask Title */}
                  <div 
                    className={`flex-1 text-sm ${
                      subtask.completed ? 'text-gray-500 line-through' : 'text-white'
                    }`}
                  >
                    {subtask.title}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    className="text-red-500 opacity-0 group-hover:opacity-100 p-1"
                    onClick={() => deleteSubtask(taskId, subtask.id)}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default SubtaskDraggableList;