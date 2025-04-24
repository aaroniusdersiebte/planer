import React, { useState } from 'react';
import { 
  FiHome, 
  FiPlus, 
  FiFolder, 
  FiArchive, 
  FiEdit, 
  FiSearch,
  FiX
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import DailyStats from './DailyStats';
import QuickActions from './QuickActions';

function Sidebar() {
  const { 
    groups, 
    view, 
    setView, 
    addGroup,
    setSearchQuery,
    searchQuery
  } = useAppStore();
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddingGroup(false);
      window.electron.hapticFeedback();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddGroup();
    } else if (e.key === 'Escape') {
      setIsAddingGroup(false);
      setNewGroupName('');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearching(false);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white">MiniPlaner</h1>
      </div>

      {/* Tägliche Statistiken hinzufügen */}
      <div className="p-2">
        <DailyStats />
      </div>

      {/* Suche */}
      <div className="p-2">
        {isSearching ? (
          <div className="flex items-center bg-gray-700 rounded px-2 py-1">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Suchen..."
              className="bg-transparent w-full text-white outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            {searchQuery && (
              <FiX
                className="text-gray-400 cursor-pointer"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
              />
            )}
          </div>
        ) : (
          <button
            className="flex items-center text-gray-400 hover:text-white w-full px-2 py-1"
            onClick={() => setIsSearching(true)}
          >
            <FiSearch className="mr-2" />
            <span>Suchen</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul>
          {/* Alle Aufgaben */}
          <li>
            <button
              className={`flex items-center w-full px-4 py-2 ${
                view === 'all' 
                  ? 'bg-gray-700 text-orange-400' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setView('all')}
            >
              <FiHome className="mr-2" />
              <span>Alle Aufgaben</span>
            </button>
          </li>

          {/* Notizen */}
          <li>
            <button
              className={`flex items-center w-full px-4 py-2 ${
                view === 'notes' 
                  ? 'bg-gray-700 text-orange-400' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setView('notes')}
            >
              <FiEdit className="mr-2" />
              <span>Notizen</span>
            </button>
          </li>

          {/* Archiv */}
          <li>
            <button
              className={`flex items-center w-full px-4 py-2 ${
                view === 'archive' 
                  ? 'bg-gray-700 text-orange-400' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setView('archive')}
            >
              <FiArchive className="mr-2" />
              <span>Archiv</span>
            </button>
          </li>

          {/* Gruppen-Header */}
          <li className="px-4 py-2 text-xs text-gray-500 uppercase mt-4">
            Gruppen
          </li>

          {/* Gruppen-Liste */}
          {groups.map((group) => (
            <li key={group.id}>
              <button
                className={`flex items-center w-full px-4 py-2 ${
                  view === `group-${group.id}` 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setView(`group-${group.id}`)}
              >
                <FiFolder className="mr-2" />
                <span>{group.name}</span>
              </button>
            </li>
          ))}

          {/* Neue Gruppe hinzufügen */}
          {isAddingGroup ? (
            <li className="px-4 py-2">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Gruppenname"
                  className="bg-gray-700 text-white px-2 py-1 rounded w-full outline-none"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button
                  className="ml-2 text-green-500 hover:text-green-400"
                  onClick={handleAddGroup}
                >
                  <FiPlus />
                </button>
                <button
                  className="ml-1 text-red-500 hover:text-red-400"
                  onClick={() => {
                    setIsAddingGroup(false);
                    setNewGroupName('');
                  }}
                >
                  <FiX />
                </button>
              </div>
            </li>
          ) : (
            <li>
              <button
                className="flex items-center text-gray-400 hover:text-white w-full px-4 py-2"
                onClick={() => setIsAddingGroup(true)}
              >
                <FiPlus className="mr-2" />
                <span>Neue Gruppe</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Shortcuts am unteren Rand */}
      <div className="p-2 mt-auto">
        <QuickActions />
      </div>
    </div>
  );
}

export default Sidebar;