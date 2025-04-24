// src/components/sidebar/QuickActions.jsx
import React, { useState } from 'react';
import { FiPlus, FiEdit, FiClock } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import NewTaskModal from '../tasks/NewTaskModal';
import { createNewNote, openEmptyFocusMode } from '../../utils/itemCreationUtils';

function QuickActions() {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const handleQuickNewNote = () => {
    // Die globale Funktion zum Erstellen einer Notiz aufrufen
    createNewNote({ 
      title: 'Neue Notiz', 
      content: ''
    });
  };

  const handleQuickFocusMode = () => {
    // Die globale Funktion zum Öffnen des Fokus-Modus aufrufen
    openEmptyFocusMode();
  };

  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        SHORTCUTS
      </h3>
      
      <div className="space-y-2">
        {/* Neue Aufgabe Button */}
        <button
          className="flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
          onClick={() => setShowNewTaskModal(true)}
        >
          <FiPlus className="mr-2" size={16} />
          <span>Neue Aufgabe</span>
        </button>
        
        <div className="flex space-x-2">
          {/* Neue Notiz Button */}
          <button
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded transition-colors"
            onClick={handleQuickNewNote}
          >
            <FiEdit className="mr-1" size={14} />
            <span>Neue Notiz</span>
          </button>
          
          {/* Fokus-Modus Button */}
          <button
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded transition-colors"
            onClick={handleQuickFocusMode}
          >
            <FiClock className="mr-1" size={14} />
            <span>Fokus-Modus</span>
          </button>
        </div>
      </div>

      {/* Modal für neue Aufgabe */}
      <NewTaskModal 
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />
    </div>
  );
}

export default QuickActions;