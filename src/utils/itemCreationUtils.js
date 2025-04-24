// src/utils/itemCreationUtils.js
import { useAppStore } from '../store/appStore';

/**
 * Erstellt eine neue Notiz und öffnet sie optional im Fokus-Modus
 * @param {Object} options - Optionen für die Notiz
 * @param {string} options.title - Titel der Notiz (optional)
 * @param {string} options.content - Inhalt der Notiz (optional)
 * @param {boolean} options.openInFocus - Ob die Notiz im Fokus-Modus geöffnet werden soll
 * @returns {string} ID der erstellten Notiz
 */
export const createNewNote = (options = {}) => {
  const { 
    title = 'Neue Notiz', 
    content = '', 
    openInFocus = false 
  } = options;
  
  // Hole die Funktionen aus dem Store
  const { addNote, startFocusMode, setView } = useAppStore.getState();
  
  // Erstelle die Notiz
  const noteId = addNote(title, content);
  
  // Visuelle Bestätigung
  window.electron.hapticFeedback();
  
  // Wechsle zur Notizen-Ansicht, wenn nicht im Fokus-Modus geöffnet
  if (!openInFocus) {
    setView('notes');
  } else {
    // Öffne im Fokus-Modus mit einer kurzen Verzögerung (damit die Notiz gespeichert ist)
    setTimeout(() => {
      startFocusMode(`note-${noteId}`);
    }, 100);
  }
  
  return noteId;
};

/**
 * Erstellt eine neue Aufgabe und öffnet sie optional im Fokus-Modus
 * @param {Object} options - Optionen für die Aufgabe
 * @param {string} options.title - Titel der Aufgabe (optional)
 * @param {string} options.groupId - ID der Gruppe (optional)
 * @param {Array} options.subtasks - Array von Unteraufgaben (optional)
 * @param {boolean} options.openInFocus - Ob die Aufgabe im Fokus-Modus geöffnet werden soll
 * @returns {string} ID der erstellten Aufgabe
 */
export const createNewTask = (options = {}) => {
  // Hole die Store-Funktionen
  const { addTask, addSubtask, startFocusMode, setView, groups } = useAppStore.getState();
  
  // Standardwerte und übergebene Optionen
  const { 
    title = 'Neue Aufgabe',
    groupId = groups.length > 0 ? groups[0].id : null,
    subtasks = [],
    openInFocus = false
  } = options;
  
  // Erstelle die Aufgabe
  const taskId = addTask(groupId, title);
  
  // Füge Unteraufgaben hinzu, falls vorhanden
  if (subtasks.length > 0) {
    subtasks.forEach(subtaskTitle => {
      addSubtask(taskId, subtaskTitle);
    });
  }
  
  // Visuelle Bestätigung
  window.electron.hapticFeedback();
  
  // Wechsle zur entsprechenden Ansicht oder Fokus-Modus
  if (!openInFocus) {
    if (groupId) {
      setView(`group-${groupId}`);
    } else {
      setView('all');
    }
  } else {
    // Öffne im Fokus-Modus mit einer kurzen Verzögerung (damit die Aufgabe gespeichert ist)
    setTimeout(() => {
      startFocusMode(taskId);
    }, 100);
  }
  
  return taskId;
};

/**
 * Öffnet den leeren Fokus-Modus für die Erstellung neuer Elemente
 */
export const openEmptyFocusMode = () => {
  const { startFocusMode } = useAppStore.getState();
  startFocusMode();
  window.electron.hapticFeedback();
};