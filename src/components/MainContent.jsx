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
    filteredTasks = tasks;
  }

  // Sortiere Aufgaben nach Gruppen und dann nach Reihenfolge
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.groupId !== b.groupId) {
      const aGroupIndex = groups.findIndex(g => g.id === a.groupId);
      const bGroupIndex = groups.findIndex(g => g.id === b.groupId);
      return aGroupIndex - bGroupIndex;
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
              <TaskList tasks={sortedTasks} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}

export default MainContent;