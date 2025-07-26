import React, { useState } from 'react';
import { X, Plus, TrendingUp, DollarSign, Target, Wallet, CreditCard, Calendar, BarChart3, PieChart, Users, Settings } from 'lucide-react';
import { DashboardCard, CardType, CardSize } from '../../types/dashboard';

interface AddCardModalProps {
  existingCards: DashboardCard[];
  onAddCards: (cards: DashboardCard[]) => void;
  onClose: () => void;
}

interface AvailableCard {
  type: CardType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  defaultSize: CardSize;
  color: string;
}

const AddCardModal: React.FC<AddCardModalProps> = ({
  existingCards,
  onAddCards,
  onClose
}) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const availableCards: AvailableCard[] = [
    {
      type: 'monthly-income',
      title: 'Monthly Income',
      description: 'Track your household monthly income',
      icon: DollarSign,
      defaultSize: 'half',
      color: 'bg-green-100 text-green-600'
    },
    {
      type: 'monthly-spending',
      title: 'Monthly Spending',
      description: 'Monitor your monthly expenses',
      icon: TrendingUp,
      defaultSize: 'half',
      color: 'bg-red-100 text-red-600'
    },
    {
      type: 'monthly-savings',
      title: 'Monthly Savings',
      description: 'Track your savings progress',
      icon: Target,
      defaultSize: 'half',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      type: 'net-worth',
      title: 'Net Worth',
      description: 'Your total asset value',
      icon: Wallet,
      defaultSize: 'quarter',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      type: 'account-list',
      title: 'Account List',
      description: 'View all your accounts',
      icon: CreditCard,
      defaultSize: 'tall',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      type: 'budgets-tracking',
      title: 'Budget Tracking',
      description: 'Monitor your budget performance',
      icon: BarChart3,
      defaultSize: 'half',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      type: 'financial-goals',
      title: 'Financial Goals',
      description: 'Track your financial objectives',
      icon: Target,
      defaultSize: 'full',
      color: 'bg-teal-100 text-teal-600'
    },
    {
      type: 'recent-transactions',
      title: 'Recent Transactions',
      description: 'View your latest transactions',
      icon: Calendar,
      defaultSize: 'full',
      color: 'bg-gray-100 text-gray-600'
    },
    {
      type: 'expense-categories',
      title: 'Expense Categories',
      description: 'Breakdown of spending by category',
      icon: PieChart,
      defaultSize: 'half',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      type: 'top-spending-categories',
      title: 'Top Spending',
      description: 'Your biggest expenses this month',
      icon: BarChart3,
      defaultSize: 'half',
      color: 'bg-red-100 text-red-600'
    },
    {
      type: 'vesting-schedules',
      title: 'Vesting Schedules',
      description: 'Track your equity vesting',
      icon: Calendar,
      defaultSize: 'full',
      color: 'bg-emerald-100 text-emerald-600'
    }
  ];

  // Filter out cards that are already added
  const existingCardTypes = existingCards.map(card => card.type);
  const cardsToShow = availableCards.filter(card => !existingCardTypes.includes(card.type));

  const handleCardToggle = (cardType: string) => {
    setSelectedCards(prev => 
      prev.includes(cardType)
        ? prev.filter(type => type !== cardType)
        : [...prev, cardType]
    );
  };

  const handleAddSelected = () => {
    const newCards: DashboardCard[] = selectedCards.map(cardType => {
      const cardInfo = availableCards.find(card => card.type === cardType);
      return {
        id: `${cardType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: cardType as CardType,
        size: cardInfo?.defaultSize || 'half',
        title: cardInfo?.title || cardType,
        position: { x: 0, y: 0 },
        config: {
          timeRange: 'current' as const,
          chartType: 'number' as const,
          showActions: true,
          visible: true
        }
      };
    });

    onAddCards(newCards);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Dashboard Cards</h2>
            <p className="text-gray-600 mt-1">Choose cards to add to your dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {cardsToShow.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All cards added</h3>
              <p className="text-gray-600">You've already added all available dashboard cards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cardsToShow.map((card) => {
                const IconComponent = card.icon;
                const isSelected = selectedCards.includes(card.type);
                
                return (
                  <div
                    key={card.type}
                    onClick={() => handleCardToggle(card.type)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                          {card.defaultSize}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Plus className="h-4 w-4 text-white rotate-45" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cardsToShow.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedCards.length === 0}
                className={`
                  px-6 py-2 rounded-lg transition-colors
                  ${selectedCards.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Add {selectedCards.length > 0 ? selectedCards.length : ''} Card{selectedCards.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCardModal; 