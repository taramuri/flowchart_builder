const TestService = {
  cancelExploration: false,
  
  async runTests(threads, variables, testCases, maxOperations = 10, onProgress = null) {
    this.cancelExploration = false;
    
    if (!testCases || testCases.length === 0) {
      return {
        output: "Немає тестових випадків для виконання.",
        progress: 0
      };
    }
    
    if (typeof maxOperations !== 'number' || isNaN(maxOperations)) {
      maxOperations = 10;
    }
    
    let output = "Результати тестування:\n\n";
    let totalProgress = 0;
    let passedTests = 0;
    let totalTests = testCases.length;
    
    const activeThreads = this.getActiveThreads(threads);
    
    for (let i = 0; i < testCases.length; i++) {
      if (this.cancelExploration) break;
      
      const testCase = testCases[i];
      
      let testOutput = `Тест #${i + 1}:\n` +
                       `  Вхідні дані: ${testCase.input.trim()}\n` +
                       `  Очікуваний вивід: ${testCase.expectedOutput.trim()}\n`;
      
      const currentOutput = output + testOutput;
      if (onProgress) {
        const shouldStop = onProgress(currentOutput, totalProgress);
        if (shouldStop) {
          this.cancelExploration = true;
          break;
        }
      }
      
      let result;
      
      if (activeThreads.length > 1) {
        result = await this.executeNondeterministicMultithreadedTest(
          activeThreads,
          variables,
          testCase.input.trim(),
          testCase.expectedOutput.trim(),
          maxOperations,
          onProgress
        );
      } else if (activeThreads.length === 1) {
        result = await this.executeDeterministicTest(
          activeThreads[0],
          variables,
          testCase.input.trim(),
          testCase.expectedOutput.trim()
        );
      } else {
        result = {
          passed: false,
          explored: 0,
          totalPossible: 0,
          progress: 0,
          correctOutputs: 0
        };
      }
      
      if (result.passed) {
        passedTests++;
      }
      
      const passPercent = result.explored > 0 
        ? ((result.correctOutputs / result.explored) * 100).toFixed(1)
        : "0.0";
      
      testOutput += this.cancelExploration 
        ? `  Результат: ${passPercent}% коректних виконань (ТЕСТУВАННЯ ПЕРЕРВАНО)\n`
        : `  Результат: ${passPercent}% коректних виконань\n`;
      
      const totalPossibleStr = isNaN(result.totalPossible) ? "невідомо" : result.totalPossible;
      testOutput += `  Перевірено ${result.explored} з ${totalPossibleStr} можливих варіантів виконання (до ${maxOperations} операцій)\n\n`;
      
      output += testOutput;
      
      totalProgress = result.progress;
      if (onProgress) {
        const shouldStop = onProgress(output, totalProgress);
        if (shouldStop) {
          this.cancelExploration = true;
          break;
        }
      }
    }
    
    const passRate = (passedTests / totalTests) * 100;
    output += `\nЗагальна статистика: пройдено ${passedTests} з ${totalTests} тестів (${passRate.toFixed(2)}%)\n`;
    
    return {
      output,
      progress: totalProgress
    };
  },
  
  cancelTesting() {
    this.cancelExploration = true;
  },
  
  async executeDeterministicTest(thread, variables, input, expectedOutput) {
    const memory = {};
    variables.forEach(v => {
      memory[v.name] = v.value;
    });
    
    const inputLines = input.split('\n').filter(line => line.trim() !== '');
    
    const result = await this.executeThreadFullExecution(thread, memory, inputLines);
    
    const normalizedOutput = result.output.trim().replace(/\s+/g, '');
    const normalizedExpected = expectedOutput.trim().replace(/\s+/g, '');
    const passed = normalizedOutput === normalizedExpected;
        
    return {
      passed,
      explored: 1,
      totalPossible: 1,
      progress: 100,
      correctOutputs: passed ? 1 : 0
    };
  },
  
  async executeNondeterministicMultithreadedTest(threads, variables, input, expectedOutput, maxOperations, onProgress) {
    const memory = {};
    variables.forEach(v => {
      memory[v.name] = v.value;
    });
    
    const inputLines = input.split('\n').filter(line => line.trim() !== '');
    
    const explorationResult = await this.exploreExecutionInterleavings(
      threads,
      memory,
      inputLines,
      expectedOutput,
      maxOperations,
      onProgress
    );
    
    return explorationResult;
  },
  
  async exploreExecutionInterleavings(threads, memory, inputLines, expectedOutput, maxOperations, onProgress) {
    const normalizedExpected = expectedOutput.trim().replace(/\s+/g, '');
    
    const queue = [];
    const visitedStates = new Set();
    let explored = 0;
    let correctOutputs = 0;
    
    const initialState = this.createInitialState(threads, memory, inputLines);
    queue.push(initialState);
    
    while (queue.length > 0 && !this.cancelExploration && explored < 50000) {
      const currentState = queue.shift();
      
      const stateKey = this.generateOptimizedStateKey(currentState);
      
      if (visitedStates.has(stateKey)) {
        continue;
      }
      visitedStates.add(stateKey);
      
      explored++;
      
      const activeThreadCount = currentState.threadStates.filter(ts => ts.isActive).length;
      const isCompleteExecution = activeThreadCount === 0;
      
      if (isCompleteExecution || currentState.operationCount >= maxOperations) {
        const normalizedOutput = currentState.output.trim().replace(/\s+/g, '');
        
        if (normalizedOutput === normalizedExpected) {
          correctOutputs++;
        }
        
        if (isCompleteExecution || currentState.operationCount >= maxOperations) {
          continue;
        }
      }
      
      if (currentState.operationCount < maxOperations && activeThreadCount > 0) {
        const nextStates = this.generateNextStatesOptimized(currentState, threads);
        
        for (const nextState of nextStates) {
          if (nextState.operationCount <= maxOperations) {
            queue.push(nextState);
          }
        }
      }
      
      if (explored % 100 === 0 && onProgress) {
        const estimatedTotal = Math.max(explored + queue.length, explored);
        const progress = Math.min(100, (explored / estimatedTotal) * 100);
        const shouldStop = onProgress(null, progress);
        if (shouldStop) {
          this.cancelExploration = true;
          break;
        }
      }
    }
    
    const estimatedTotal = this.betterEstimateTotalExecutions(threads, maxOperations, explored);
    const progress = estimatedTotal > 0 ? Math.min(100, (explored / estimatedTotal) * 100) : 100;
    
    return {
      passed: correctOutputs > 0,
      explored,
      totalPossible: estimatedTotal,
      progress,
      correctOutputs
    };
  },
  
  createInitialState(threads, memory, inputLines) {
    const threadStates = threads.map(thread => {
      const startBlock = thread.blocks.find(b => b.type === 'start');
      return {
        threadId: thread.id,
        currentBlockId: startBlock ? startBlock.id : null,
        isActive: startBlock !== null
      };
    });
    
    return {
      memory: { ...memory },
      threadStates,
      inputIndex: 0,
      inputLines,
      output: "",
      operationCount: 0,
      executionPath: []
    };
  },
  
  generateOptimizedStateKey(state) {
    const memoryKeys = Object.keys(state.memory).sort();
    const memoryStr = memoryKeys.map(key => `${key}:${state.memory[key]}`).join(',');
    
    const threadStr = state.threadStates.map(ts => 
      `${ts.currentBlockId || 'null'}:${ts.isActive ? '1' : '0'}`
    ).join('|');
    
    const ioStr = `${state.inputIndex}:${state.output.length}`;
    
    return `${memoryStr}|${threadStr}|${ioStr}`;
  },
  
  generateNextStatesOptimized(currentState, threads) {
    const nextStates = [];
    
    const availableOperations = [];
    
    for (let i = 0; i < currentState.threadStates.length; i++) {
      const threadState = currentState.threadStates[i];
      
      if (!threadState.isActive || !threadState.currentBlockId) {
        continue;
      }
      
      const thread = threads[i];
      const currentBlock = thread.blocks.find(b => b.id === threadState.currentBlockId);
      
      if (currentBlock) {
        availableOperations.push({
          threadIndex: i,
          thread: thread,
          block: currentBlock
        });
      }
    }
    
    for (const operation of availableOperations) {
      const nextState = this.executeBlockInStateOptimized(
        currentState, 
        operation.threadIndex, 
        operation.block, 
        operation.thread
      );
      
      if (nextState) {
        nextStates.push(nextState);
      }
    }
    
    return nextStates;
  },
  
  executeBlockInStateOptimized(currentState, threadIndex, block, thread) {
    const newState = {
      memory: { ...currentState.memory },
      threadStates: currentState.threadStates.map(ts => ({ ...ts })),
      inputIndex: currentState.inputIndex,
      inputLines: currentState.inputLines,
      output: currentState.output,
      operationCount: currentState.operationCount + 1,
      executionPath: [...currentState.executionPath, `T${threadIndex + 1}:${block.type}`]
    };
    
    switch (block.type) {
      case 'start':
        break;
        
      case 'end':
        newState.threadStates[threadIndex].isActive = false;
        newState.threadStates[threadIndex].currentBlockId = null;
        return newState;
        
      case 'input':
        if (block.properties && block.properties.variable) {
          const varName = block.properties.variable;
          
          if (newState.inputIndex < newState.inputLines.length) {
            try {
              const value = parseInt(newState.inputLines[newState.inputIndex], 10);
              newState.memory[varName] = isNaN(value) ? 0 : value;
              newState.inputIndex++;
            } catch (e) {
              newState.memory[varName] = 0;
            }
          } else {
            newState.memory[varName] = 0;
          }
        }
        break;
        
      case 'output':
        if (block.properties && block.properties.variable) {
          const varName = block.properties.variable;
          const value = newState.memory[varName] !== undefined ? newState.memory[varName] : 0;
          
          if (newState.output === "") {
            newState.output = `${value}`;
          } else {
            newState.output += `\n${value}`;
          }
        }
        break;
        
      case 'assign':
        if (block.properties) {
          const varName = block.properties.variable;
          
          if (block.properties.isVariable) {
            const sourceVarName = block.properties.value;
            const value = newState.memory[sourceVarName] !== undefined ? newState.memory[sourceVarName] : 0;
            newState.memory[varName] = value;
          } else {
            const value = parseInt(block.properties.value, 10);
            newState.memory[varName] = isNaN(value) ? 0 : value;
          }
        }
        break;
        
      case 'condition':
        if (block.properties) {
          const varName = block.properties.variable;
          const leftValue = newState.memory[varName] !== undefined ? newState.memory[varName] : 0;
          const rightValue = parseInt(block.properties.value, 10);
          const operator = block.properties.operator || '==';
          
          let conditionMet = false;
          
          switch (operator) {
            case '<':
              conditionMet = leftValue < rightValue;
              break;
            case '<=':
              conditionMet = leftValue <= rightValue;
              break;
            case '>':
              conditionMet = leftValue > rightValue;
              break;
            case '>=':
              conditionMet = leftValue >= rightValue;
              break;
            case '==':
              conditionMet = leftValue === rightValue;
              break;
            case '!=':
              conditionMet = leftValue !== rightValue;
              break;
            default:
              conditionMet = leftValue === rightValue;
              break;
          }
          
          const connections = thread.connections;
          let nextBlockId = null;
          
          if (conditionMet) {
            const trueConnection = connections.find(conn => 
              conn.from.block === block.id && conn.from.position === 'true'
            );
            if (trueConnection) {
              nextBlockId = trueConnection.to.block;
            }
          } else {
            const falseConnection = connections.find(conn => 
              conn.from.block === block.id && conn.from.position === 'false'
            );
            if (falseConnection) {
              nextBlockId = falseConnection.to.block;
            }
          }
          
          if (nextBlockId) {
            newState.threadStates[threadIndex].currentBlockId = nextBlockId;
          } else {
            newState.threadStates[threadIndex].isActive = false;
            newState.threadStates[threadIndex].currentBlockId = null;
          }
          
          return newState;
        }
        break;
        
      default:
        break;
    }
    
    const connection = thread.connections.find(conn => 
      conn.from.block === block.id && conn.from.position === 'next'
    );
    
    if (connection) {
      newState.threadStates[threadIndex].currentBlockId = connection.to.block;
    } else {
      newState.threadStates[threadIndex].isActive = false;
      newState.threadStates[threadIndex].currentBlockId = null;
    }
    
    return newState;
  },
  
  betterEstimateTotalExecutions(threads, maxOperations, exploredStates) {
    const activeThreadsCount = threads.filter(thread => 
      thread.blocks.some(block => block.type === 'start')
    ).length;
    
    if (activeThreadsCount <= 1) {
      return 1;
    }
    
    if (maxOperations <= 15 && activeThreadsCount === 2) {
      let totalVariants = 0;
      
      for (let thread1Ops = 0; thread1Ops <= maxOperations; thread1Ops++) {
        const thread2Ops = maxOperations - thread1Ops;
        const interleavings = this.calculateInterleavings(thread1Ops, thread2Ops);
        totalVariants += interleavings;
      }
      
      return Math.max(exploredStates, totalVariants);
    }
    
    if (maxOperations > 15) {
      const baseVariants = Math.pow(activeThreadsCount, Math.min(maxOperations, 12));
      const scaleFactor = maxOperations > 12 ? Math.pow(1.5, maxOperations - 12) : 1;
      const estimatedVariants = Math.floor(baseVariants * scaleFactor);
      const cappedVariants = Math.min(estimatedVariants, 1000000);
      
      return Math.max(exploredStates, cappedVariants);
    }
    
    const fallbackVariants = Math.max(exploredStates, 
      Math.min(Math.pow(activeThreadsCount, Math.min(maxOperations, 8)), 10000));
    
    return fallbackVariants;
  },
  
  calculateInterleavings(ops1, ops2) {
    const total = ops1 + ops2;
    
    if (total === 0) return 1;
    if (ops1 === 0 || ops2 === 0) return 1;
    
    if (total > 20) {
      return Math.min(100000, Math.pow(2, Math.min(total, 16)));
    }
    
    let result = 1;
    const k = Math.min(ops1, ops2);
    
    for (let i = 0; i < k; i++) {
      result = result * (total - i) / (i + 1);
    }
    
    return Math.floor(result);
  },
  
  executeThreadFullExecution(thread, memory, inputLines) {
    let output = "";
    let inputIndex = 0;
    
    const startBlock = thread.blocks.find(b => b.type === 'start');
    if (!startBlock) {
      return { output: "", memory };
    }
    
    const connections = {};
    thread.connections.forEach(conn => {
      if (!connections[conn.from.block]) {
        connections[conn.from.block] = {};
      }
      connections[conn.from.block][conn.from.position] = conn.to.block;
    });
    
    let currentBlockId = startBlock.id;
    let steps = 0;
    const maxSteps = 10000;
    
    while (currentBlockId && steps < maxSteps) {
      steps++;
      
      const currentBlock = this.findBlockById(thread.blocks, currentBlockId);
      if (!currentBlock) break;
      
      const executionResult = this.executeThreadBlock(currentBlock, memory, inputLines, inputIndex, output, connections);
      
      if (currentBlock.type === 'input' && currentBlock.properties && currentBlock.properties.variable) {
        if (inputIndex < inputLines.length) {
          inputIndex++;
        }
      }
      
      if (currentBlock.type === 'output' && currentBlock.properties && currentBlock.properties.variable) {
        const varName = currentBlock.properties.variable;
        const value = memory[varName] !== undefined ? memory[varName] : 0;
        
        if (output === "") {
          output = `${value}`;
        } else {
          output += `\n${value}`;
        }
      }
      
      currentBlockId = executionResult.nextBlockId;
    }
    
    return {
      output,
      memory
    };
  },
  
  findBlockById(blocks, blockId) {
    return blocks.find(b => b.id === blockId);
  },
  
  executeThreadBlock(block, memory, inputLines, inputIndex, output, connections) {
    let nextBlockId = null;
    
    switch (block.type) {
      case 'start':
        break;
        
      case 'end':
        return { nextBlockId: null };
        
      case 'input':
        if (block.properties && block.properties.variable) {
          const varName = block.properties.variable;
          
          if (inputIndex < inputLines.length) {
            try {
              const value = parseInt(inputLines[inputIndex], 10);
              memory[varName] = isNaN(value) ? 0 : value;
            } catch (e) {
              memory[varName] = 0;
            }
          } else {
            memory[varName] = 0;
          }
        }
        break;
        
      case 'output':
        break;
      
      case 'assign':
        if (block.properties) {
          const varName = block.properties.variable;
          
          if (block.properties.isVariable) {
            const sourceVarName = block.properties.value;
            const value = memory[sourceVarName] !== undefined ? memory[sourceVarName] : 0;
            memory[varName] = value;
          } else {
            const value = parseInt(block.properties.value, 10);
            memory[varName] = isNaN(value) ? 0 : value;
          }
        }
        break;
        
      case 'condition':
        if (block.properties) {
          const varName = block.properties.variable;
          const leftValue = memory[varName] !== undefined ? memory[varName] : 0;
          const rightValue = parseInt(block.properties.value, 10);
          const operator = block.properties.operator || '==';
          
          let conditionMet = false;
          
          switch (operator) {
            case '<':
              conditionMet = leftValue < rightValue;
              break;
            case '<=':
              conditionMet = leftValue <= rightValue;
              break;
            case '>':
              conditionMet = leftValue > rightValue;
              break;
            case '>=':
              conditionMet = leftValue >= rightValue;
              break;
            case '==':
              conditionMet = leftValue === rightValue;
              break;
            case '!=':
              conditionMet = leftValue !== rightValue;
              break;
            default:
              conditionMet = leftValue === rightValue;
              break;
          }
          
          if (conditionMet) {
            if (connections[block.id] && connections[block.id].true) {
              return { nextBlockId: connections[block.id].true };
            }
          } else {
            if (connections[block.id] && connections[block.id].false) {
              return { nextBlockId: connections[block.id].false };
            }
          }
          
          return { nextBlockId: null };
        }
        break;
        
      default:
        break;
    }
    
    if (connections[block.id] && connections[block.id].next) {
      nextBlockId = connections[block.id].next;
    }
    
    return { nextBlockId };
  },
  
  getActiveThreads(threads) {
    return threads.filter(thread => {
      const hasBlocks = thread.blocks && thread.blocks.length > 0;
      const hasStart = hasBlocks && thread.blocks.some(block => block.type === 'start');
      
      return hasBlocks && hasStart;
    });
  }
};

export default TestService;