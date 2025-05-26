import React, { useState, useRef, useEffect, useCallback } from 'react';
import Block from '../blocks/Block';
import Connection from '../connections/Connection';

const FlowchartEditor = ({ 
  thread, 
  onUpdateBlocks, 
  onUpdateConnections,
  selectedBlock,
  onSelectBlock,
  onDeleteBlock
  
}) => {
  const [draggingBlock, setDraggingBlock] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const editorRef = useRef(null);
  const [editorRect, setEditorRect] = useState({ left: 0, top: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    const updateEditorRect = () => {
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setEditorRect({ left: rect.left, top: rect.top });
      }
    };

    updateEditorRect();
    window.addEventListener('resize', updateEditorRect);
    return () => window.removeEventListener('resize', updateEditorRect);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.5), 2);
        
      const rect = editor.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom - pan.x;
      const mouseY = (e.clientY - rect.top) / zoom - pan.y;
      
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    editor.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      editor.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom, pan]);

  const handleDeleteBlock = useCallback((blockId) => {
    onDeleteBlock(blockId);
    
  }, [onDeleteBlock]);

  const handleDeleteConnection = useCallback((connectionId) => {
    if (!thread || !thread.connections) return;
    
    const updatedConnections = thread.connections.filter(conn => conn.id !== connectionId);
    onUpdateConnections(updatedConnections);
    setSelectedConnection(null);
  }, [thread, onUpdateConnections]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSelectBlock(null);
        setSelectedConnection(null);
        setConnecting(false);
        setConnectionStart(null);
        setTempConnection(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlock) {          
          handleDeleteBlock(selectedBlock.id);
        } else if (selectedConnection) {
          handleDeleteConnection(selectedConnection);
        }
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBlock, selectedConnection, onSelectBlock, handleDeleteBlock, handleDeleteConnection]);

  const handleDragStart = (e, block) => {
    e.preventDefault();
    if (e.button !== 0) return; 
  
    const mouseX = (e.clientX - editorRect.left) / zoom;
    const mouseY = (e.clientY - editorRect.top) / zoom;
  
    const offsetX = mouseX - (block.x + pan.x);
    const offsetY = mouseY - (block.y + pan.y);
  
    setDraggingBlock(block);
    setDragOffset({ x: offsetX, y: offsetY });
  };
  
  const handleMouseMove = (e) => {
    if (draggingBlock) {
      const mouseX = (e.clientX - editorRect.left) / zoom;
      const mouseY = (e.clientY - editorRect.top) / zoom;
  
      const newX = mouseX - dragOffset.x - pan.x;
      const newY = mouseY - dragOffset.y - pan.y;
  
      const updatedBlocks = thread.blocks.map(b => {
        if (b.id === draggingBlock.id) {
          return { ...b, x: newX, y: newY };
        }
        return b;
      });
  
      onUpdateBlocks(updatedBlocks);
    } else if (connecting && connectionStart) {
      const mouseX = (e.clientX - editorRect.left) / zoom - pan.x;
      const mouseY = (e.clientY - editorRect.top) / zoom - pan.y;
  
      setTempConnection({
        startX: connectionStart.x,
        startY: connectionStart.y,
        endX: mouseX,
        endY: mouseY,
      });
    } else if (isMiddleMouseDown) {
      const dx = (e.clientX - lastMousePos.x) / zoom;
      const dy = (e.clientY - lastMousePos.y) / zoom;
  
      setPan({
        x: pan.x + dx,
        y: pan.y + dy,
      });
  
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e) => {
    if (draggingBlock) {
      setDraggingBlock(null);
    }

    if (connecting && tempConnection) {
      const mouseX = (e.clientX - editorRect.left) / zoom - pan.x;
      const mouseY = (e.clientY - editorRect.top) / zoom - pan.y;

      const targetBlock = thread.blocks.find(block => {
        const blockWidth = block.type === 'condition' ? 150 : 120;
        const blockHeight = block.type === 'condition' ? 150 : 60;
        
        return (
          mouseX >= block.x - blockWidth/2 &&
          mouseX <= block.x + blockWidth/2 &&
          mouseY >= block.y - blockHeight/2 &&
          mouseY <= block.y + blockHeight/2
        );
      });

      if (targetBlock && targetBlock.id !== connectionStart.blockId) {
        const newConnection = {
          id: `conn_${thread.connections.length + 1}`,
          from: {
            block: connectionStart.blockId,
            position: connectionStart.position,
          },
          to: {
            block: targetBlock.id,
            position: 'in',
          },
        };

        onUpdateConnections([...thread.connections, newConnection]);
      }
    }

    setConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
    setIsMiddleMouseDown(false);
  };

  const handleStartConnection = (blockId, position, x, y) => {
    setConnecting(true);
    setConnectionStart({ blockId, position, x, y });
    setTempConnection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleMouseDown = (e) => {
    if (e.button === 1) { 
      e.preventDefault();
      setIsMiddleMouseDown(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleEditorClick = (e) => {
    if (e.target === editorRef.current) {
      onSelectBlock(null);
    }
  };

  const handleSelectBlock = (block) => {
    onSelectBlock(block);
  };

  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={editorRef}
      className="w-full h-full bg-gray-50 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      onClick={handleEditorClick}
    >
      {/* Зум та пан контроль */}
      <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md p-2 flex space-x-2 z-10">
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300"
          onClick={zoomIn}
        >
          +
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300"
          onClick={zoomOut}
        >
          -
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300"
          onClick={resetZoomPan}
        >
          ↺
        </button>
      </div>

      {/* Сітка фону  */}
      <div 
        className="absolute bg-grid-pattern"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          transformOrigin: '0 0',
          width: `${200 / zoom}%`,
          height: `${200 / zoom}%`,
          left: `${-50 / zoom}%`,
          top: `${-50 / zoom}%`,
        }}
      />

      {/* Робоча область */}
      <div 
        className="absolute inset-0"
        style={{ 
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* З'єднання */}
        {thread?.connections.map(connection => {
          const fromBlock = thread.blocks.find(b => b.id === connection.from.block);
          const toBlock = thread.blocks.find(b => b.id === connection.to.block);
          
          if (!fromBlock || !toBlock) return null;
          
          let startX, startY, endX, endY;
          
          if (fromBlock.type === 'condition' && 
              (connection.from.position === 'true' || connection.from.position === 'false')) {
            if (connection.from.position === 'true') {
              startX = fromBlock.x + 75;
              startY = fromBlock.y;
            } else {
              startX = fromBlock.x - 75;
              startY = fromBlock.y;
            }
          } else {
            startX = fromBlock.x;
            startY = fromBlock.y + 40;
          }
          
          endX = toBlock.x;
          endY = toBlock.y - 30;
          
          return (
            <Connection
              key={connection.id}
              id={connection.id}
              startX={startX}
              startY={startY}
              endX={endX}
              endY={endY}
              type={connection.from.position}
              isSelected={selectedConnection === connection.id}
              onSelect={setSelectedConnection}
            />
          );
        })}

        {/* Тимчасове з'єднання під час створення */}
        {tempConnection && (
          <Connection
            startX={tempConnection.startX}
            startY={tempConnection.startY}
            endX={tempConnection.endX}
            endY={tempConnection.endY}
            type="temp"
          />
        )}

        {/* Блоки */}
        {thread?.blocks.map(block => (
          <Block
            key={block.id}
            block={block}
            isSelected={selectedBlock?.id === block.id}
            onDragStart={(e) => handleDragStart(e, block)}
            onSelect={() => handleSelectBlock(block)}
            onStartConnection={handleStartConnection}
          />
        ))}
      </div>
    </div>
  );
};

export default FlowchartEditor;