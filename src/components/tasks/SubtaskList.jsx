
// src/components/tasks/SubtaskList.jsx
import React, { useState } from 'react';
import { FiPlus, FiCheck, FiX } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function SubtaskList({ taskId, subtasks }) {
  const { addSubtask, updateSubtask, deleteSubtask } = useAppStore();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

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
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* Liste der Unteraufgaben */}
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center group">
          <button
            className={`w-4 h-4 rounded-sm border ${
              subtask.completed 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'border-gray-600 hover:border-orange-500'
            } flex items-center justify-center mr-2`}
            onClick={() => handleToggleComplete(subtask.id, subtask.completed)}
          >
            {subtask.completed && <FiCheck size={10} />}
          </button>
          
          <div 
            className={`flex-1 text-sm ${
              subtask.completed ? 'text-gray-500 line-through' : 'text-white'
            }`}
          >
            {subtask.title}
          </div>
          
          <button
            className="text-red-500 opacity-0 group-hover:opacity-100 p-1"
            onClick={() => deleteSubtask(taskId, subtask.id)}
          >
            <FiX size={14} />
          </button>
        </div>
      ))}

      {/* Neue Unteraufgabe hinzufügen */}
      {isAddingSubtask ? (
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
      )}
    </div>
  );
}

export default SubtaskList;

