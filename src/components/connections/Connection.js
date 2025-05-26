import React from 'react';

const Connection = ({ id, startX, startY, endX, endY, type, isSelected, onSelect }) => {
  let strokeColor;
  switch (type) {
    case 'true':
      strokeColor = isSelected ? 'stroke-green-700' : 'stroke-green-500';
      break;
    case 'false':
      strokeColor = isSelected ? 'stroke-red-700' : 'stroke-red-500';
      break;
    case 'temp':
      strokeColor = 'stroke-blue-300 stroke-dashed';
      break;
    default:
      strokeColor = isSelected ? 'stroke-blue-700' : 'stroke-blue-500';
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect && id) {
      onSelect(id);
    }
  };

  // Створення кривої Безьє для з'єднання
  const dx = endX - startX;
  const dy = endY - startY;
  
  // Створення контрольних точок для кривої Безьє
  let pathData;
  
  if (Math.abs(dx) > Math.abs(dy) * 2) {
    // Якщо блоки далеко по горизонталі, створюємо S-подібну криву
    pathData = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
  } else if (dy < 0) {
    // Якщо кінцевий блок вище, створюємо криву, що повертає вверх
    pathData = `M ${startX} ${startY} C ${startX} ${startY - 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
  } else {
    // Стандартна крива вниз
    pathData = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
  }

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id={`arrowhead-${id || startX}-${startY}-${endX}-${endY}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon 
            points="0 0, 10 3.5, 0 7" 
            className={strokeColor} 
          />
        </marker>
      </defs>
      <path
        d={pathData}
        fill="none"
        className={`${strokeColor} ${isSelected ? 'stroke-3' : 'stroke-2'} cursor-pointer`}
        markerEnd={`url(#arrowhead-${id || startX}-${startY}-${endX}-${endY})`}
        style={{ pointerEvents: type !== 'temp' ? 'auto' : 'none' }}
        onClick={handleClick}
        strokeWidth={isSelected ? 3 : 2}
      />
    </svg>
  );
};

export default Connection;