// src/components/tasks/NewTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiCheck } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import { createNewTask } from '../../utils/itemCreationUtils';

function NewTaskModal({ isOpen, onClose }) {
  const { groups } = useAppStore();
  const [title, setTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [stayOpen, setStayOpen] = useState(false);

  // Setze die erste Gruppe als Standard
  useEffect(() => {
    if (isOpen && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [isOpen, groups, selectedGroupId]);

  // Reset Formular beim Öffnen
  useEffect(() => {
    if (isOpen) {
      setTitle('Neue Aufgabe');
      setSubtasks([]);
      setNewSubtask('');
    }
  }, [isOpen]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleSave = () => {
    if (!title.trim() || !selectedGroupId) return;

    // Globale Funktion verwenden
    createNewTask({
      title: title.trim(), 
      groupId: selectedGroupId,
      subtasks: subtasks,
      openInFocus: false
    });
    
    // Formular zurücksetzen für neue Aufgabe
    if (stayOpen) {
      setTitle('Neue Aufgabe');
      setSubtasks([]);
      setNewSubtask('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Neue Aufgabe</h2>
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
            placeholder="Aufgabentitel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Gruppe
          </label>
          <select
            className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-1 focus:ring-orange-500"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Unteraufgaben
          </label>
          
          {/* Liste der bereits hinzugefügten Unteraufgaben */}
          {subtasks.length > 0 && (
            <div className="mb-3 space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center bg-gray-700 rounded p-2">
                  <span className="flex-1 text-white">{subtask}</span>
                  <button
                    className="text-red-500 hover:text-red-400 ml-2"
                    onClick={() => handleRemoveSubtask(index)}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Eingabefeld für neue Unteraufgabe */}
          <div className="flex items-center">
            <input
              className="flex-1 bg-gray-700 text-white p-2 rounded-l outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="Neue Unteraufgabe hinzufügen"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
            />
            <button
              className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-r"
              onClick={handleAddSubtask}
            >
              <FiPlus size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="stayOpen"
            className="mr-2"
            checked={stayOpen}
            onChange={(e) => setStayOpen(e.target.checked)}
          />
          <label htmlFor="stayOpen" className="text-gray-300 text-sm">
            Nach Speichern geöffnet lassen
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={handleSave}
            disabled={!title.trim() || !selectedGroupId}
          >
            <FiSave className="mr-2" />
            <span>Aufgabe speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewTaskModal;