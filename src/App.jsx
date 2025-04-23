// src/App.jsx
import React, { useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Sidebar from './components/sidebar/Sidebar';
import MainContent from './components/MainContent';
import FocusMode from './components/focus/FocusMode';
import MinimizedFocus from './components/focus/MinimizedFocus';
import { useAppStore } from './store/appStore';
import './styles/tailwind.css';

function App() {
  const { 
    view, 
    initializeData, 
    moveTask, 
    moveGroup,
    focusModeActive,
    focusModeMinimized,
    restoreFocusMode,
    moveSubtask
  } = useAppStore();

  // Daten beim App-Start laden
  useEffect(() => {
    initializeData();
  }, [initializeData]);

 // Drag & Drop Handler
 const handleDragEnd = (result) => {
  const { destination, source, draggableId, type } = result;

  // Wenn es kein Ziel gibt, abbrechen
  if (!destination) return;

  // Wenn das Ziel das gleiche wie der Ursprung ist, abbrechen
  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) return;

  // Haptisches Feedback
  window.electron.hapticFeedback();

  // Wenn eine Gruppe verschoben wurde
  if (type === 'group') {
    moveGroup(source.index, destination.index);
    return;
  }

  // Wenn eine Unteraufgabe verschoben wurde
  if (type === 'subtask') {
    moveSubtask(
      source.droppableId, // taskId
      draggableId,        // subtaskId
      source.index,
      destination.index
    );
    return;
  }

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
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Seitenleiste */}
      <Sidebar />

      {/* Hauptinhalt mit Drag & Drop Kontext */}
      <DragDropContext onDragEnd={handleDragEnd}>
        {focusModeActive && !focusModeMinimized ? (
          <FocusMode />
        ) : (
          <MainContent view={view} />
        )}
      </DragDropContext>

      {/* Minimierter Fokus-Modus */}
      {focusModeActive && focusModeMinimized && (
        <MinimizedFocus onRestore={restoreFocusMode} />
      )}
    </div>
  );
}

export default App;