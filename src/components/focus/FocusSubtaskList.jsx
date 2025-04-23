// src/components/focus/FocusSubtaskList.jsx
import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function FocusSubtaskList({ taskId }) {
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
    <div className="space-y-2">
      {task.subtasks.map((subtask) => (
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
    </div>
  );
}

export default FocusSubtaskList;