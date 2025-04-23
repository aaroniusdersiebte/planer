// src/components/tasks/Task.jsx
import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { 
  FiCheck, 
  FiClock, 
  FiChevronDown, 
  FiChevronUp,
  FiEdit,
  FiTrash2,
  FiSave,
  FiMessageSquare
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import SubtaskList from './SubtaskList';
import TagManager from '../tags/TagManager';

function Task({ task, index, trelloView }) {
  const { 
    completeTask, 
    updateTask, 
    deleteTask,
    startFocusMode,
    groups,
    tags,
    addDescriptionEntry
  } = useAppStore();
  
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [newDescription, setNewDescription] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryText, setEditingEntryText] = useState('');

  // Finde die Gruppenbezeichnung
  const group = groups.find(g => g.id === task.groupId);
  const groupName = group ? group.name : 'Ohne Gruppe';

  // Finde die Tags für diese Aufgabe
  const taskTags = tags.filter(tag => task.tags.includes(tag.id));

  const handleComplete = (e) => {
    e.stopPropagation();
    completeTask(task.id);
    window.electron.hapticFeedback();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
    window.electron.hapticFeedback();
  };

  const handleStartFocus = (e) => {
    e.stopPropagation();
    startFocusMode(task.id);
    window.electron.hapticFeedback();
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleSaveTitle = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim() });
      setEditing(false);
      window.electron.hapticFeedback();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitle(task.title);
      setEditing(false);
    }
  };

  const handleAddDescription = () => {
    if (newDescription.trim()) {
      addDescriptionEntry(task.id, newDescription.trim());
      setNewDescription('');
      window.electron.hapticFeedback();
    }
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddDescription();
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setEditingEntryText(entry.text);
  };

  const handleSaveEditedEntry = () => {
    if (editingEntryText.trim()) {
      updateTask(task.id, {
        descriptionEntries: task.descriptionEntries.map(entry => 
          entry.id === editingEntryId 
            ? { ...entry, text: editingEntryText, editedAt: new Date().toISOString() } 
            : entry
        )
      });
      
      setEditingEntryId(null);
      setEditingEntryText('');
      window.electron.hapticFeedback();
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingEntryText('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Unterschiedliches Layout für Trello-Ansicht
  if (trelloView) {
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <div
            className="bg-gray-700 rounded-md shadow-sm"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <button
                  className={`w-5 h-5 rounded-full border ${
                    task.completed 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-600 hover:border-orange-500'
                  } flex items-center justify-center`}
                  onClick={handleComplete}
                >
                  {task.completed && <FiCheck size={12} />}
                </button>

                <div className="flex space-x-1">
                  <button 
                    className="text-gray-400 hover:text-orange-400 p-1"
                    onClick={handleStartFocus}
                  >
                    <FiClock size={14} />
                  </button>

                  <button 
                    className="text-gray-400 hover:text-red-500 p-1"
                    onClick={handleDelete}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              {editing ? (
                <input
                  type="text"
                  className="bg-gray-600 text-white px-2 py-1 rounded w-full outline-none mb-1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div 
                  className="text-white font-medium mb-1 cursor-pointer"
                  onClick={handleTitleClick}
                >
                  {task.title}
                </div>
              )}

              {/* Anzahl der Notizen anzeigen */}
              {task.descriptionEntries && task.descriptionEntries.length > 0 && (
                <div className="flex items-center text-xs text-gray-400 mb-2">
                  <FiMessageSquare size={12} className="mr-1" />
                  <span>{task.descriptionEntries.length} Notizen</span>
                </div>
              )}

              {/* Tags */}
              {taskTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {taskTags.map(tag => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Unteraufgaben Indikator */}
              {task.subtasks.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} Unteraufgaben
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  }

  // Standard-Layout
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          className="bg-gray-800 rounded-lg shadow"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div 
            className="p-3 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <button
                  className={`w-5 h-5 rounded-full border ${
                    task.completed 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-gray-600 hover:border-orange-500'
                  } flex items-center justify-center mr-3`}
                  onClick={handleComplete}
                >
                  {task.completed && <FiCheck size={12} />}
                </button>

                {editing ? (
                  <input
                    type="text"
                    className="bg-gray-700 text-white px-2 py-1 rounded flex-1 outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex-1">
                    <div 
                      className="text-white font-medium cursor-pointer"
                      onClick={handleTitleClick}
                    >
                      {task.title}
                    </div>
                    <div className="text-xs text-gray-500">{groupName}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Tags */}
                <div className="flex space-x-1 mr-2">
                  {taskTags.map(tag => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                <button 
                  className="text-gray-400 hover:text-orange-400 p-1"
                  onClick={handleEdit}
                >
                  <FiEdit size={16} />
                </button>

                <button 
                  className="text-gray-400 hover:text-orange-400 p-1"
                  onClick={handleStartFocus}
                >
                  <FiClock size={16} />
                </button>

                <button 
                  className="text-gray-400 hover:text-red-500 p-1"
                  onClick={handleDelete}
                >
                  <FiTrash2 size={16} />
                </button>

                <button className="text-gray-400 p-1">
                  {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </button>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="px-3 pb-3 border-t border-gray-700 pt-2">
              {/* Neue Notiz hinzufügen */}
              <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Neue Notiz hinzufügen</h3>
                <div className="flex items-start mb-1">
                  <textarea
                    className="flex-1 bg-gray-700 text-white p-2 rounded resize-none outline-none min-h-[60px]"
                    placeholder="Notiz hinzufügen... (Strg+Enter)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyDown={handleDescriptionKeyDown}
                    rows={2}
                  />
                  <button
                    className="ml-2 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded h-[60px] w-[60px] flex items-center justify-center"
                    onClick={handleAddDescription}
                    disabled={!newDescription.trim()}
                  >
                    <FiSave size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Strg+Enter</p>
              </div>

              {/* Bestehende Notizen */}
              {task.descriptionEntries && task.descriptionEntries.length > 0 && (
                <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Notizen</h3>
                  
                  {task.descriptionEntries.map((entry) => (
                    <div key={entry.id} className="bg-gray-700 rounded p-3 relative">
                      {editingEntryId === entry.id ? (
                        <div>
                          <textarea
                            className="w-full bg-gray-600 text-white p-2 rounded resize-none outline-none mb-2"
                            value={editingEntryText}
                            onChange={(e) => setEditingEntryText(e.target.value)}
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-gray-400 hover:text-gray-300 text-sm"
                              onClick={handleCancelEdit}
                            >
                              Abbrechen
                            </button>
                            <button
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                              onClick={handleSaveEditedEntry}
                            >
                              Speichern
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div 
                            className="whitespace-pre-wrap text-white cursor-pointer"
                            onClick={() => handleEditEntry(entry)}
                          >
                            {entry.text}
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>
                              {formatDate(entry.createdAt)}
                              {entry.editedAt && entry.editedAt !== entry.createdAt && " (bearbeitet)"}
                            </span>
                            <button
                              className="text-gray-400 hover:text-orange-400"
                              onClick={() => handleEditEntry(entry)}
                            >
                              <FiEdit size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Unteraufgaben */}
              <div onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Unteraufgaben</h3>
                <SubtaskList taskId={task.id} subtasks={task.subtasks} />
              </div>

              {/* Tags */}
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                <TagManager taskId={task.id} />
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default Task;