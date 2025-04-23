// src/components/tasks/ArchivedTasks.jsx
import React from 'react';
import { FiArchive } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function ArchivedTasks() {
  const { archivedTasks, groups } = useAppStore();

  if (archivedTasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">Archiv</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FiArchive size={48} className="mx-auto mb-4" />
            <p>Keine archivierten Aufgaben vorhanden</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white">Archiv</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {archivedTasks.map((task) => {
            // Finde die Gruppe
            const group = groups.find(g => g.id === task.groupId);
            const groupName = group ? group.name : 'Ohne Gruppe';
            
            return (
              <div key={task.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-green-600 border-green-600 text-white flex items-center justify-center mr-3">
                    <FiArchive size={12} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-white font-medium line-through">{task.title}</div>
                    <div className="text-xs text-gray-500">{groupName}</div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ArchivedTasks;