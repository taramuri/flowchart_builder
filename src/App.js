import React, { useState } from 'react';
import { Save, Upload, Code, PlayCircle, Plus, X, Download, StopCircle } from 'lucide-react';
import FlowchartEditor from './components/editor/FlowchartEditor';
import ThreadsList from './components/panel/ThreadsList';
import VariableManager from './components/panel/VariableManager';
import BlockPalette from './components/blocks/BlockPalette';
import PropertyPanel from './components/panel/PropertyPanel';
import { saveToFile, loadFromFile } from './services/FileService';
import CodeGenerator from './services/CodeGenerator';
import TestService from './services/TestService';

import './App.css';

function App() {
  const [threads, setThreads] = useState([{ id: 1, name: 'Потік 1', blocks: [], connections: [] }]);
  const [variables, setVariables] = useState([]);
  const [activeTab, setActiveTab] = useState('threads');
  const [activeThread, setActiveThread] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testOutput, setTestOutput] = useState('');
  const [testProgress, setTestProgress] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [shouldStopTesting, setShouldStopTesting] = useState(false);
  const [explorationLimit, setExplorationLimit] = useState(10);

  const blockTypes = [
    { id: 'start', name: 'Початок', color: 'bg-green-200', type: 'control' },
    { id: 'end', name: 'Кінець', color: 'bg-red-200', type: 'control' },
    { id: 'assign', name: 'Присвоєння', color: 'bg-gray-200', type: 'operation' },
    { id: 'input', name: 'Ввід', color: 'bg-blue-200', type: 'io' },
    { id: 'output', name: 'Вивід', color: 'bg-blue-200', type: 'io' },
    { id: 'condition', name: 'Умова', color: 'bg-yellow-200', type: 'control' },
  ];

  const addThread = () => {
    const newThreadId = threads.length + 1;
    setThreads([...threads, { id: newThreadId, name: `Потік ${newThreadId}`, blocks: [], connections: [] }]);
  };

  const updateThreadName = (threadId, newName) => {
    setThreads(threads.map(t => t.id === threadId ? { ...t, name: newName } : t));
  };

  const removeThread = (threadId) => {
    if (threads.length > 1) {
      setThreads(threads.filter(t => t.id !== threadId));
      if (activeThread === threadId) {
        setActiveThread(threads[0].id !== threadId ? threads[0].id : threads[1].id);
      }
    }
  };

  const updateBlocks = (threadId, updatedBlocks) => {
    setThreads(threads.map(t => t.id === threadId ? { ...t, blocks: updatedBlocks } : t));
  };

  const updateBlockAndRefresh = (blockId, properties) => {
    const threadIndex = threads.findIndex(t => t.id === activeThread);
    if (threadIndex === -1) return;
    
    const newThreads = [...threads];
    const thread = newThreads[threadIndex];
    
    const updatedBlocks = thread.blocks.map(b => 
      b.id === blockId ? { ...b, properties } : b
    );
    thread.blocks = updatedBlocks;
    
    setThreads(newThreads);
    
    const updatedBlock = updatedBlocks.find(b => b.id === blockId);
    
    setSelectedBlock(null);
    
    setTimeout(() => {
      setSelectedBlock(updatedBlock);
    }, 10);
  };
  
  const updateBlockPropertiesAndVariables = (blockId, properties) => {
    const thread = threads.find(t => t.id === activeThread);
    if (!thread) return;
    
    const block = thread.blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const oldProperties = block.properties || {};
    const newProperties = properties;
    
    updateBlockAndRefresh(blockId, properties);
    
    if (block.type === 'assign' && !newProperties.isVariable && 
        oldProperties.variable === newProperties.variable) {
      const varName = newProperties.variable;
      if (varName) {
        const newValue = parseInt(newProperties.value, 10);
        if (!isNaN(newValue)) {
          
          updateVariableInBlocks(varName, newValue);
        }
      }
    }
  };

  const updateConnections = (threadId, updatedConnections) => {
    setThreads(threads.map(t => t.id === threadId ? { ...t, connections: updatedConnections } : t));
  };

  const deleteBlock = (blockId) => {
    setThreads(prevThreads => {
      const newThreads = [...prevThreads];
      
      const threadIndex = newThreads.findIndex(t => t.id === activeThread);
      if (threadIndex === -1) {
        console.error("Не знайдено активний потік:", activeThread);
        return prevThreads;
      }
      
      const thread = {...newThreads[threadIndex]};
      
      const newBlocks = thread.blocks.filter(b => b.id !== blockId);
      const newConnections = thread.connections.filter(
        c => c.from.block !== blockId && c.to.block !== blockId
      );
              
      thread.blocks = newBlocks;
      thread.connections = newConnections;
      
      newThreads[threadIndex] = thread;
      
      return newThreads;
    });
    
    setSelectedBlock(null);
  };

  const addVariable = (varName) => {
    if (varName && !variables.find(v => v.name === varName)) {
      setVariables([...variables, { name: varName, value: 0 }]);
      return true;
    }
    return false;
  };

  const updateVariableInBlocks = (varName, newValue) => {
    setVariables(prevVariables => 
      prevVariables.map(v => v.name === varName ? { ...v, value: newValue } : v)
    );
    
    setThreads(prevThreads => {
      const newThreads = prevThreads.map(thread => {
        const updatedBlocks = thread.blocks.map(block => {           
          return block;
        });
    
        return {
          ...thread,
          blocks: updatedBlocks
        };
      });
    
      return newThreads;
    });
          
    if (selectedBlock) {
      const needsUpdate = 
        (selectedBlock.type === 'assign' && 
          (selectedBlock.properties?.variable === varName || 
           (selectedBlock.properties?.isVariable && selectedBlock.properties?.value === varName))) ||
        ((selectedBlock.type === 'input' || selectedBlock.type === 'output' || selectedBlock.type === 'condition') && 
          selectedBlock.properties?.variable === varName);
      
      if (needsUpdate) {          
        const blockId = selectedBlock.id;
        const threadId = activeThread;
        
        setSelectedBlock(null);
        
        setTimeout(() => {
          const thread = threads.find(t => t.id === threadId);
          if (thread) {
            const block = thread.blocks.find(b => b.id === blockId);
            if (block) {
              setSelectedBlock(block);
            }
          }
        }, 50);
      }
    }
  };

  const removeVariable = (varName) => {
    setVariables(variables.filter(v => v.name !== varName));
  };

  const generateCode = () => {
    const code = CodeGenerator.generatePythonCode(threads, variables);
    setGeneratedCode(code);
    setShowCodeModal(true);
  };

  const runTests = async () => { 
    setShowTestModal(true);
    setTestOutput(`Починаю тестування з максимальною кількістю операцій K = ${explorationLimit}...\n`);
    setTestProgress(0);
    setIsTesting(true);
    setShouldStopTesting(false);
    
    try {
      const results = await TestService.runTests(
        threads, 
        variables, 
        testCases,
        explorationLimit,
        (output, progress) => {
          setTestOutput(output);
          setTestProgress(Math.floor(progress));
          return shouldStopTesting;
        }
      );
      
      setTestOutput(results.output);
      setTestProgress(results.progress);
    } catch (error) {
      setTestOutput(`Помилка тестування: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  const cancelTesting = () => {
    setShouldStopTesting(true);
    TestService.cancelTesting();
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const updateTestCase = (index, field, value) => {
    const updatedCases = [...testCases];
    updatedCases[index] = { ...updatedCases[index], [field]: value };
    setTestCases(updatedCases);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const saveProject = () => {
    const data = { threads, variables, testCases };
    saveToFile(data, 'flowchart-project.json');
  };

  const handleLoadProject = (e) => {
    loadFromFile(e, (data) => {
      if (data.threads) setThreads(data.threads);
      if (data.variables) setVariables(data.variables);
      if (data.testCases) setTestCases(data.testCases);
      setSelectedBlock(null);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Верхня панель */}
      <div className="bg-gray-800 text-white p-4">
        <h1 className="text-xl font-bold">Інструмент для програмування блок-схем</h1>
      </div>

      {/* Панель інструментів */}
      <div className="bg-gray-200 p-2 flex space-x-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center space-x-1"
          onClick={() => {
            setThreads([{ id: 1, name: 'Потік 1', blocks: [], connections: [] }]);
            setVariables([]);
            setTestCases([]);
            setActiveThread(1);
            setSelectedBlock(null);
          }}>
          <Plus size={16} />
          <span>Нова блок-схема</span>
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-1"
          onClick={saveProject}>
          <Save size={16} />
          <span>Зберегти</span>
        </button>
        <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-1 cursor-pointer">
          <Upload size={16} />
          <span>Завантажити</span>
          <input type="file" accept=".json" className="hidden" onChange={handleLoadProject} />
        </label>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 flex items-center space-x-1"
          onClick={generateCode}>
          <Code size={16} />
          <span>Генерувати код</span>
        </button>
        <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center space-x-1"
          onClick={runTests}>
          <PlayCircle size={16} />
          <span>Тестування</span>
        </button>
      </div>

      {/* Головний вміст */}
      <div className="flex flex-1 overflow-hidden">
        {/* Ліва бічна панель */}
        <div className="w-80 bg-white shadow-md overflow-y-auto flex flex-col">
          {/* Вкладки */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-2 ${activeTab === 'threads' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('threads')}
            >
              Потоки
            </button>
            <button
              className={`flex-1 py-2 ${activeTab === 'variables' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('variables')}
            >
              Змінні
            </button>
            <button
              className={`flex-1 py-2 ${activeTab === 'props' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('props')}
            >
              Властивості
            </button>
          </div>

          {/* Вміст вкладок */}
          <div className="flex-1 p-4">
            {activeTab === 'threads' && (
              <ThreadsList
                threads={threads}
                activeThread={activeThread}
                onSelectThread={(id) => setActiveThread(id)}
                onAddThread={addThread}
                onRemoveThread={removeThread}
                onUpdateThreadName={updateThreadName}
              />
            )}
            
            {activeTab === 'variables' && (
              <VariableManager
                variables={variables}
                onAddVariable={addVariable}
                onRemoveVariable={removeVariable}
                onUpdateVariable={updateVariableInBlocks}
              />
            )}
            
            {activeTab === 'props' && (
              <PropertyPanel
                selectedBlock={selectedBlock}
                variables={variables}
                onUpdateBlock={(blockId, properties) => {
                  updateBlockPropertiesAndVariables(blockId, properties);
                }}
                onRemoveBlock={() => {
                  if (selectedBlock) {
                    deleteBlock(selectedBlock.id);
                  }
                }}
                onSelectBlock={setSelectedBlock}
              />
            )}
          </div>

          {/* Палітра блоків */}
          <div className="p-4 border-t">
            <h3 className="font-medium mb-2">Палітра блоків</h3>
            <BlockPalette
              blockTypes={blockTypes}
              onSelectBlockType={(blockType) => {
                const thread = threads.find(t => t.id === activeThread);
                if (thread) {
                  const newBlockId = `thread_${activeThread}_block_${thread.blocks.length + 1}`;
                  const newBlock = {
                    id: newBlockId,
                    type: blockType.id,
                    x: 300,
                    y: 200,
                    properties: {}
                  };
                  
                  if (blockType.id === 'assign') {
                    newBlock.properties = {
                      variable: variables[0]?.name || '',
                      value: '0',
                      isVariable: false
                    };
                  } else if (blockType.id === 'input' || blockType.id === 'output') {
                    newBlock.properties = {
                      variable: variables[0]?.name || ''
                    };
                  } else if (blockType.id === 'condition') {
                    newBlock.properties = {
                      variable: variables[0]?.name || '',
                      operator: '<',
                      value: '0'
                    };
                  }
                  
                  updateBlocks(activeThread, [...thread.blocks, newBlock]);
                }
              }}
            />
          </div>
        </div>

        {/* Основна область редагування */}
        <div className="flex-1 overflow-hidden relative">
          <FlowchartEditor
            thread={threads.find(t => t.id === activeThread)}
            onUpdateBlocks={(blocks) => updateBlocks(activeThread, blocks)}
            onUpdateConnections={(connections) => updateConnections(activeThread, connections)}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            variables={variables}
            onDeleteBlock={deleteBlock}
          />
        </div>
      </div>

      {/* Модальне вікно з кодом */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">Згенерований код</h2>
              <button onClick={() => setShowCodeModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-800 text-white rounded-md p-4 overflow-x-auto">
                <code>{generatedCode}</code>
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-1"
                onClick={() => {
                  const blob = new Blob([generatedCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'flowchart_program.py';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={16} />
                <span>Завантажити код</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно тестування */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">Тестування блок-схеми</h2>
              <button onClick={() => setShowTestModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Тестові випадки</h3>
                  <button
                    className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                    onClick={addTestCase}
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
                            onClick={() => removeTestCase(index)}
                            title="Видалити тестовий випадок"
                            disabled={isTesting}
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
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              placeholder="42&#10;17&#10;100"
                              disabled={isTesting}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Очікуваний вивід (по одному числу на рядок):
                            </label>
                            <textarea
                              className="w-full border rounded px-3 py-2 h-20"
                              value={testCase.expectedOutput}
                              onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                              placeholder="59&#10;42"
                              disabled={isTesting}
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
                      onClick={addTestCase}
                      disabled={isTesting}
                    >
                      Додати тестовий випадок
                    </button>
                  </div>
                )}
                
                {/* Налаштування для недетермінованих виконань */}
                <div className="border rounded p-4 bg-blue-50">
                  <h4 className="font-medium mb-2 text-blue-800">Налаштування для недетермінованих виконань</h4>
                  
                  <div className="flex items-center mb-4">
                    <label className="mr-2 text-sm font-medium">Максимальна кількість операцій (K):</label>
                    <input
                      type="number"
                      className="border rounded px-3 py-1 w-20 text-center font-medium"
                      min="1"
                      max="20"
                      value={explorationLimit}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const clampedValue = Math.max(1, Math.min(20, value));
                        setExplorationLimit(clampedValue);
                      }}
                      disabled={isTesting}
                    />
                    <span className="ml-2 text-xs text-gray-500">(обмежено 1-20)</span>
                  </div>
                  
                  <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded flex items-start">
                    <div className="text-blue-500 mt-0.5 mr-2 flex-shrink-0">ℹ️</div>
                    <div>
                      <strong>Поточне значення K: {explorationLimit}</strong><br/>
                      Для недетермінованих блок-схем (де два або більше потоків можуть одночасно змінювати спільні змінні), 
                      система перевірить різні можливі варіанти виконання з не більше ніж <strong>{explorationLimit}</strong> операціями.
                    </div>
                  </div>
                </div>
                
                {/* Кнопка запуску/зупинки тестів */}
                <div className="flex justify-center">
                  {!isTesting ? (
                    <button
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center"
                      onClick={runTests}
                      disabled={testCases.length === 0}
                    >
                      <PlayCircle size={16} className="mr-2" />
                      Запустити тести (K={explorationLimit})
                    </button>
                  ) : (
                    <button
                      className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center"
                      onClick={cancelTesting}
                    >
                      <StopCircle size={16} className="mr-2" />
                      Зупинити тестування
                    </button>
                  )}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;