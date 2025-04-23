// src/components/tasks/Task.jsx
import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { 
  FiCheck, 
  FiClock, 
  FiChevronDown, 
  FiChevronUp,
  FiEdit,
  FiTrash2
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
    tags
  } = useAppStore();
  
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

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

              {task.description && (
                <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                  {task.description}
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
              {/* Beschreibung */}
              <div className="mb-3">
                <textarea
                  className="w-full bg-gray-700 text-white p-2 rounded resize-none outline-none"
                  placeholder="Beschreibung hinzufügen..."
                  value={task.description}
                  onChange={(e) => 
                    updateTask(task.id, { description: e.target.value })
                  }
                  rows={3}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Unteraufgaben */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Unteraufgaben</h4>
                <SubtaskList taskId={task.id} subtasks={task.subtasks} />
              </div>

              {/* Tags */}
              <TagManager taskId={task.id} />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default Task;