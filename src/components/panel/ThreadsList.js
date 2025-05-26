import React, { useState } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

const ThreadsList = ({ 
  threads, 
  activeThread, 
  onSelectThread, 
  onAddThread, 
  onRemoveThread,
  onUpdateThreadName
}) => {
  const [editingThread, setEditingThread] = useState(null);
  const [editedName, setEditedName] = useState('');
  
  const startEditing = (thread) => {
    setEditingThread(thread.id);
    setEditedName(thread.name);
  };
  
  const saveThreadName = () => {
    if (editedName.trim()) {
      onUpdateThreadName(editingThread, editedName);
    }
    setEditingThread(null);
  };
  
  const cancelEditing = () => {
    setEditingThread(null);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Потоки</h3>
        <button
          className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
          onClick={onAddThread}
          title="Додати новий потік"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {threads.length > 0 ? (
        <div className="border rounded overflow-hidden">
          {threads.map((thread) => (
            <div 
              key={thread.id} 
              className={`flex justify-between items-center p-2 border-b last:border-b-0 ${
                activeThread === thread.id ? 'bg-blue-50' : ''
              }`}
            >
              {editingThread === thread.id ? (
                <div className="flex flex-1 items-center">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveThreadName()}
                    autoFocus
                  />
                  <button
                    className="ml-1 text-green-500 hover:text-green-700"
                    onClick={saveThreadName}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="ml-1 text-red-500 hover:text-red-700"
                    onClick={cancelEditing}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectThread(thread.id)}
                  >
                    {thread.name}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => startEditing(thread)}
                      title="Редагувати назву"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onRemoveThread(thread.id)}
                      disabled={threads.length <= 1}
                      title={threads.length <= 1 ? "Не можна видалити останній потік" : "Видалити потік"}
                    >
                      <Trash2 size={16} className={threads.length <= 1 ? "opacity-50" : ""} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-2">
          Немає потоків. Додайте потік за допомогою кнопки вище.
        </div>
      )}
      
    </div>
  );
};

export default ThreadsList;