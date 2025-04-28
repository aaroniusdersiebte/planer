// src/components/obs/ObsPreview.jsx
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

function ObsPreview({ groupId }) {
  const { tasks, groups } = useAppStore();
  const [groupTasks, setGroupTasks] = useState([]);
  
  useEffect(() => {
    if (!groupId) {
      setGroupTasks([]);
      return;
    }
    
    // Aufgaben der ausgewählten Gruppe finden
    const filteredTasks = tasks.filter(task => task.groupId === groupId);
    setGroupTasks(filteredTasks);
    
    // Aufgaben an den Webserver übermitteln
    window.electron.updateWebServerTasks(filteredTasks);
  }, [groupId, tasks]);

  // Gruppe finden
  const group = groups.find(g => g.id === groupId);
  const groupName = group ? group.name : 'Keine Gruppe ausgewählt';

  if (!groupId) {
    return (
      <div className="text-center text-gray-500 py-4">
        Bitte wählen Sie eine Gruppe aus, um die Vorschau anzuzeigen.
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-3">{groupName}</h3>
        
        {groupTasks.length === 0 ? (
          <div className="text-gray-500 py-4 text-center">
            Keine Aufgaben in dieser Gruppe
          </div>
        ) : (
          <div className="space-y-2">
            {groupTasks.map(task => (
              <div 
                key={task.id}
                className={`flex items-center p-2 rounded ${
                  task.completed ? 'bg-gray-700 text-gray-400' : 'bg-gray-700'
                }`}
              >
                <span className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-600'
                }`}>
                  {task.completed && <span>✓</span>}
                </span>
                
                <span className={`${task.completed ? 'line-through' : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Diese Vorschau entspricht der Anzeige in OBS
      </p>
    </div>
  );
}

export default ObsPreview;