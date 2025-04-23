// src/components/tasks/SubtaskDraggableList.jsx
import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { FiPlus, FiCheck, FiX, FiMenu } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

// Gemeinsame Komponente für Aufgaben- und Fokus-Ansicht
function SubtaskDraggableList({ taskId, allowAdding = true }) {
  const { tasks, addSubtask, updateSubtask, deleteSubtask } = useAppStore();
  
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  
  // Hole die aktuelle Aufgabe direkt aus dem Store für Echtzeit-Updates
  const task = tasks.find(t => t.id === taskId);
  
  if (!task || !task.subtasks) {
    return <div className="text-gray-400 text-sm">Keine Unteraufgaben vorhanden</div>;
  }

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      window.electron.hapticFeedback();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleComplete = (subtaskId, completed) => {
    updateSubtask(taskId, subtaskId, { completed: !completed });
    window.electron.hapticFeedback();
  };

  return (
    <div className="space-y-2" onClick={(e) => e && e.stopPropagation()}>
      {/* Liste der Unteraufgaben mit Drag & Drop */}
      <Droppable droppableId={taskId} type="subtask">
        {(provided) => (
          <div 
            className="space-y-2"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {task.subtasks.length === 0 ? (
              <div className="text-gray-400 text-sm">Keine Unteraufgaben vorhanden</div>
            ) : (
              task.subtasks.map((subtask, index) => (
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
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Neue Unteraufgabe hinzufügen */}
      {allowAdding && (
        isAddingSubtask ? (
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 bg-gray-700 text-white px-2 py-1 text-sm rounded outline-none"
              placeholder="Neue Unteraufgabe"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            
            <button
              className="ml-2 text-green-500 hover:text-green-400 p-1"
              onClick={handleAddSubtask}
            >
              <FiCheck size={14} />
            </button>
            
            <button
              className="text-red-500 hover:text-red-400 p-1"
              onClick={() => {
                setIsAddingSubtask(false);
                setNewSubtaskTitle('');
              }}
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center text-gray-400 hover:text-orange-400 text-sm"
            onClick={() => setIsAddingSubtask(true)}
          >
            <FiPlus className="mr-1" size={14} />
            <span>Unteraufgabe hinzufügen</span>
          </button>
        )
      )}
    </div>
  );
}

export default SubtaskDraggableList;