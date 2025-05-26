import React from 'react';

const BlockPalette = ({ blockTypes, onSelectBlockType }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {blockTypes.map((blockType) => {
        let blockElement;
        
        switch (blockType.id) {
          case 'start':
          case 'end':
            blockElement = (
              <div className={`w-full h-10 rounded-full flex items-center justify-center ${blockType.color}`}>
                {blockType.name}
              </div>
            );
            break;
            
          case 'condition':
            blockElement = (
              <div className={`w-full aspect-square transform rotate-45 ${blockType.color} flex items-center justify-center`}>
                <span className="transform -rotate-45">{blockType.name}</span>
              </div>
            );
            break;
            
          default:
            blockElement = (
              <div className={`w-full h-10 ${blockType.color} flex items-center justify-center`}>
                {blockType.name}
              </div>
            );
        }
        
        return (
          <button
            key={blockType.id}
            className="border hover:border-blue-500 rounded cursor-grab"
            onClick={() => onSelectBlockType(blockType)}
            title={`Додати блок: ${blockType.name}`}
          >
            {blockElement}
          </button>
        );
      })}
    </div>
  );
};

export default BlockPalette;