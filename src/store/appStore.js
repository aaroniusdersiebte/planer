// src/store/appStore.js
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export const useAppStore = create((set, get) => ({
  // App-Daten
  groups: [],
  tasks: [],
  tags: [],
  notes: [],
  archivedTasks: [],
  
  // UI-Status
  view: 'all', // 'all', 'group-[id]', 'notes'
  selectedTaskId: null,
  searchQuery: '',
  focusModeActive: false,
  focusTask: null,
  focusTimer: {
    duration: 20 * 60, // 20 Minuten in Sekunden
    timeLeft: 20 * 60,
    isRunning: false
  },

  // Daten initialisieren
  initializeData: async () => {
    try {
      const groups = await window.electron.getData('groups') || [];
      const tasks = await window.electron.getData('tasks') || [];
      const tags = await window.electron.getData('tags') || [];
      const notes = await window.electron.getData('notes') || [];
      const archivedTasks = await window.electron.getData('archivedTasks') || [];

      set({ groups, tasks, tags, notes, archivedTasks });
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback auf leere Arrays, um App-Abstürze zu vermeiden
      set({ groups: [], tasks: [], tags: [], notes: [], archivedTasks: [] });
    }
  },

  // Daten speichern
  saveData: async () => {
    const { groups, tasks, tags, notes, archivedTasks } = get();
    
    try {
      await window.electron.saveData('groups', groups);
      await window.electron.saveData('tasks', tasks);
      await window.electron.saveData('tags', tags);
      await window.electron.saveData('notes', notes);
      await window.electron.saveData('archivedTasks', archivedTasks);
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
    }
  },

  // Gruppen-Funktionen
  addGroup: (name) => {
    const newGroup = {
      id: nanoid(),
      name,
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const newGroups = [...state.groups, newGroup];
      window.electron.saveData('groups', newGroups);
      return { groups: newGroups };
    });
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) => 
        group.id === id ? { ...group, ...updates } : group
      );
      window.electron.saveData('groups', updatedGroups);
      return { groups: updatedGroups };
    });
  },

  deleteGroup: (id) => {
    set((state) => {
      // Lösche Gruppe
      const newGroups = state.groups.filter((group) => group.id !== id);
      
      // Entferne Gruppenzuordnung von Tasks
      const newTasks = state.tasks.map((task) => 
        task.groupId === id ? { ...task, groupId: null } : task
      );
      
      window.electron.saveData('groups', newGroups);
      window.electron.saveData('tasks', newTasks);
      
      return { 
        groups: newGroups,
        tasks: newTasks,
        view: 'all' // Zurück zur Gesamtansicht
      };
    });
  },

  moveGroup: (sourceIndex, destIndex) => {
    set((state) => {
      const newGroups = [...state.groups];
      const [removed] = newGroups.splice(sourceIndex, 1);
      newGroups.splice(destIndex, 0, removed);
      
      window.electron.saveData('groups', newGroups);
      return { groups: newGroups };
    });
  },

  // Aufgaben-Funktionen
  addTask: (groupId, title) => {
    const newTask = {
      id: nanoid(),
      title,
      description: '',
      groupId,
      completed: false,
      subtasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      order: get().tasks.filter(t => t.groupId === groupId).length
    };

    set((state) => {
      const newTasks = [...state.tasks, newTask];
      window.electron.saveData('tasks', newTasks);
      return { tasks: newTasks };
    });
  },

  updateTask: (id, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, ...updates } : task
      );
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const newTasks = state.tasks.filter((task) => task.id !== id);
      window.electron.saveData('tasks', newTasks);
      return { tasks: newTasks };
    });
  },

  completeTask: (id) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, completed: true } : task
      );
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  archiveCompletedTasks: () => {
    set((state) => {
      const completedTasks = state.tasks.filter(task => task.completed);
      const remainingTasks = state.tasks.filter(task => !task.completed);
      const newArchivedTasks = [...state.archivedTasks, ...completedTasks];

      window.electron.saveData('tasks', remainingTasks);
      window.electron.saveData('archivedTasks', newArchivedTasks);

      return {
        tasks: remainingTasks,
        archivedTasks: newArchivedTasks
      };
    });
  },

  // Subtask-Funktionen
  addSubtask: (taskId, title) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const newSubtask = {
            id: nanoid(),
            title,
            completed: false
          };
          return { ...task, subtasks: [...task.subtasks, newSubtask] };
        }
        return task;
      });
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  updateSubtask: (taskId, subtaskId, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  deleteSubtask: (taskId, subtaskId) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.filter(
            (subtask) => subtask.id !== subtaskId
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  // Drag & Drop für Tasks
  moveTask: (taskId, sourceGroupId, destGroupId, sourceIndex, destIndex) => {
    set((state) => {
      // Task finden
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return state;

      // Task aktualisieren
      const updatedTask = {
        ...task,
        groupId: destGroupId === 'ungrouped' ? null : destGroupId
      };

      // Alle Tasks aktualisieren
      let updatedTasks = state.tasks.filter(t => t.id !== taskId);
      updatedTasks.splice(destIndex, 0, updatedTask);

      // Reihenfolge aktualisieren
      updatedTasks = updatedTasks.map((t, index) => ({
        ...t,
        order: index
      }));

      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  // Tags-Funktionen
  addTag: (name, color) => {
    const newTag = {
      id: nanoid(),
      name,
      color
    };

    set((state) => {
      const newTags = [...state.tags, newTag];
      window.electron.saveData('tags', newTags);
      return { tags: newTags };
    });
  },

  updateTag: (id, updates) => {
    set((state) => {
      const updatedTags = state.tags.map((tag) => 
        tag.id === id ? { ...tag, ...updates } : tag
      );
      window.electron.saveData('tags', updatedTags);
      return { tags: updatedTags };
    });
  },

  deleteTag: (id) => {
    set((state) => {
      // Tag entfernen
      const newTags = state.tags.filter((tag) => tag.id !== id);
      
      // Tag aus allen Tasks entfernen
      const updatedTasks = state.tasks.map((task) => ({
        ...task,
        tags: task.tags.filter((tagId) => tagId !== id)
      }));
      
      window.electron.saveData('tags', newTags);
      window.electron.saveData('tasks', updatedTasks);
      
      return { 
        tags: newTags,
        tasks: updatedTasks
      };
    });
  },

  // Notizen-Funktionen
  addNote: (title, content) => {
    const newNote = {
      id: nanoid(),
      title: title || 'Neue Notiz',
      content: content || '',
      createdAt: new Date().toISOString()
    };

    set((state) => {
      const newNotes = [...state.notes, newNote];
      window.electron.saveData('notes', newNotes);
      return { notes: newNotes };
    });
  },

  updateNote: (id, title, content) => {
    set((state) => {
      const updatedNotes = state.notes.map((note) => 
        note.id === id ? { 
          ...note, 
          title: title || note.title, 
          content: content !== undefined ? content : note.content
        } : note
      );
      window.electron.saveData('notes', updatedNotes);
      return { notes: updatedNotes };
    });
  },

  deleteNote: (id) => {
    set((state) => {
      const newNotes = state.notes.filter((note) => note.id !== id);
      window.electron.saveData('notes', newNotes);
      return { notes: newNotes };
    });
  },

  convertNoteToTask: (noteId, groupId) => {
    set((state) => {
      // Note finden
      const note = state.notes.find(n => n.id === noteId);
      if (!note) return state;

      // Neue Task erstellen
      const newTask = {
        id: nanoid(),
        title: note.title || 'Neue Aufgabe',
        description: note.content || '',
        groupId,
        completed: false,
        subtasks: [],
        tags: [],
        createdAt: new Date().toISOString(),
        order: get().tasks.filter(t => t.groupId === groupId).length
      };

      // Note entfernen und Task hinzufügen
      const newNotes = state.notes.filter(n => n.id !== noteId);
      const newTasks = [...state.tasks, newTask];

      window.electron.saveData('notes', newNotes);
      window.electron.saveData('tasks', newTasks);

      return {
        notes: newNotes,
        tasks: newTasks
      };
    });
  },


// Fokus-Modus Funktionen
startFocusMode: (taskId) => {
  // Wenn kein taskId übergeben wurde, öffne den Fokus-Modus für Notizenerstellung
  if (!taskId) {
    set({
      focusModeActive: true,
      focusTask: null,
      focusTimer: {
        duration: 20 * 60, // 20 Minuten in Sekunden
        timeLeft: 20 * 60,
        isRunning: false
      }
    });
    return;
  }
  
  // Wenn es eine Notiz ist (Format: "note-[id]")
  if (taskId.startsWith('note-')) {
    const noteId = taskId.replace('note-', '');
    const note = get().notes.find(n => n.id === noteId);
    
    if (note) {
      set({
        focusModeActive: true,
        focusTask: { id: taskId },
        focusTimer: {
          duration: 20 * 60, // 20 Minuten in Sekunden
          timeLeft: 20 * 60,
          isRunning: true
        }
      });
      return;
    }
  }

  // Normale Aufgabe
  const task = get().tasks.find(t => t.id === taskId);
  if (!task) return;

  set({
    focusModeActive: true,
    focusTask: task,
    focusTimer: {
      duration: 20 * 60, // 20 Minuten in Sekunden
      timeLeft: 20 * 60,
      isRunning: true
    }
  });
},

  stopFocusMode: () => {
    set({
      focusModeActive: false,
      focusTask: null,
      focusTimer: {
        ...get().focusTimer,
        isRunning: false
      }
    });
  },

  updateFocusTimer: (updates) => {
    set((state) => ({
      focusTimer: {
        ...state.focusTimer,
        ...updates
      }
    }));
  },

  extendFocusTimer: () => {
    set((state) => ({
      focusTimer: {
        ...state.focusTimer,
        timeLeft: state.focusTimer.timeLeft + 5 * 60, // +5 Minuten
        duration: state.focusTimer.duration + 5 * 60
      }
    }));
  },

  // Navigation
  setView: (view) => {
    set({ view });
  },

  // Suche
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  }
}));