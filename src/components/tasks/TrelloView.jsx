// src/components/tasks/TrelloView.jsx
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { FiPlus } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import Task from './Task';

function TrelloView({ onDragEnd }) {
  const { groups, tasks, addTask } = useAppStore();

  // Aufgaben nach Gruppen gruppieren
  const groupedTasks = {};
  groups.forEach(group => {
    groupedTasks[group.id] = tasks.filter(task => task.groupId === group.id)
      .sort((a, b) => a.order - b.order);
  });

  // Aufgaben ohne Gruppe
  const ungroupedTasks = tasks.filter(task => !task.groupId);

  const handleAddTask = (groupId) => {
    addTask(groupId, 'Neue Aufgabe');
    window.electron.hapticFeedback();
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full p-4 space-x-4">
        {/* Gruppen als Spalten anzeigen */}
        {groups.map((group) => (
          <div 
            key={group.id} 
            className="flex-shrink-0 flex flex-col w-72 bg-gray-800 rounded-lg shadow"
          >
            {/* Gruppen-Header */}
            <div className="p-3 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">{group.name}</h2>
            </div>

            {/* Aufgaben-Container */}
            <Droppable droppableId={group.id} type="task">
              {(provided) => (
                <div 
                  className="flex-1 overflow-y-auto p-2 min-h-[200px]"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks[group.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupedTasks[group.id].map((task, index) => (
                        <Task 
                          key={task.id} 
                          task={task} 
                          index={index} 
                          trelloView={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10">
                      Keine Aufgaben
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Neue Aufgabe hinzufügen */}
            <div className="p-2 border-t border-gray-700">
              <button
                className="flex items-center text-gray-400 hover:text-orange-400 w-full p-2 rounded-md hover:bg-gray-700"
                onClick={() => handleAddTask(group.id)}
              >
                <FiPlus className="mr-2" />
                <span>Aufgabe hinzufügen</span>
              </button>
            </div>
          </div>
        ))}

        {/* Aufgaben ohne Gruppe */}
        {ungroupedTasks.length > 0 && (
          <div className="flex-shrink-0 flex flex-col w-72 bg-gray-800 rounded-lg shadow">
            <div className="p-3 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Ohne Gruppe</h2>
            </div>

            <Droppable droppableId="ungrouped" type="task">
              {(provided) => (
                <div 
                  className="flex-1 overflow-y-auto p-2 min-h-[200px]"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="space-y-2">
                    {ungroupedTasks.map((task, index) => (
                      <Task 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        trelloView={true}
                      />
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrelloView;