import React from 'react';
import { Trash2 } from 'lucide-react';

const PropertyPanel = ({ selectedBlock, variables, onUpdateBlock, onRemoveBlock }) => {

  if (!selectedBlock) {
    return (
      <div className="text-gray-500 text-center py-4">
        Виберіть блок, щоб побачити його властивості
      </div>
    );
  }
  
  const handlePropertyChange = (property, value) => {
    const updatedProperties = { ...selectedBlock.properties };
    updatedProperties[property] = value;
    onUpdateBlock(selectedBlock.id, updatedProperties);
  };
  
  const handleVariableChange = (e) => {
    const varName = e.target.value;
    const selectedVar = variables.find(v => v.name === varName);
    
    const updatedProperties = { 
      ...selectedBlock.properties,
      variable: varName 
    };
    
    if (selectedVar && selectedBlock.type === 'assign' && !selectedBlock.properties?.isVariable) {
      updatedProperties.value = selectedVar.value.toString();
    }
    
    onUpdateBlock(selectedBlock.id, updatedProperties);
  };
  
  const handleSetConstantValue = () => {
    const updatedProperties = {
      ...selectedBlock.properties,
      isVariable: false
    };
    
    onUpdateBlock(selectedBlock.id, updatedProperties);
  };
  
  const handleSetVariableValue = () => {
    const updatedProperties = {
      ...selectedBlock.properties,
      isVariable: true
    };
    
    if (variables.length > 0) {
      updatedProperties.value = variables[0].name;
    }
    
    onUpdateBlock(selectedBlock.id, updatedProperties);
  };
  
  const handleNumericValueChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseInt(value) >= 0 && parseInt(value) <= 2147483647)) {
      const finalValue = value === '' ? '0' : value;
      handlePropertyChange('value', finalValue);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Властивості блоку</h3>
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => {
            onRemoveBlock();
          }}
          title="Видалити блок"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип блоку:</label>
          <div className="px-3 py-2 border rounded bg-gray-50">
            {selectedBlock.type === 'start' && 'Початок'}
            {selectedBlock.type === 'end' && 'Кінець'}
            {selectedBlock.type === 'assign' && 'Присвоєння'}
            {selectedBlock.type === 'input' && 'Ввід'}
            {selectedBlock.type === 'output' && 'Вивід'}
            {selectedBlock.type === 'condition' && 'Умова'}
          </div>
        </div>
        
        {selectedBlock.type === 'assign' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Змінна:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedBlock.properties?.variable || ''}
                onChange={handleVariableChange}
              >
                <option value="">Виберіть змінну</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.value})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип значення:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-2 px-4 rounded border text-center ${
                    selectedBlock.properties?.isVariable === true
                      ? 'bg-white text-gray-700 border-gray-300' 
                      : 'bg-blue-500 text-white border-blue-500 font-medium'
                  }`}
                  onClick={handleSetConstantValue}
                >
                  Константа
                </button>
                
                <button
                  type="button"
                  className={`py-2 px-4 rounded border text-center ${
                    selectedBlock.properties?.isVariable === true
                      ? 'bg-blue-500 text-white border-blue-500 font-medium' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  onClick={handleSetVariableValue}
                >
                  Змінна
                </button>
              </div>
            </div>
            
            {selectedBlock.properties?.isVariable ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Змінна для значення:</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedBlock.properties?.value || ''}
                  onChange={(e) => handlePropertyChange('value', e.target.value)}
                >
                  <option value="">Виберіть змінну</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name} ({v.value})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Значення:</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="2147483647"
                  value={selectedBlock.properties?.value || '0'}
                  onChange={handleNumericValueChange}
                  onClick={(e) => e.target.select()}
                />
              </div>
            )}
          </>
        )}
        
        {selectedBlock.type === 'input' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Змінна для вводу:</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedBlock.properties?.variable || ''}
              onChange={handleVariableChange}
            >
              <option value="">Виберіть змінну</option>
              {variables.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.value})</option>
              ))}
            </select>
          </div>
        )}
        
        {selectedBlock.type === 'output' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Змінна для виводу:</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedBlock.properties?.variable || ''}
              onChange={handleVariableChange}
            >
              <option value="">Виберіть змінну</option>
              {variables.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.value})</option>
              ))}
            </select>
          </div>
        )}
        
        {selectedBlock.type === 'condition' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Змінна для порівняння:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedBlock.properties?.variable || ''}
                onChange={handleVariableChange}
              >
                <option value="">Виберіть змінну</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.value})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Оператор:</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedBlock.properties?.operator || '<'}
                onChange={(e) => handlePropertyChange('operator', e.target.value)}
              >
                <option value="<">Менше (&lt;)</option>
                <option value="<=">Менше або дорівнює (&le;)</option>
                <option value=">">Більше (&gt;)</option>
                <option value=">=">Більше або дорівнює (&ge;)</option>
                <option value="==">Дорівнює (==)</option>
                <option value="!=">Не дорівнює (!=)</option>
                <option value="%">Остача від ділення == 0</option>
                <option value="!%">Остача від ділення != 0</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Значення:</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                min="0"
                max="2147483647"
                value={selectedBlock.properties?.value || '0'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseInt(value) >= 0 && parseInt(value) <= 2147483647)) {
                    handlePropertyChange('value', value === '' ? '0' : value);
                  }
                }}
                onClick={(e) => e.target.select()}
              />
            </div>
          </>
        )}
        
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Підказка по з'єднанням:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Натисніть на круглі з'єднувачі, щоб створити зв'язок</p>
            <p>• Синій з'єднувач: наступний блок</p>
            {selectedBlock.type === 'condition' && (
              <>
                <p>• Зелений з'єднувач: шлях, якщо умова істинна</p>
                <p>• Червоний з'єднувач: шлях, якщо умова хибна</p>
              </>
            )}
          </div>
        </div>        
      </div>
    </div>
  );
};

export default PropertyPanel;