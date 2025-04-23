// src/components/tags/TagManager.jsx
import React, { useState } from 'react';
import { FiPlus, FiX, FiCheck, FiTag } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

// Vordefinierte Farben zur Auswahl
const colorOptions = [
  '#f97316', // Orange (Hauptakzentfarbe)
  '#10b981', // Grün
  '#3b82f6', // Blau
  '#8b5cf6', // Lila
  '#ec4899', // Pink
  '#ef4444', // Rot
  '#f59e0b', // Gelb
  '#6366f1'  // Indigo
];

function TagManager({ taskId }) {
  const { tags, addTag, updateTask } = useAppStore();
  const task = useAppStore(state => state.tasks.find(t => t.id === taskId));
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleAddTag = () => {
    if (newTagName.trim()) {
      // Neue Tag erstellen oder vorhandene finden
      let tagId;
      const existingTag = tags.find(
        t => t.name.toLowerCase() === newTagName.trim().toLowerCase()
      );
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const newTag = {
          id: Date.now().toString(),
          name: newTagName.trim(),
          color: selectedColor
        };
        addTag(newTag.name, newTag.color);
        tagId = newTag.id;
      }
      
      // Tag zur Aufgabe hinzufügen
      if (task && !task.tags.includes(tagId)) {
        updateTask(taskId, {
          tags: [...task.tags, tagId]
        });
      }
      
      // Zurücksetzen
      setNewTagName('');
      setIsAddingTag(false);
      setSelectedColor(colorOptions[0]);
      window.electron.hapticFeedback();
    }
  };

  const handleRemoveTag = (tagId) => {
    if (task) {
      updateTask(taskId, {
        tags: task.tags.filter(id => id !== tagId)
      });
      window.electron.hapticFeedback();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagName('');
    }
  };

  // Aktuelle Tags der Aufgabe
  const taskTags = tags.filter(tag => task?.tags.includes(tag.id));

  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {taskTags.map(tag => (
          <div
            key={tag.id}
            className="flex items-center rounded-full px-3 py-1 text-sm"
            style={{ backgroundColor: tag.color }}
          >
            <span>{tag.name}</span>
            <button
              className="ml-2 text-white opacity-70 hover:opacity-100"
              onClick={() => handleRemoveTag(tag.id)}
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>

      {isAddingTag ? (
        <div className="space-y-2">
          <div className="flex">
            <input
              type="text"
              className="flex-1 bg-gray-700 text-white px-2 py-1 text-sm rounded-l outline-none"
              placeholder="Tag-Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            
            <button
              className="text-white px-2 py-1 text-sm rounded-r outline-none"
              style={{ backgroundColor: selectedColor }}
              onClick={handleAddTag}
            >
              <FiCheck size={14} />
            </button>
          </div>
          
          <div className="flex space-x-1">
            {colorOptions.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full ${
                  color === selectedColor ? 'ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          
          <button
            className="text-gray-400 hover:text-gray-300 text-sm"
            onClick={() => setIsAddingTag(false)}
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          className="flex items-center text-gray-400 hover:text-orange-400 text-sm"
          onClick={() => setIsAddingTag(true)}
        >
          <FiPlus className="mr-1" size={14} />
          <span>Tag hinzufügen</span>
        </button>
      )}
    </div>
  );
}

export default TagManager;