const CodeGenerator = {
  generatePythonCode: (threads, variables) => {
    let code = `import threading\n\n`;
    
    code += `# Глобальні змінні\n`;
    variables.forEach(v => {
      code += `${v.name} = ${v.value}\n`;
    });
    
    code += `\n# Лок для синхронізації доступу до спільних змінних\nlock = threading.Lock()\n\n`;
    
    threads.forEach(thread => {
      code += `def thread_${thread.id}_function():\n`;
      
      if (variables.length > 0) {
        code += `    global ${variables.map(v => v.name).join(', ')}\n\n`;
      } else {
        code += `\n`;
      }
      
      if (!thread.blocks || thread.blocks.length === 0) {
        code += `    pass  # Порожній потік\n\n`;
        return;
      }
      
      const startBlock = thread.blocks.find(b => b.type === 'start');
      if (!startBlock) {
        code += `    print("Помилка: потік ${thread.name} не має початкового блоку")\n`;
        code += `    return\n\n`;
        return;
      }
      
      const connections = {};
      if (thread.connections && thread.connections.length > 0) {
        thread.connections.forEach(conn => {
          if (!connections[conn.from.block]) {
            connections[conn.from.block] = {};
          }
          connections[conn.from.block][conn.from.position] = conn.to.block;
        });
      }
      
      function generateCode(blockId, indent, visited = new Set()) {
        if (visited.has(blockId)) {
          return;
        }
        
        visited.add(blockId);
        const block = thread.blocks.find(b => b.id === blockId);
        if (!block) return;

        switch (block.type) {
          case 'start':
            code += `${indent}print("Початок потоку ${thread.name}")\n`;
            break;
            
          case 'end':
            code += `${indent}print("Кінець потоку ${thread.name}")\n`;
            return;
            
          case 'assign':
            code += `${indent}with lock:\n`;
            if (block.properties?.isVariable) {
              code += `${indent}    ${block.properties?.variable} = ${block.properties?.value}\n`;
            } else {
              code += `${indent}    ${block.properties?.variable} = ${block.properties?.value}\n`;
            }
            break;
            
          case 'input':
            if (block.properties?.variable && block.properties.variable !== '') {
              code += `${indent}with lock:\n`;
              code += `${indent}    try:\n`;
              code += `${indent}        ${block.properties.variable} = int(input("Введіть ${block.properties.variable}: "))\n`;
              code += `${indent}    except ValueError:\n`;
              code += `${indent}        print("Помилка: введіть ціле число")\n`;
              code += `${indent}        ${block.properties.variable} = 0\n`;
            } else {
              code += `${indent}# УВАГА: Блок вводу не має вказаної змінної\n`;
              code += `${indent}with lock:\n`;
              code += `${indent}    print("Помилка: Блок вводу не має вказаної змінної")\n`;
            }
            break;
              
          case 'output':
            if (block.properties?.variable && block.properties.variable !== '') {
              code += `${indent}with lock:\n`;
              code += `${indent}    print(f"${block.properties.variable} = {${block.properties.variable}}")\n`;
            } else {
              code += `${indent}# УВАГА: Блок виводу не має вказаної змінної\n`;
              code += `${indent}with lock:\n`;
              code += `${indent}    print("Помилка: Блок виводу не має вказаної змінної")\n`;
            }
            break;
            
          case 'condition':
            const operator = block.properties?.operator || '<';
            const trueBlockId = connections[blockId]?.true;
            const falseBlockId = connections[blockId]?.false;
            
            if (block.properties?.variable && block.properties?.value !== undefined) {
              let conditionCode = `${block.properties.variable} ${operator} ${block.properties.value}`;
              
              if (operator === '%') {
                conditionCode = `${block.properties.variable} % ${block.properties.value} == 0`;
              } else if (operator === '!%') {
                conditionCode = `${block.properties.variable} % ${block.properties.value} != 0`;
              }
              
              code += `${indent}if ${conditionCode}:\n`;
              
              if (trueBlockId) {
                generateCode(trueBlockId, indent + '    ', new Set(visited));
              }
              
              if (falseBlockId) {
                code += `${indent}else:\n`;
                generateCode(falseBlockId, indent + '    ', new Set(visited));
              }
            } else {
              code += `${indent}# УВАГА: Блок умови не має вказаної змінної або значення\n`;
              code += `${indent}print("Помилка: Блок умови не має вказаної змінної або значення")\n`;
              
              if (trueBlockId) {
                generateCode(trueBlockId, indent, new Set(visited));
              } else if (falseBlockId) {
                generateCode(falseBlockId, indent, new Set(visited));
              }
            }
            
            return;
            
          default:
            code += `${indent}# Невідомий тип блоку: ${block.type}\n`;
            break;
        }
        
        const nextBlockId = connections[blockId]?.next;
        if (nextBlockId) {
          generateCode(nextBlockId, indent, visited);
        }
      }
      
      generateCode(startBlock.id, '    ');
      
      code += '\n';
    });
    
    code += `def main():\n`;
    code += `    # Створення потоків\n`;
    threads.forEach(thread => {
      code += `    thread_${thread.id} = threading.Thread(target=thread_${thread.id}_function)\n`;
    });
    
    code += `\n    # Запуск потоків\n`;
    threads.forEach(thread => {
      code += `    thread_${thread.id}.start()\n`;
    });
    
    code += `\n    # Очікування завершення потоків\n`;
    threads.forEach(thread => {
      code += `    thread_${thread.id}.join()\n`;
    });
    
    code += `\nif __name__ == "__main__":\n`;
    code += `    main()\n`;
    
    return code;
  }
};

export default CodeGenerator;