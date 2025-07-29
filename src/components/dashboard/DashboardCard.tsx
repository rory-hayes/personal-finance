import React from 'react';
import { Settings, X, Maximize2, Minimize2 } from 'lucide-react';
import { DashboardCard as DashboardCardType, CardSize } from '../../types/dashboard';

interface DashboardCardProps {
  card: DashboardCardType;
  onResize?: (cardId: string, newSize: CardSize) => void;
  onRemove?: (cardId: string) => void;
  onConfigure?: (cardId: string) => void;
  editMode?: boolean;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  card,
  onResize,
  onRemove,
  onConfigure,
  editMode = false,
  children
}) => {
  const getSizeClasses = (size: CardSize): string => {
    switch (size) {
      case 'quarter':
        return 'col-span-1 row-span-1 min-h-[200px]';
      case 'half':
        return 'col-span-2 row-span-1 min-h-[300px]';
      case 'full':
        return 'col-span-4 row-span-1 min-h-[300px]';
      case 'tall':
        return 'col-span-4 row-span-2 min-h-[600px]';
      default:
        return 'col-span-2 row-span-1 min-h-[300px]';
    }
  };

  const getNextSize = (currentSize: CardSize): CardSize => {
    const sizes: CardSize[] = ['quarter', 'half', 'full', 'tall'];
    const currentIndex = sizes.indexOf(currentSize);
    return sizes[(currentIndex + 1) % sizes.length];
  };

  const handleResize = () => {
    if (onResize) {
      onResize(card.id, getNextSize(card.size));
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border border-gray-200 p-6
        ${getSizeClasses(card.size)}
        ${editMode ? 'ring-2 ring-blue-200 hover:ring-blue-300' : ''}
        transition-all duration-200
      `}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{card.config.title}</h3>
        
        {editMode && (
          <div className="flex items-center gap-2">
            {/* Resize Button */}
            <button
              onClick={handleResize}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Resize card"
            >
              {card.size === 'quarter' || card.size === 'half' ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>

            {/* Configure Button */}
            <button
              onClick={() => onConfigure && onConfigure(card.id)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Configure card"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Remove Button */}
            <button
              onClick={() => onRemove && onRemove(card.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="h-full">
        {children}
      </div>

      {/* Edit Mode Overlay */}
      {editMode && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-20 pointer-events-none rounded-xl" />
      )}

      {/* Size Indicator */}
      {editMode && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
          {card.size}
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardCard); 