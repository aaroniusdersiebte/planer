// src/components/tags/TagManager.jsx
import React, { useState } from 'react';
import { FiPlus, FiX, FiCheck, FiTag, FiSearch } from 'react-icons/fi';
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
  const [isSelectingExistingTag, setIsSelectingExistingTag] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Bereits verwendete Tags, die nicht an aktueller Aufgabe sind
  const availableTags = tags.filter(tag => !task?.tags.includes(tag.id));
  
  // Filtere Tags basierend auf Suchanfrage
  const filteredAvailableTags = tagSearchQuery 
    ? availableTags.filter(tag => 
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    : availableTags;

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

  const handleUseExistingTag = (tagId) => {
    if (task) {
      updateTask(taskId, {
        tags: [...task.tags, tagId]
      });
      setIsSelectingExistingTag(false);
      setTagSearchQuery('');
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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSelectingExistingTag(false);
      setTagSearchQuery('');
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

      {/* Bestehenden Tag auswählen */}
      {isSelectingExistingTag && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center bg-gray-700 rounded">
            <FiSearch className="ml-2 text-gray-400" size={14} />
            <input
              type="text"
              className="flex-1 bg-transparent text-white px-2 py-1 text-sm outline-none"
              placeholder="Tag suchen..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            {tagSearchQuery && (
              <button
                className="mr-1 text-gray-400 hover:text-gray-300"
                onClick={() => setTagSearchQuery('')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          
          <div className="max-h-40 overflow-y-auto bg-gray-700 rounded">
            {filteredAvailableTags.length > 0 ? (
              <div className="p-1">
                {filteredAvailableTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-2 py-1 hover:bg-gray-600 rounded cursor-pointer"
                    onClick={() => handleUseExistingTag(tag.id)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <span className="text-white text-sm">{tag.name}</span>
                    </div>
                    <button
                      className="text-gray-400 hover:text-orange-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseExistingTag(tag.id);
                      }}
                    >
                      <FiPlus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-center text-gray-400 text-sm">
                {tagSearchQuery ? "Keine passenden Tags gefunden" : "Keine Tags verfügbar"}
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              className="text-gray-400 hover:text-gray-300 text-sm"
              onClick={() => {
                setIsSelectingExistingTag(false);
                setTagSearchQuery('');
              }}
            >
              Abbrechen
            </button>
            
            <button
              className="text-orange-400 hover:text-orange-500 text-sm flex items-center"
              onClick={() => {
                setIsSelectingExistingTag(false);
                setIsAddingTag(true);
              }}
            >
              <FiPlus size={12} className="mr-1" />
              Neuen Tag erstellen
            </button>
          </div>
        </div>
      )}

      {/* Neuen Tag erstellen */}
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
          
          <div className="flex justify-between">
            <button
              className="text-gray-400 hover:text-gray-300 text-sm"
              onClick={() => setIsAddingTag(false)}
            >
              Abbrechen
            </button>
            
            {availableTags.length > 0 && (
              <button
                className="text-orange-400 hover:text-orange-500 text-sm flex items-center"
                onClick={() => {
                  setIsAddingTag(false);
                  setIsSelectingExistingTag(true);
                }}
              >
                <FiTag size={12} className="mr-1" />
                Bestehenden Tag verwenden
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button
            className="flex items-center text-gray-400 hover:text-orange-400 text-sm"
            onClick={() => setIsAddingTag(true)}
          >
            <FiPlus className="mr-1" size={14} />
            <span>Tag hinzufügen</span>
          </button>
          
          {availableTags.length > 0 && !isSelectingExistingTag && (
            <button
              className="flex items-center text-gray-400 hover:text-orange-400 text-sm"
              onClick={() => setIsSelectingExistingTag(true)}
            >
              <FiTag className="mr-1" size={14} />
              <span>Bestehenden Tag verwenden</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TagManager;