// src/components/tasks/TaskList.jsx
import React from 'react';
import Task from './Task';

function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        Keine Aufgaben vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <Task key={task.id} task={task} index={index} />
      ))}
    </div>
  );
}

export default TaskList;

