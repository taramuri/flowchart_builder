import React from 'react';

const Block = ({ 
  block, 
  isSelected, 
  onDragStart, 
  onSelect,
  onStartConnection
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(block);
  };
  
  let blockStyle = {
    position: 'absolute',
    left: `${block.x}px`,
    top: `${block.y}px`,
    transform: 'translate(-50%, -50%)'
  };
  
  let blockContent;
  let connectionPoints = [];
  
  switch (block.type) {
    case 'start':
      blockContent = (
        <div 
          className={`w-32 h-16 rounded-full flex items-center justify-center bg-green-200 
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          Початок
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="out"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 
            bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'next', block.x, block.y + 30);
          }}
        />
      );
      break;
      
    case 'end':
      blockContent = (
        <div 
          className={`w-32 h-16 rounded-full flex items-center justify-center bg-red-200 
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          Кінець
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="in"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-gray-500 rounded-full cursor-pointer hover:bg-gray-600 z-10"
        />
      );
      break;
      
    case 'condition':
      blockContent = (
        <div 
          className={`w-40 h-40 transform rotate-45 bg-yellow-200 flex items-center justify-center
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          <div className="transform -rotate-45 text-center p-4 w-full">
            {block.properties?.variable || 'змінна'} {block.properties?.operator || '<'} {block.properties?.value || '0'}
          </div>
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="in"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-gray-500 rounded-full cursor-pointer hover:bg-gray-600 z-10"
        />,
        <div 
          key="true"
          className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-green-500 rounded-full cursor-pointer hover:bg-green-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'true', block.x + 75, block.y);
          }}
        />,
        <div 
          key="false"
          className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-red-500 rounded-full cursor-pointer hover:bg-red-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'false', block.x - 75, block.y);
          }}
        />,
        <div 
          key="next"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 
            bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'next', block.x, block.y + 75);
          }}
        />
      );
      break;
      
    case 'assign':
      const assignValue = block.properties?.isVariable 
        ? block.properties?.value 
        : block.properties?.value;
        
      blockContent = (
        <div 
          className={`w-40 h-20 bg-gray-200 flex items-center justify-center
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          <div className="text-center p-2">
            {block.properties?.variable || 'змінна'} = {assignValue || '0'}
          </div>
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="in"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-gray-500 rounded-full cursor-pointer hover:bg-gray-600 z-10"
        />,
        <div 
          key="out"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 
            bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'next', block.x, block.y + 40);
          }}
        />
      );
      break;
      
    case 'input':
      blockContent = (
        <div 
          className={`w-40 h-20 bg-blue-200 flex items-center justify-center
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          <div className="text-center p-2">
            ВВЕДЕННЯ {block.properties?.variable || 'змінна'}
          </div>
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="in"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-gray-500 rounded-full cursor-pointer hover:bg-gray-600 z-10"
        />,
        <div 
          key="out"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 
            bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'next', block.x, block.y + 40);
          }}
        />
      );
      break;
      
    case 'output':
      blockContent = (
        <div 
          className={`w-40 h-20 bg-blue-200 flex items-center justify-center
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          <div className="text-center p-2">
            ВИВЕДЕННЯ {block.properties?.variable || 'змінна'}
          </div>
        </div>
      );
      
      connectionPoints.push(
        <div 
          key="in"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 
            bg-gray-500 rounded-full cursor-pointer hover:bg-gray-600 z-10"
        />,
        <div 
          key="out"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 
            bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onStartConnection(block.id, 'next', block.x, block.y + 40);
          }}
        />
      );
      break;
      
    default:
      blockContent = (
        <div 
          className={`w-40 h-20 bg-gray-300 flex items-center justify-center
            ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onMouseDown={(e) => onDragStart(e, block)}
          onClick={handleClick}
        >
          {block.type || 'Невідомий блок'}
        </div>
      );
      break;
  }
  
  return (
    <div style={blockStyle}>
      {blockContent}
      {connectionPoints}
    </div>
  );
};

export default Block;