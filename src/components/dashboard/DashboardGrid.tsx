import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, X, GripVertical } from 'lucide-react';
import { DashboardCard, CardSize } from '../../types/dashboard';
import DashboardCardWrapper from './DashboardCardWrapper';
import AddCardModal from './AddCardModal';

interface DashboardGridProps {
  cards: DashboardCard[];
  onCardsChange: (cards: DashboardCard[]) => void;
  financeData: any;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ 
  cards, 
  onCardsChange, 
  financeData 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newCards = Array.from(cards);
    const [reorderedCard] = newCards.splice(result.source.index, 1);
    newCards.splice(result.destination.index, 0, reorderedCard);

    onCardsChange(newCards);
  };

  const handleRemoveCard = (cardId: string) => {
    onCardsChange(cards.filter(card => card.id !== cardId));
  };

  const handleAddCards = (selectedCards: DashboardCard[]) => {
    const newCards = [...cards, ...selectedCards];
    onCardsChange(newCards);
    setShowAddModal(false);
  };

  const getGridClass = (size: CardSize) => {
    if (isMobile) {
      // On mobile, most cards take full width for better readability
      switch (size) {
        case 'quarter':
        case 'half':
        case 'full':
        case 'tall':
          return 'col-span-1';
        default:
          return 'col-span-1';
      }
    }

    // Desktop grid classes
    switch (size) {
      case 'quarter':
        return 'col-span-1 row-span-1';
      case 'half':
        return 'col-span-2 row-span-1';
      case 'full':
        return 'col-span-4 row-span-1';
      case 'tall':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-2 row-span-1';
    }
  };

  const CardComponent = ({ card, index }: { card: DashboardCard; index: number }) => (
    <div className={`
      relative group bg-white rounded-xl border border-gray-200 overflow-hidden
      ${isMobile ? 'mobile-shadow' : 'shadow-sm hover:shadow-md'}
      transition-all duration-200
      ${getGridClass(card.size)}
    `}>
      {/* Mobile: Remove button always visible, Desktop: Show on hover */}
      <button
        onClick={() => handleRemoveCard(card.id)}
        className={`
          absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-sm
          border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50
          transition-all duration-200 touch-target
          ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        aria-label="Remove card"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Desktop: Drag handle */}
      {!isMobile && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="p-1.5 text-gray-400 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="h-full">
        <DashboardCardWrapper 
          card={card} 
          financeData={financeData} 
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 lg:mb-6 px-4 lg:px-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600 mt-1">
            Your financial overview at a glance
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="
            flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 
            bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            transition-colors duration-200 touch-target text-sm lg:text-base
          "
        >
          <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
          <span className="hidden sm:inline">Add Card</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 px-4 lg:px-6 pb-4 lg:pb-6">
        {cards.length === 0 ? (
          // Empty State - Mobile Optimized
          <div className="flex flex-col items-center justify-center h-64 lg:h-96 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">
              Welcome to your Dashboard
            </h3>
            <p className="text-sm lg:text-base text-gray-600 mb-6 max-w-md">
              Start building your financial overview by adding cards that matter to you.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="
                flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 
                bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                transition-colors duration-200 touch-target
              "
            >
              <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
              Add Your First Card
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-grid">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    grid gap-2 lg:gap-3 h-full
                    ${isMobile 
                      ? 'grid-cols-1' 
                      : 'grid-cols-4 auto-rows-max'
                    }
                  `}
                  style={{
                    gridTemplateRows: isMobile ? 'repeat(auto-fit, minmax(280px, auto))' : 'repeat(auto-fit, minmax(320px, auto))'
                  }}
                >
                  {cards.map((card, index) => (
                    <Draggable
                      key={card.id}
                      draggableId={card.id}
                      index={index}
                      isDragDisabled={isMobile} // Disable drag on mobile
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...(isMobile ? {} : provided.dragHandleProps)}
                          className={`
                            ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}
                            transition-transform duration-200
                          `}
                        >
                          <CardComponent card={card} index={index} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddModal && (
        <AddCardModal
          existingCards={cards}
          onAddCards={handleAddCards}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default DashboardGrid; 