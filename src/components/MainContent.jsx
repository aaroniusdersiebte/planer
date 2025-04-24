// src/components/MainContent.jsx
import React from 'react';
import { Droppable, DragDropContext } from 'react-beautiful-dnd';
import { FiPlus, FiArchive } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';
import TaskList from './tasks/TaskList';
import NotesList from './notes/NotesList';
import ArchivedTasks from './tasks/ArchivedTasks';
import TrelloView from './tasks/TrelloView';

function MainContent({ view }) {
  const { 
    groups, 
    tasks, 
    archiveCompletedTasks, 
    addTask,
    addNote,
    searchQuery,
    moveTask
  } = useAppStore();

  // Bestimme den aktuellen Titel und die Aufgabenliste basierend auf der Ansicht
  let title = 'Alle Aufgaben';
  let currentGroupId = null;
  let filteredTasks = [];

  if (view === 'notes') {
    return <NotesList />;
  }

  if (view === 'archive') {
    return <ArchivedTasks />;
  }

  // Suche
  if (searchQuery) {
    title = `Suchergebnisse: "${searchQuery}"`;
    filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtasks.some(subtask => 
        subtask.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  } 
  // Gruppenansicht
  else if (view.startsWith('group-')) {
    currentGroupId = view.split('group-')[1];
    const group = groups.find(g => g.id === currentGroupId);
    
    if (group) {
      title = group.name;
      filteredTasks = tasks.filter(task => task.groupId === currentGroupId);
    }
  } 
  // Gesamtansicht
  else {
    // Zeige nur nicht erledigte Aufgaben in der Gesamtansicht
    filteredTasks = tasks.filter(task => !task.completed);
  }

  // Sortiere Aufgaben nach Gruppen und dann nach Reihenfolge
  // Dabei werden erledigte Aufgaben nach unten sortiert
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.groupId !== b.groupId) {
      const aGroupIndex = groups.findIndex(g => g.id === a.groupId);
      const bGroupIndex = groups.findIndex(g => g.id === b.groupId);
      return aGroupIndex - bGroupIndex;
    }
    
    // Erledigte Tasks zuletzt
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    return a.order - b.order;
  });

  const handleAddTask = () => {
    if (currentGroupId) {
      addTask(currentGroupId, 'Neue Aufgabe');
      window.electron.hapticFeedback();
    }
  };

  // Drag & Drop Handler für Trello-Ansicht
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Wenn es kein Ziel gibt, abbrechen
    if (!destination) return;

    // Wenn das Ziel das gleiche wie der Ursprung ist, abbrechen
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Haptisches Feedback
    window.electron.hapticFeedback();

    // Task verschieben
    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  // Separiere aktive von erledigten Aufgaben für die Anzeige mit Trennlinie
  let activeTasks = [], completedTasks = [];
  
  if (view.startsWith('group-')) {
    activeTasks = sortedTasks.filter(task => !task.completed);
    completedTasks = sortedTasks.filter(task => task.completed);
  } else {
    // In der Gesamtansicht zeigen wir nur aktive Aufgaben
    activeTasks = sortedTasks;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        
        <div className="flex">
          {!searchQuery && view !== 'archive' && (
            <>
              <button
                className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded mr-2"
                onClick={() => {
                  if (currentGroupId) {
                    handleAddTask();
                  } else {
                    addNote('Neue Notiz', '');
                    window.electron.hapticFeedback();
                  }
                }}
              >
                <FiPlus className="mr-1" />
                <span>{currentGroupId ? 'Aufgabe' : 'Notiz'}</span>
              </button>
              
              <button
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                onClick={() => {
                  archiveCompletedTasks();
                  window.electron.hapticFeedback();
                }}
              >
                <FiArchive className="mr-1" />
                <span>Archivieren</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Aufgabenliste oder Trello-Ansicht */}
      {view === 'all' ? (
        <TrelloView onDragEnd={handleDragEnd} />
      ) : (
        <Droppable 
          droppableId={currentGroupId || "all"} 
          type="task"
        >
          {(provided) => (
            <div 
              className="flex-1 overflow-y-auto p-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {/* Aktive Aufgaben */}
              {activeTasks.length > 0 ? (
                <div className="space-y-3">
                  <TaskList tasks={activeTasks} />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  Keine aktiven Aufgaben vorhanden
                </div>
              )}
              
              {/* Trennlinie und Abschnitt für erledigte Aufgaben */}
              {completedTasks.length > 0 && (
                <>
                  <div className="my-6 border-t border-gray-700 pt-4">
                    <h2 className="text-lg font-medium text-gray-400 mb-4">Abgeschlossene Aufgaben</h2>
                    <div className="space-y-3">
                      <TaskList tasks={completedTasks} />
                    </div>
                  </div>
                </>
              )}
              
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}

export default MainContent;