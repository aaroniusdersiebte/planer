// src/components/notes/NoteModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { createNewNote } from '../../utils/itemCreationUtils';

function NoteModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('Neue Notiz');
  const [content, setContent] = useState('');
  const [openInFocus, setOpenInFocus] = useState(true);

  // Reset Felder, wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setTitle('Neue Notiz');
      setContent('');
      setOpenInFocus(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    // Globale Funktion zum Erstellen einer Notiz verwenden
    createNewNote({
      title: title.trim() || 'Neue Notiz',
      content,
      openInFocus
    });
    
    // Modal schließen
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Neue Notiz</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Titel
          </label>
          <input
            className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Titel der Notiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Inhalt
          </label>
          <textarea
            className="w-full bg-gray-700 text-white p-3 rounded resize-none outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Notizinhalt"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="openInFocus"
            className="mr-2"
            checked={openInFocus}
            onChange={(e) => setOpenInFocus(e.target.checked)}
          />
          <label htmlFor="openInFocus" className="text-gray-300 text-sm">
            Im Fokus-Modus öffnen
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={handleSave}
          >
            <FiSave className="mr-2" />
            <span>Notiz speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;