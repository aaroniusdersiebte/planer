// src/components/focus/MinimizedFocus.jsx
import React from 'react';
import { FiMaximize2, FiClock } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function MinimizedFocus({ onRestore }) {
  const { focusTask, focusTimer } = useAppStore();
  
  // Formatiere verbleibende Zeit
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    
    return `${mins} Min`;
  };

  // Bestimme den Titel für die minimierte Anzeige
  const title = focusTask
    ? (focusTask.id?.startsWith('note-') 
       ? 'Notiz im Fokus' 
       : `${focusTask.title.substring(0, 20)}${focusTask.title.length > 20 ? '...' : ''}`)
    : 'Fokus-Modus';

  return (
    <div 
      className="fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-lg p-3 flex items-center z-50 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={onRestore}
    >
      <div className="mr-3 bg-orange-600 rounded-full p-2">
        <FiClock size={18} className="text-white" />
      </div>
      
      <div className="flex flex-col mr-3">
        <div className="text-white font-medium text-sm">{title}</div>
        <div className="text-gray-400 text-xs">
          {formatTime(focusTimer.timeLeft)} verbleibend (pausiert)
        </div>
      </div>
      
      <button 
        className="text-gray-400 hover:text-white p-1"
        onClick={(e) => {
          e.stopPropagation();
          onRestore();
        }}
      >
        <FiMaximize2 size={16} />
      </button>
    </div>
  );
}

export default MinimizedFocus;