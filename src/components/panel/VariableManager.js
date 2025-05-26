import React, { useState } from 'react';
import { Plus, X, Edit, Check } from 'lucide-react';

const VariableManager = ({ variables, onAddVariable, onRemoveVariable, onUpdateVariable }) => {
  const [newVarName, setNewVarName] = useState('');
  const [editingVariable, setEditingVariable] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  
  const handleAddVariable = () => {
    if (newVarName && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(newVarName)) {
      if (onAddVariable(newVarName)) {
        setNewVarName('');
      } else {
        alert('Змінна з таким іменем вже існує');
      }
    } else {
      alert('Ім\'я змінної має починатися з літери і може містити тільки латинські літери, цифри та символ підкреслення');
    }
  };

  const startEditing = (variable) => {
    setEditingVariable(variable.name);
    setEditedValue(variable.value.toString());
  };

  const saveEditedValue = () => {
    const value = parseInt(editedValue, 10);
    if (!isNaN(value) && value >= 0 && value <= 2147483647) {
      onUpdateVariable(editingVariable, value);
      setEditingVariable(null);
    } else {
      alert('Значення повинно бути цілим числом в діапазоні 0...2^31-1');
    }
  };
  
  return (
    <div>
      <h3 className="font-medium mb-2">Спільні змінні</h3>
      
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-1 border rounded-l px-2 py-1"
          placeholder="Назва змінної"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddVariable()}
        />
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded-r hover:bg-blue-600 flex items-center"
          onClick={handleAddVariable}
        >
          <Plus size={16} />
          <span className="ml-1">Додати</span>
        </button>
      </div>
      
      {variables.length > 0 ? (
        <div className="border rounded overflow-hidden">
          {variables.map((variable) => (
            <div key={variable.name} className="flex justify-between items-center border-b p-2 last:border-b-0">
              <span>{variable.name}</span>
              
              {editingVariable === variable.name ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-20 border rounded px-2 py-1 mr-1"
                    min="0"
                    max="2147483647"
                    value={editedValue}
                    onChange={(e) => setEditedValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditedValue()}
                    autoFocus
                  />
                  <button
                    className="text-green-500 hover:text-green-700 mr-1"
                    onClick={saveEditedValue}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setEditingVariable(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2 text-gray-600">{variable.value}</span>
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-1"
                    onClick={() => startEditing(variable)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => onRemoveVariable(variable.name)}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center py-2">
          Немає змінних. Додайте змінну за допомогою форми вище.
        </div>
      )}
      
    </div>
  );
};

export default VariableManager;