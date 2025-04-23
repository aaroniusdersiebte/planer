// src/components/focus/FocusMode.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiClock, FiPlus, FiCheck, FiFolder, FiEdit, FiPause, FiPlay } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import FocusSubtaskList from './FocusSubtaskList';
import TagManager from '../tags/TagManager';
import NoteModal from '../notes/NoteModal';

function FocusMode() {
  // Store-Zugriff
  const { 
    focusTask, 
    stopFocusMode, 
    focusTimer, 
    updateFocusTimer,
    extendFocusTimer,
    updateTask,
    completeTask,
    groups,
    addSubtask,
    notes
  } = useAppStore();

  // Lokaler State
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [customDuration, setCustomDuration] = useState(20);
  const [description, setDescription] = useState('');
  const [showGroupSelect, setShowGroupSelect] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showSeconds, setShowSeconds] = useState(true); // Neuer State für Sekunden-Anzeige

  // Beschreibung aus der Aufgabe laden, wenn sich der Fokus ändert
  useEffect(() => {
    if (focusTask && !focusTask.id?.startsWith('note-')) {
      setDescription(focusTask.description || '');
    }
  }, [focusTask]);

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
      ? "bg-orange-600 hover:bg-orange-700 text-white" 
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

  const handleSaveDescription = () => {
    if (focusTask && !focusTask.id?.startsWith('note-')) {
      updateTask(focusTask.id, { description });
      window.electron.hapticFeedback();
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim() && focusTask && !focusTask.id?.startsWith('note-')) {
      addSubtask(focusTask.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      window.electron.hapticFeedback();
    }
  };

  const handleCompleteTask = () => {
    if (focusTask && !focusTask.id?.startsWith('note-')) {
      completeTask(focusTask.id);
      stopFocusMode();
      window.electron.hapticFeedback();
    }
  };

  const handleMoveToGroup = () => {
    if (selectedGroupId && focusTask) {
      if (focusTask.id?.startsWith('note-')) {
        // Konvertiere Notiz zu Aufgabe
        const noteId = focusTask.id.replace('note-', '');
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

  // Prüfen, ob wir eine Notiz oder eine Aufgabe haben
  const isNote = focusTask?.id?.startsWith('note-');
  const note = isNote ? notes.find(n => n.id === focusTask.id.replace('note-', '')) : null;

  // Wenn keine Aufgabe im Fokus ist, zeige das Popup oder eine einfache Anzeige an
  if (!focusTask) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Fokus-Modus</h1>
          
          <button
            className="text-gray-400 hover:text-white p-1"
            onClick={stopFocusMode}
          >
            <FiX size={24} />
          </button>
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
        
        <button
          className="text-gray-400 hover:text-white p-1"
          onClick={() => {
            if (!isNote) handleSaveDescription();
            stopFocusMode();
          }}
        >
          <FiX size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center p-6">
        {/* Aufgaben-/Notiztitel */}
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          {isNote ? note?.title || 'Notiz' : focusTask.title}
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

          {/* Neuer kreisförmiger Timer */}
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
          {/* Beschreibung */}
          <h3 className="text-lg font-medium text-white mb-2">Beschreibung</h3>
          <textarea
            className="w-full bg-gray-700 text-white p-3 rounded resize-none outline-none mb-4"
            placeholder="Beschreibung hinzufügen..."
            value={isNote ? note?.content || '' : description}
            onChange={(e) => isNote ? null : setDescription(e.target.value)}
            onBlur={isNote ? null : handleSaveDescription}
            rows={5}
            readOnly={isNote} // Nur lesbar für Notizen
          />

          {/* Unteraufgaben (nur für Tasks, nicht für Notizen) */}
          {!isNote && (
            <>
              <h3 className="text-lg font-medium text-white mb-2">Unteraufgaben</h3>
              <div className="bg-gray-700 p-3 rounded mb-4">
                <div className="space-y-2">
                  {/* Live-Update der Unteraufgaben aus dem Store */}
                  <FocusSubtaskList taskId={focusTask.id} />
                  
                  {/* Neue Unteraufgabe hinzufügen */}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      className="bg-gray-600 text-white px-2 py-1 text-sm rounded-l outline-none flex-1"
                      placeholder="Neue Unteraufgabe"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtask();
                      }}
                    />
                    <button
                      className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 text-sm rounded-r"
                      onClick={handleAddSubtask}
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                </div>
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
