// src/components/notes/NoteModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function NoteModal({ isOpen, onClose }) {
  const { addNote, startFocusMode } = useAppStore();
  const [title, setTitle] = useState('Neue Notiz');
  const [content, setContent] = useState('');

  // Reset Felder, wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      setTitle('Neue Notiz');
      setContent('');
    }
  }, [isOpen]);

  const handleSave = () => {
    // Notiz erstellen
    const note = {
      id: Date.now().toString(),
      title: title.trim() || 'Neue Notiz',
      content,
      createdAt: new Date().toISOString()
    };
    
    // Notiz hinzufügen
    addNote(note.title, note.content);
    
    // Feedback
    window.electron.hapticFeedback();
    
    // Modal schließen
    onClose();
    
    // Neue Notiz im Fokus-Modus öffnen
    setTimeout(() => {
      startFocusMode(`note-${note.id}`);
    }, 100);
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
          <input
            className="w-full bg-gray-700 text-white p-3 rounded outline-none mb-2"
            placeholder="Titel der Notiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <textarea
            className="w-full bg-gray-700 text-white p-3 rounded resize-none outline-none"
            placeholder="Notizinhalt"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
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