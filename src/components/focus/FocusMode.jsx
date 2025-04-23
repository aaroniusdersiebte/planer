// src/components/focus/FocusMode.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiClock, FiPlus, FiCheck, FiFolder, FiEdit, FiPause, FiPlay, FiSave, FiMinimize2 } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import SubtaskDraggableList from '../tasks/SubtaskDraggableList';
import TagManager from '../tags/TagManager';
import NoteModal from '../notes/NoteModal';

function FocusMode() {
  // Store-Zugriff mit direktem Zugriff auf die aktuelle Note/Task
  const { 
    focusTask: focusTaskRef, // Wir verwenden diese nur als Referenz
    stopFocusMode, 
    minimizeFocusMode,
    focusTimer, 
    updateFocusTimer,
    extendFocusTimer,
    updateTask,
    completeTask,
    groups,
    notes,
    addDescriptionEntry,
    tasks
  } = useAppStore();
  
  // Lokaler State
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [customDuration, setCustomDuration] = useState(20);
  const [newDescription, setNewDescription] = useState('');
  const [showGroupSelect, setShowGroupSelect] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showSeconds, setShowSeconds] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryText, setEditingEntryText] = useState('');

  // Hier holen wir immer die aktuelle Version der Aufgabe/Notiz aus dem Store
  const getCurrentFocusTask = useCallback(() => {
    if (!focusTaskRef) return null;
    
    // Wenn es eine Notiz ist (Format: "note-[id]")
    if (focusTaskRef.id?.startsWith('note-')) {
      const noteId = focusTaskRef.id.replace('note-', '');
      const note = notes.find(n => n.id === noteId);
      
      if (note) {
        return { 
          id: focusTaskRef.id,
          isNote: true,
          data: note
        };
      }
      return null;
    }
    
    // Normale Aufgabe
    const task = tasks.find(t => t.id === focusTaskRef.id);
    if (task) {
      return {
        id: task.id,
        isNote: false,
        data: task
      };
    }
    
    return null;
  }, [focusTaskRef, notes, tasks]);
  
  // Aktuelle Fokus-Aufgabe/Notiz
  const currentFocusTask = getCurrentFocusTask();
  const isNote = currentFocusTask?.isNote || false;
  const focusTask = currentFocusTask?.data || null;

  // Timer-Cleanup
  useEffect(() => {
    return () => {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    };
  }, [timerIntervalId]);

  // Timer-Funktionalität
  useEffect(() => {
    if (focusTimer.isRunning && focusTimer.timeLeft > 0) {
      // Vorherigen Timer löschen, falls vorhanden
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
      
      // Neuen Timer starten
      const intervalId = setInterval(() => {
        updateFocusTimer({ timeLeft: Math.max(0, focusTimer.timeLeft - 1) });
      }, 1000);
      
      setTimerIntervalId(intervalId);
      
      return () => clearInterval(intervalId);
    } else if (!focusTimer.isRunning && timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
      
      // Wenn der Timer abgelaufen ist
      if (focusTimer.timeLeft <= 0) {
        window.electron.hapticFeedback();
      }
    }
  }, [focusTimer.isRunning, focusTimer.timeLeft, updateFocusTimer]);

  // Timer formatieren (unterschiedlich je nach showSeconds)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return showSeconds 
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
        : `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    
    return showSeconds 
      ? `${mins}:${secs.toString().padStart(2, '0')}` 
      : `${mins}`;
  };

  // Timer-Fortschritt in Prozent
  const progress = (focusTimer.timeLeft / focusTimer.duration) * 100;
  // SVG-Parameter für kreisförmigen Timer
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);
  
  // Status-Klasse für Button-Hervorhebung
  const getSecButtonClass = () => {
    return showSeconds 
      ? "bg-gray-600 text-white" 
      : "bg-gray-700 hover:bg-gray-600 text-white";
  };

  // Event-Handler
  const toggleTimer = () => {
    updateFocusTimer({ isRunning: !focusTimer.isRunning });
    window.electron.hapticFeedback();
  };

  const handleToggleSeconds = () => {
    setShowSeconds(!showSeconds);
    window.electron.hapticFeedback();
  };

  const handleExtendTimer = () => {
    extendFocusTimer();
    window.electron.hapticFeedback();
  };

  const handleChangeDuration = () => {
    const newDuration = Math.max(1, customDuration) * 60; // Minuten in Sekunden
    updateFocusTimer({ 
      duration: newDuration,
      timeLeft: newDuration,
      isRunning: false
    });
    window.electron.hapticFeedback();
  };

  const handleAddDescription = () => {
    if (newDescription.trim() && focusTask && !isNote) {
      addDescriptionEntry(focusTask.id, newDescription.trim());
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
    if (editingEntryText.trim() && focusTask && !isNote) {
      updateTask(focusTask.id, {
        descriptionEntries: focusTask.descriptionEntries.map(entry => 
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

  const handleCompleteTask = () => {
    if (focusTask && !isNote) {
      completeTask(focusTask.id);
      stopFocusMode();
      window.electron.hapticFeedback();
    }
  };

  const handleMoveToGroup = () => {
    if (selectedGroupId && focusTask) {
      if (isNote) {
        // Konvertiere Notiz zu Aufgabe
        const noteId = currentFocusTask.id.replace('note-', '');
        const { convertNoteToTask } = useAppStore.getState();
        convertNoteToTask(noteId, selectedGroupId);
        stopFocusMode();
      } else {
        // Verschiebe bestehende Aufgabe
        updateTask(focusTask.id, { groupId: selectedGroupId });
      }
      setShowGroupSelect(false);
      window.electron.hapticFeedback();
    }
  };

  const handleMinimize = () => {
    // Timer pausieren und Fokus-Modus minimieren
    updateFocusTimer({ isRunning: false });
    minimizeFocusMode();
    window.electron.hapticFeedback();
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

  // Wenn keine Aufgabe im Fokus ist, zeige das Popup oder eine einfache Anzeige an
  if (!focusTask) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Fokus-Modus</h1>
          
          <div className="flex items-center">
            <button
              className="text-gray-400 hover:text-white p-1 mr-2"
              onClick={handleMinimize}
              title="Minimieren"
            >
              <FiMinimize2 size={20} />
            </button>
            
            <button
              className="text-gray-400 hover:text-white p-1"
              onClick={stopFocusMode}
              title="Schließen"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">Was möchtest du im Fokus tun?</h2>
            
            <div className="flex flex-col space-y-4 items-center">
              <button
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg flex items-center w-64"
                onClick={() => setShowNoteModal(true)}
              >
                <FiEdit className="mr-3" size={20} />
                <span>Neue Notiz erstellen</span>
              </button>
              
              <button
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg flex items-center w-64"
                onClick={stopFocusMode}
              >
                <FiX className="mr-3" size={20} />
                <span>Zurück zur Übersicht</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Notiz-Modal */}
        <NoteModal 
          isOpen={showNoteModal} 
          onClose={() => setShowNoteModal(false)} 
        />
      </div>
    );
  }

  // Hauptansicht mit Aufgabe oder Notiz im Fokus
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Fokus-Modus</h1>
        
        <div className="flex items-center">
          <button
            className="text-gray-400 hover:text-white p-1 mr-2"
            onClick={handleMinimize}
            title="Minimieren"
          >
            <FiMinimize2 size={20} />
          </button>
          
          <button
            className="text-gray-400 hover:text-white p-1"
            onClick={stopFocusMode}
            title="Schließen"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center p-6">
        {/* Aufgaben-/Notiztitel */}
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          {isNote ? focusTask.title || 'Notiz' : focusTask.title}
        </h2>

        {/* Timer-Einstellung */}
        <div className="mb-8 w-full max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <input
                type="number"
                className="w-16 bg-gray-700 text-white rounded p-1 text-center mr-2"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                min="1"
              />
              <span className="text-white">Minuten</span>
            </div>
            
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
              onClick={handleChangeDuration}
            >
              Timer setzen
            </button>
          </div>

          {/* Kreisförmiger Timer */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Hintergrundkreis */}
              <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 150 150">
                <circle 
                  cx="75" 
                  cy="75" 
                  r={radius}
                  fill="transparent" 
                  stroke="#374151" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="75" 
                  cy="75" 
                  r={radius}
                  fill="transparent" 
                  stroke="#EF6C00" 
                  strokeWidth="10" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Timer-Anzeige */}
              <div className="text-4xl font-mono text-white select-none">
                {formatTime(focusTimer.timeLeft)}
              </div>
            </div>
            
            {/* Timer Steuerungselemente */}
            <div className="flex mt-4 space-x-3">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
                onClick={toggleTimer}
              >
                {focusTimer.isRunning ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>
              
              <button
                className={`${getSecButtonClass()} w-12 h-12 rounded-full flex items-center justify-center transition-all`}
                onClick={handleToggleSeconds}
                title="Sekunden anzeigen/ausblenden"
              >
                <span className="font-mono text-sm font-bold">SEK</span>
              </button>
              
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center"
                onClick={handleExtendTimer}
              >
                <FiPlus className="mr-1" size={14} />
                <span>5 Min</span>
              </button>
            </div>
          </div>
        </div>

        {/* Aufgaben-/Notizdetails */}
        <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl mb-6">
          {/* Neue Notiz hinzufügen (für Aufgaben) */}
          {!isNote && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Neue Notiz hinzufügen</h3>
              <div className="flex items-start">
                <textarea
                  className="flex-1 bg-gray-700 text-white p-3 rounded resize-none outline-none min-h-[60px]"
                  placeholder="Neue Notiz hinzufügen... (Strg+Enter)"
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
              <p className="text-xs text-gray-500 mt-1">Strg+Enter</p>
            </div>
          )}

          {/* Bestehende Notizen für Aufgaben */}
          {!isNote && focusTask.descriptionEntries && focusTask.descriptionEntries.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Notizen</h3>
              <div className="space-y-3">
                {focusTask.descriptionEntries.map((entry) => (
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
            </div>
          )}

          {/* Notizinhalt (für Notizen) */}
          {isNote && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Inhalt</h3>
              <textarea
                className="w-full bg-gray-700 text-white p-3 rounded resize-none outline-none cursor-pointer"
                placeholder="Notiz hinzufügen..."
                value={focusTask.content || ''}
                readOnly={true}
                rows={5}
                onClick={() => {
                  // Würde hier die Bearbeitung aktivieren, wenn es möglich wäre
                  // In der aktuellen Struktur können wir nur in der Notizen-Übersicht bearbeiten
                }}
              />
            </div>
          )}

          {/* Unteraufgaben (nur für Tasks, nicht für Notizen) */}
          {!isNote && (
            <>
              <h3 className="text-lg font-medium text-white mb-2">Unteraufgaben</h3>
              <div className="bg-gray-700 p-3 rounded mb-4">
                {focusTask && (
                  <SubtaskDraggableList taskId={focusTask.id} />
                )}
              </div>
            </>
          )}

          {/* Tags für Aufgaben */}
          {!isNote && (
            <>
              <h3 className="text-lg font-medium text-white mb-2">Tags</h3>
              <div className="bg-gray-700 p-3 rounded">
                <TagManager taskId={focusTask.id} />
              </div>
            </>
          )}
        </div>

        {/* Aktionsbuttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {/* In Gruppe verschieben/konvertieren */}
          {showGroupSelect ? (
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex flex-col">
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
                    onClick={() => setShowGroupSelect(false)}
                  >
                    Abbrechen
                  </button>
                  
                  <button
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                    onClick={handleMoveToGroup}
                  >
                    {isNote ? 'Konvertieren' : 'Verschieben'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
              onClick={() => setShowGroupSelect(true)}
            >
              <FiFolder className="mr-2" size={18} />
              <span>{isNote ? 'In Aufgabe umwandeln' : 'In Gruppe verschieben'}</span>
            </button>
          )}

          {/* Notiz-Button */}
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
            onClick={() => setShowNoteModal(true)}
          >
            <FiEdit className="mr-2" size={18} />
            <span>Neue Notiz</span>
          </button>

          {/* Fertig-Button (nur für Aufgaben) */}
          {!isNote && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              onClick={handleCompleteTask}
            >
              <FiCheck className="mr-2" size={18} />
              <span>Aufgabe abschließen</span>
            </button>
          )}
        </div>

        {/* Notiz-Modal */}
        <NoteModal 
          isOpen={showNoteModal} 
          onClose={() => setShowNoteModal(false)} 
        />
      </div>
    </div>
  );
}

export default FocusMode;