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
  focusModeMinimized: false, // Neuer State für minimierten Fokus-Modus
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

      // Migriere alte Tasks zu neuem Format mit Beschreibungseinträgen
      const migratedTasks = tasks.map(task => {
        // Wenn die Aufgabe bereits das neue Format hat, keine Änderung
        if (task.descriptionEntries) return task;
        
        // Alte Beschreibung in einen Eintrag umwandeln, falls vorhanden
        const descriptionEntries = task.description
          ? [
              {
                id: nanoid(),
                text: task.description,
                createdAt: task.createdAt,
                editedAt: null
              }
            ]
          : [];
        
        // Neues Format zurückgeben
        return {
          ...task,
          descriptionEntries,
          // Alte Beschreibung wird zur Kompatibilität beibehalten
          description: task.description || ''
        };
      });

      set({ groups, tasks: migratedTasks, tags, notes, archivedTasks });
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
      description: '', // Bleibt für Kompatibilität
      descriptionEntries: [], // Neues Array für Beschreibungseinträge
      groupId,
      completed: false,
      subtasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      order: get().tasks.filter(t => t.groupId === groupId && !t.completed).length
    };

    set((state) => {
      const newTasks = [...state.tasks, newTask];
      window.electron.saveData('tasks', newTasks);
      return { tasks: newTasks };
    });
  },

  // Neuer Eintrag für Beschreibungen
  addDescriptionEntry: (taskId, text) => {
    const newEntry = {
      id: nanoid(),
      text,
      createdAt: new Date().toISOString(),
      editedAt: null
    };

    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          // Sorge dafür, dass descriptionEntries auf jeden Fall ein Array ist
          const descriptionEntries = task.descriptionEntries || [];
          // Füge den neuen Eintrag am Anfang hinzu (neueste zuerst)
          return { 
            ...task, 
            descriptionEntries: [newEntry, ...descriptionEntries]
          };
        }
        return task;
      });
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  updateTask: (id, updates) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, ...updates } : task
      );
      
      // Wenn der Completed-Status geändert wurde, sortieren wir die Tasks neu
      const reorderedTasks = updatedTasks.map((task, _, arr) => {
        if (task.id === id && 'completed' in updates) {
          // Neu sortieren innerhalb der Gruppe
          return reorderTaskAfterCompletion(task, arr);
        }
        return task;
      });
      
      window.electron.saveData('tasks', reorderedTasks);
      return { tasks: reorderedTasks };
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
      // Task als erledigt markieren
      let updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, completed: true } : task
      );
      
      // Finde den Task, der gerade aktualisiert wurde
      const updatedTask = updatedTasks.find(task => task.id === id);
      
      if (updatedTask) {
        // Entferne den aktualisierten Task aus der Liste
        updatedTasks = updatedTasks.filter(task => task.id !== id);
        
        // Bestimme den neuen Order-Wert
        // Sortiere die Aufgaben in die entsprechenden Bereiche (aktiv oben, erledigt unten)
        updatedTasks = sortTasksWithCompletedAtBottom(updatedTasks, updatedTask);
      }
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  uncompleteTask: (id) => {
    // Neue Funktion zum Zurücksetzen des Completed-Status
    set((state) => {
      // Task als nicht erledigt markieren
      let updatedTasks = state.tasks.map((task) => 
        task.id === id ? { ...task, completed: false } : task
      );
      
      // Finde den Task, der gerade aktualisiert wurde
      const updatedTask = updatedTasks.find(task => task.id === id);
      
      if (updatedTask) {
        // Entferne den aktualisierten Task aus der Liste
        updatedTasks = updatedTasks.filter(task => task.id !== id);
        
        // Füge den Task wieder bei den aktiven Tasks ein (oben)
        updatedTasks = sortTasksWithCompletedAtBottom(updatedTasks, updatedTask);
      }
      
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

  // Unteraufgaben per Drag & Drop sortieren
  moveSubtask: (taskId, subtaskId, sourceIndex, destIndex) => {
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const subtasks = [...task.subtasks];
          const [removed] = subtasks.splice(sourceIndex, 1);
          subtasks.splice(destIndex, 0, removed);
          return { ...task, subtasks };
        }
        return task;
      });
      
      window.electron.saveData('tasks', updatedTasks);
      return { tasks: updatedTasks };
    });
  },

  // Drag & Drop für Tasks - Verbesserte Version
  moveTask: (taskId, sourceGroupId, destGroupId, sourceIndex, destIndex) => {
    set((state) => {
      // Alle Tasks nach Status (completed oder nicht) und Gruppen trennen
      const tasksInSourceGroup = state.tasks.filter(t => 
        (t.groupId === sourceGroupId || 
         (sourceGroupId === 'ungrouped' && !t.groupId))
      );
      
      const activeTasks = tasksInSourceGroup.filter(t => !t.completed);
      const completedTasks = tasksInSourceGroup.filter(t => t.completed);
      
      const tasksInDestGroup = state.tasks.filter(t => 
        (t.groupId === destGroupId || 
         (destGroupId === 'ungrouped' && !t.groupId))
      );
      
      const destActiveTasks = tasksInDestGroup.filter(t => !t.completed);
      const destCompletedTasks = tasksInDestGroup.filter(t => t.completed);
      
      // Task finden
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return state;

      // Task mit aktualisierter Gruppe
      const updatedTask = {
        ...task,
        groupId: destGroupId === 'ungrouped' ? null : destGroupId
      };
      
      // Bestimme, ob der Task in die aktiven oder erledigten Tasks eingeordnet werden soll
      const isTargetingCompletedSection = 
        (updatedTask.completed && destIndex >= destActiveTasks.length) || 
        (!updatedTask.completed && destIndex < destActiveTasks.length);
        
      // Entferne Task aus der Ursprungsliste
      const otherTasks = state.tasks.filter(t => t.id !== taskId);
      
      // Füge Task an neuer Position ein, unter Berücksichtigung des Completed-Status
      let finalTasks = [...otherTasks];
      
      // Zähle, wie viele aktive Tasks in der Zielgruppe vorhanden sind
      const activeTasksInDestGroup = finalTasks.filter(
        t => (t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)) && !t.completed
      );
      
      // Bestimme tatsächliche Position basierend auf Status
      let insertIndex;
      if (updatedTask.completed) {
        // Für erledigte Tasks: nach den aktiven Tasks einfügen
        const activeTasksCount = activeTasksInDestGroup.length;
        insertIndex = finalTasks.findIndex(
          t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && t.completed
        );
        
        if (insertIndex === -1) {
          // Falls keine erledigten Tasks in der Gruppe, nach den aktiven einfügen
          insertIndex = finalTasks.findIndex(
            t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)
          );
          if (insertIndex === -1) {
            finalTasks.push(updatedTask);
            insertIndex = finalTasks.length - 1;
          } else {
            // Nach allen aktiven Tasks einfügen
            while (insertIndex < finalTasks.length && 
                   finalTasks[insertIndex].groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && 
                   !finalTasks[insertIndex].completed) {
              insertIndex++;
            }
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        } else {
          // Bei den erledigten Tasks an der berechneten Position einfügen
          finalTasks.splice(insertIndex + (destIndex - activeTasksCount), 0, updatedTask);
        }
      } else {
        // Für aktive Tasks
        if (destIndex === 0) {
          // Am Anfang der Gruppe einfügen
          insertIndex = finalTasks.findIndex(
            t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId)
          );
          if (insertIndex === -1) {
            finalTasks.push(updatedTask);
          } else {
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        } else {
          // An der korrekten Position einfügen
          let count = 0;
          insertIndex = -1;
          
          for (let i = 0; i < finalTasks.length; i++) {
            const t = finalTasks[i];
            if (t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && !t.completed) {
              count++;
              if (count === destIndex) {
                insertIndex = i + 1;
                break;
              }
            }
          }
          
          if (insertIndex === -1) {
            // Einfügen am Ende der aktiven Tasks
            insertIndex = finalTasks.findIndex(
              t => t.groupId === (destGroupId === 'ungrouped' ? null : destGroupId) && t.completed
            );
            if (insertIndex === -1) {
              finalTasks.push(updatedTask);
            } else {
              finalTasks.splice(insertIndex, 0, updatedTask);
            }
          } else {
            finalTasks.splice(insertIndex, 0, updatedTask);
          }
        }
      }
      
      // Orders aktualisieren
      finalTasks = updateTaskOrders(finalTasks);
      
      window.electron.saveData('tasks', finalTasks);
      return { tasks: finalTasks };
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

      // Beschreibungseintrag erstellen
      const descriptionEntry = {
        id: nanoid(),
        text: note.content || '',
        createdAt: new Date().toISOString(),
        editedAt: null
      };

      // Neue Task erstellen
      const newTask = {
        id: nanoid(),
        title: note.title || 'Neue Aufgabe',
        description: note.content || '', // Für Kompatibilität
        descriptionEntries: note.content ? [descriptionEntry] : [], // Neues Format
        groupId,
        completed: false,
        subtasks: [],
        tags: [],
        createdAt: new Date().toISOString(),
        order: get().tasks.filter(t => t.groupId === groupId && !t.completed).length
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
        focusModeMinimized: false,
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
          focusModeMinimized: false,
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
      focusModeMinimized: false,
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
      focusModeMinimized: false,
      focusTask: null,
      focusTimer: {
        ...get().focusTimer,
        isRunning: false
      }
    });
  },

  // Neuer minimierter Modus
  minimizeFocusMode: () => {
    set({
      focusModeMinimized: true,
      focusTimer: {
        ...get().focusTimer,
        isRunning: false // Timer pausieren
      }
    });
  },

  // Fokus-Modus wiederherstellen
  restoreFocusMode: () => {
    set({
      focusModeMinimized: false,
      // Timer automatisch fortsetzen, wenn Fokus-Modus wiederhergestellt wird
      focusTimer: {
        ...get().focusTimer,
        isRunning: true
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

// Helper-Funktionen

// Sortiert die Tasks so, dass erledigte Tasks innerhalb einer Gruppe nach unten verschoben werden
function sortTasksWithCompletedAtBottom(tasks, taskToInsert) {
  // Erstelle eine neue Array mit allen Tasks außer dem einzufügenden Task
  let result = [...tasks];
  
  // Bestimme den korrekten Einfügepunkt basierend auf dem Completed-Status
  if (taskToInsert.completed) {
    // Für erledigte Tasks: Finde den ersten erledigten Task in derselben Gruppe
    // oder füge am Ende der Gruppe ein
    let insertIndex = result.findIndex(t => 
      t.groupId === taskToInsert.groupId && t.completed
    );
    
    if (insertIndex === -1) {
      // Kein erledigter Task in dieser Gruppe gefunden, füge am Ende der Gruppe ein
      let lastGroupTaskIndex = -1;
      
      for (let i = 0; i < result.length; i++) {
        if (result[i].groupId === taskToInsert.groupId) {
          lastGroupTaskIndex = i;
        } else if (lastGroupTaskIndex !== -1) {
          // Wir haben die Gruppe verlassen, hier einfügen
          break;
        }
      }
      
      if (lastGroupTaskIndex === -1) {
        // Keine andere Aufgabe in dieser Gruppe, am Ende einfügen
        result.push(taskToInsert);
      } else {
        // Nach der letzten Aufgabe in der Gruppe einfügen
        result.splice(lastGroupTaskIndex + 1, 0, taskToInsert);
      }
    } else {
      // Bei den anderen erledigten Tasks einfügen
      result.splice(insertIndex, 0, taskToInsert);
    }
  } else {
    // Für aktive Tasks: Vor dem ersten erledigten Task in derselben Gruppe einfügen
    // oder vor dem ersten Task der nächsten Gruppe
    let insertIndex = result.findIndex(t => 
      t.groupId === taskToInsert.groupId && t.completed
    );
    
    if (insertIndex === -1) {
      // Kein erledigter Task in dieser Gruppe gefunden, füge vor der nächsten Gruppe ein
      let nextGroupStartIndex = result.findIndex(t => 
        t.groupId !== taskToInsert.groupId && 
        (result.findIndex(prev => prev.groupId === taskToInsert.groupId) < result.indexOf(t))
      );
      
      if (nextGroupStartIndex === -1) {
        // Keine nächste Gruppe, am Ende einfügen
        result.push(taskToInsert);
      } else {
        // Vor der nächsten Gruppe einfügen
        result.splice(nextGroupStartIndex, 0, taskToInsert);
      }
    } else {
      // Vor dem ersten erledigten Task einfügen
      result.splice(insertIndex, 0, taskToInsert);
    }
  }
  
  return updateTaskOrders(result);
}

// Ordnet einen Task nach einem Statuswechsel neu ein
function reorderTaskAfterCompletion(task, allTasks) {
  const tasksInSameGroup = allTasks.filter(t => t.groupId === task.groupId && t.id !== task.id);
  
  if (task.completed) {
    // Task wurde als erledigt markiert - ans Ende der Gruppe verschieben
    const completedTasksInGroup = tasksInSameGroup.filter(t => t.completed);
    // Neue Order: Nach allen anderen erledigten Tasks dieser Gruppe
    return {
      ...task,
      order: completedTasksInGroup.length > 0 
        ? Math.max(...completedTasksInGroup.map(t => t.order)) + 1
        : tasksInSameGroup.length // Nach allen nicht-erledigten Tasks
    };
  } else {
    // Task wurde als nicht erledigt markiert - an den Anfang der Gruppe verschieben
    const activeTasksInGroup = tasksInSameGroup.filter(t => !t.completed);
    // Neue Order: Vor allen anderen aktiven Tasks dieser Gruppe
    return {
      ...task,
      order: activeTasksInGroup.length > 0 
        ? Math.min(...activeTasksInGroup.map(t => t.order)) - 1
        : 0 // Ganz am Anfang, wenn keine anderen aktiven Tasks
    };
  }
}

// Aktualisiert die Order-Werte aller Tasks, sortiert nach Gruppen und Completed-Status
function updateTaskOrders(tasks) {
  // Gruppiere Tasks nach groupId
  const groupedTasks = {};
  
  tasks.forEach(task => {
    const groupId = task.groupId || 'ungrouped';
    if (!groupedTasks[groupId]) {
      groupedTasks[groupId] = [];
    }
    groupedTasks[groupId].push(task);
  });
  
  // Innerhalb jeder Gruppe: Aktive zuerst, dann erledigte, mit fortlaufenden Order-Werten
  const result = [];
  
  Object.keys(groupedTasks).forEach(groupId => {
    const groupTasks = groupedTasks[groupId];
    
    // Aktive Tasks
    const activeTasks = groupTasks.filter(t => !t.completed)
      .sort((a, b) => a.order - b.order)
      .map((task, index) => ({
        ...task,
        order: index
      }));
    
    // Erledigte Tasks
    const completedTasks = groupTasks.filter(t => t.completed)
      .sort((a, b) => a.order - b.order)
      .map((task, index) => ({
        ...task,
        order: activeTasks.length + index
      }));
    
    result.push(...activeTasks, ...completedTasks);
  });
  
  return result;
}