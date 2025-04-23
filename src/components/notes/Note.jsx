// src/components/notes/Note.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiCheck, FiX, FiArrowRight, FiClock } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function Note({ note }) {
  const { updateNote, deleteNote, convertNoteToTask, groups, startFocusMode } = useAppStore();
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showTaskConvert, setShowTaskConvert] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  // Fokus auf Inputs setzen, wenn Bearbeitungsmodus aktiviert wird
  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isEditingContent]);

  const handleSave = () => {
    updateNote(note.id, title, content);
    setIsEditingTitle(false);
    setIsEditingContent(false);
    window.electron.hapticFeedback();
  };

  const handleDelete = () => {
    deleteNote(note.id);
    window.electron.hapticFeedback();
  };

  const handleConvertToTask = () => {
    if (selectedGroupId) {
      convertNoteToTask(note.id, selectedGroupId);
      window.electron.hapticFeedback();
    }
  };

  const handleStartFocus = () => {
    startFocusMode(`note-${note.id}`);
    window.electron.hapticFeedback();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow">
      {/* Titel */}
      <div className="p-3 border-b border-gray-700">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            className="w-full bg-gray-700 text-white p-2 rounded outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              handleSave();
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
                setIsEditingTitle(false);
              }
            }}
          />
        ) : (
          <h3 
            className="text-white font-medium cursor-pointer"
            onClick={() => setIsEditingTitle(true)}
          >
            {note.title || 'Neue Notiz'}
          </h3>
        )}
      </div>

      {/* Inhalt */}
      <div className="p-3">
        {isEditingContent ? (
          <textarea
            ref={contentRef}
            className="w-full bg-gray-700 text-white p-2 rounded resize-none outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => {
              handleSave();
              setIsEditingContent(false);
            }}
            rows={5}
          />
        ) : (
          <div 
            className="text-white whitespace-pre-wrap cursor-pointer min-h-[60px]"
            onClick={() => setIsEditingContent(true)}
          >
            {note.content || 'Klicken, um Inhalt hinzuzufügen...'}
          </div>
        )}
      </div>

      {/* Aktionen */}
      <div className="p-3 border-t border-gray-700 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          <button
            className="text-gray-400 hover:text-orange-400 p-1"
            onClick={handleStartFocus}
            title="Fokus-Modus"
          >
            <FiClock size={16} />
          </button>
          
          <button
            className="text-gray-400 hover:text-orange-400 p-1"
            onClick={() => setShowTaskConvert(!showTaskConvert)}
            title="In Aufgabe umwandeln"
          >
            <FiArrowRight size={16} />
          </button>
          
          <button
            className="text-gray-400 hover:text-red-500 p-1"
            onClick={handleDelete}
            title="Löschen"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      {/* In Aufgabe umwandeln */}
      {showTaskConvert && (
        <div className="p-3 border-t border-gray-700">
          <div className="flex flex-col">
            <div className="text-sm text-gray-400 mb-2">In Aufgabe umwandeln:</div>
            
            <select
              className="bg-gray-700 text-white p-2 rounded mb-2 outline-none"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            
            <div className="flex justify-end space-x-2">
              <button
                className="text-gray-400 hover:text-gray-300 text-sm"
                onClick={() => setShowTaskConvert(false)}
              >
                Abbrechen
              </button>
              
              <button
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                onClick={handleConvertToTask}
              >
                Umwandeln
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Note;