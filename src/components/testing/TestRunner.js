import React, { useState } from 'react';
import { Plus, X, Play, AlertTriangle } from 'lucide-react';

const TestRunner = ({ 
  testCases, 
  onAddTestCase, 
  onUpdateTestCase, 
  onRemoveTestCase, 
  onRunTests,
  testOutput,
  testProgress 
}) => {
  const [explorationLimit, setExplorationLimit] = useState(10);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Тестові випадки</h3>
        <button
          className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
          onClick={onAddTestCase}
          title="Додати новий тестовий випадок"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {/* Список тестових випадків */}
      {testCases.length > 0 ? (
        <div className="space-y-4">
          {testCases.map((testCase, index) => (
            <div key={index} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Тест #{index + 1}</div>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onRemoveTestCase(index)}
                  title="Видалити тестовий випадок"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Вхідні дані (по одному числу на рядок):
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 h-20"
                    value={testCase.input}
                    onChange={(e) => onUpdateTestCase(index, 'input', e.target.value)}
                    placeholder="42&#10;17&#10;100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Очікуваний вивід (по одному числу на рядок):
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 h-20"
                    value={testCase.expectedOutput}
                    onChange={(e) => onUpdateTestCase(index, 'expectedOutput', e.target.value)}
                    placeholder="59&#10;42"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border rounded bg-gray-50">
          <div className="text-gray-500 mb-2">Немає тестових випадків</div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={onAddTestCase}
          >
            Додати тестовий випадок
          </button>
        </div>
      )}
      
      <div className="border rounded p-4 bg-gray-50">
        <h4 className="font-medium mb-2">Налаштування для недетермінованих виконань</h4>
        
        <div className="flex items-center mb-4">
          <label className="mr-2 text-sm">Максимальна кількість операцій:</label>
          <input
            type="number"
            className="border rounded px-3 py-1 w-20"
            min="1"
            max="20"
            value={explorationLimit}
            onChange={(e) => setExplorationLimit(parseInt(e.target.value))}
          />
          <span className="ml-2 text-xs text-gray-500">(1-20)</span>
        </div>
        
        <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded flex items-start">
          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            Для недетермінованих блок-схем (де два потоки можуть одночасно змінювати спільні змінні), 
            система перевірить різні можливі варіанти виконання.
          </div>
        </div>
      </div>
      
      {/* Кнопка запуску тестів */}
      <div className="flex justify-center">
        <button
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center"
          onClick={onRunTests}
          disabled={testCases.length === 0}
        >
          <Play size={16} className="mr-2" />
          Запустити тести
        </button>
      </div>
      
      {/* Результати тестування */}
      {testOutput && (
        <div>
          <h4 className="font-medium mb-2">Результати тестування:</h4>
          
          <div className="border rounded bg-gray-800 text-white p-4 font-mono text-sm overflow-x-auto whitespace-pre">
            {testOutput}
          </div>
          
          {testProgress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Прогрес дослідження недетермінованих виконань:</span>
                <span>{testProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${testProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestRunner;