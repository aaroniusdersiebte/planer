
// src/components/notes/NotesList.jsx
import React from 'react';
import { FiEdit3, FiPlus } from 'react-icons/fi';
import Note from './Note';
import { useAppStore } from '../../store/appStore';

function NotesList() {
  const { notes, addNote } = useAppStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Notizen</h1>
        
        <button
          className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
          onClick={() => {
            addNote('Neue Notiz', '');
            window.electron.hapticFeedback();
          }}
        >
          <FiPlus className="mr-1" />
          <span>Neue Notiz</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <FiEdit3 size={48} className="mx-auto mb-4" />
              <p>Keine Notizen vorhanden</p>
              <p className="text-sm mt-2">Erstelle eine neue Notiz, um loszulegen</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Note key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesList;