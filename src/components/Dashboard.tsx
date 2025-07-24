import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  LayoutGrid,
  X,
  Grid,
  Filter,
  Download
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useAuth } from '../contexts/AuthContext';
import { 
  CardType, 
  CardSize, 
  DashboardCard, 
  CARD_DEFINITIONS,
  getCardDefinition 
} from '../types/dashboard';

// Import card wrapper component
import DashboardCardWrapper from './dashboard/DashboardCardWrapper';
import VestingScheduleModal from './dashboard/cards/VestingScheduleModal';

const Dashboard: React.FC = () => {
  // Get financial data and auth
  const financeData = useFinanceData();
  const { user } = useAuth();
  
  // Generate a consistent user ID for dashboard configuration
  const dashboardUserId = useMemo(() => {
    // Use authenticated user ID if available
    if (user?.id) {
      return user.id;
    }
    
    // For anonymous users, create/retrieve a consistent ID from localStorage
    const anonymousId = localStorage.getItem('anonymous_dashboard_user_id');
    if (anonymousId) {
      return anonymousId;
    }
    
    // Create new anonymous ID
    const newAnonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_dashboard_user_id', newAnonymousId);
    return newAnonymousId;
  }, [user?.id]);

  // Use dashboard config hook for database persistence
  const {
    currentConfig,
    loading: configLoading,
    addCard: addCardToConfig,
    removeCard: removeCardFromConfig,
    updateCard: updateCardInConfig,
    resizeCard: resizeCardInConfig,
    addMultipleCards: addMultipleCardsToConfig
  } = useDashboardConfig(dashboardUserId);
  
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'current' | '3months' | '6months' | '12months'>('current');
  
  // Multi-select state for Add Card modal
  const [selectedCards, setSelectedCards] = useState<Set<CardType>>(new Set());
  
  // Modals for dashboard actions
  const [showVestingModal, setShowVestingModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});

  // Handle Esc key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAddCardModal) {
          setShowAddCardModal(false);
          setSelectedCards(new Set());
        }
        if (showAllocationModal) {
          setShowAllocationModal(false);
          setAllocationAmounts({});
        }
      }
    };

    if (showAddCardModal || showAllocationModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showAddCardModal, showAllocationModal]);

  // Get current user
  const currentUser = financeData.users[0] || { id: 'anonymous-user', name: 'User' };

  // Filter cards by category for add modal
  const cardsByCategory = useMemo(() => {
    const categories = ['essential', 'spending', 'planning', 'assets', 'advanced'] as const;
    return categories.reduce((acc, category) => {
      acc[category] = CARD_DEFINITIONS.filter(def => def.category === category);
      return acc;
    }, {} as Record<string, typeof CARD_DEFINITIONS>);
  }, []);

  // Toggle card selection in Add Card modal
  const toggleCardSelection = (cardType: CardType) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardType)) {
      newSelection.delete(cardType);
    } else {
      newSelection.add(cardType);
    }
    setSelectedCards(newSelection);
  };

  // Add selected cards to dashboard
  const addSelectedCards = async () => {
    if (selectedCards.size === 0) {
      alert('Please select at least one card to add');
      return;
    }

    try {
      console.log('🔄 Adding selected cards to dashboard:', Array.from(selectedCards));
      console.log('📊 Current config before adding:', currentConfig);
      console.log('👤 Dashboard User ID:', dashboardUserId);
      
      // Prepare cards for batch addition
      const cardsToAdd = Array.from(selectedCards).map(cardType => {
        const definition = getCardDefinition(cardType);
        if (!definition) {
          console.warn(`⚠️ No definition found for card type: ${cardType}`);
          return null;
        }
        return {
          type: cardType,
          size: definition.defaultSize
        };
      }).filter(card => card !== null) as Array<{ type: string; size: CardSize }>;

      if (cardsToAdd.length === 0) {
        throw new Error('No valid cards selected');
      }

      console.log(`➕ Adding ${cardsToAdd.length} cards in batch:`, cardsToAdd);
      
      // Add all cards at once using the new batch function
      await addMultipleCardsToConfig(cardsToAdd);

      // Clear selection and close modal
      setSelectedCards(new Set());
      setShowAddCardModal(false);
      
      console.log(`🎉 Successfully added ${cardsToAdd.length} card(s) to dashboard`);
      
      // Show success message to user
      if (cardsToAdd.length === 1) {
        console.log(`✨ Added "${cardsToAdd[0].type}" card to your dashboard!`);
      } else {
        console.log(`✨ Added ${cardsToAdd.length} cards to your dashboard!`);
      }

    } catch (error) {
      console.error('💥 Error adding cards to dashboard:', error);
      alert('Failed to add cards to the dashboard. Please try again.');
      // Don't close modal on error so user can retry
    }
  };

  // Check if card is already in dashboard
  const isCardInDashboard = (cardType: CardType): boolean => {
    return currentCards.some(card => card.type === cardType);
  };

  // Legacy single-card add function (kept for compatibility)
  const addCard = async (cardType: CardType, size?: CardSize) => {
    const definition = getCardDefinition(cardType);
    if (!definition) return;

    await addCardToConfig(cardType, size || definition.defaultSize);
    setShowAddCardModal(false);
  };

  // Remove card from dashboard
  const removeCard = async (cardId: string) => {
    await removeCardFromConfig(cardId);
  };

  // Update card (resize, configure, etc.)
  const updateCard = async (cardId: string, updates: Partial<DashboardCard>) => {
    await updateCardInConfig(cardId, updates);
  };

  // Resize card
  const resizeCard = async (cardId: string, newSize: CardSize) => {
    await resizeCardInConfig(cardId, newSize);
  };

  // Handle monthly allocation
  const handleMonthlyAllocation = async () => {
    try {
      const hasAllocations = Object.values(allocationAmounts).some(amount => parseFloat(amount) > 0);
      
      if (!hasAllocations) {
        alert('Please enter at least one allocation amount');
        return;
      }

      // Process allocations
      for (const [accountId, amount] of Object.entries(allocationAmounts)) {
        const numAmount = parseFloat(amount);
        if (numAmount > 0) {
          await financeData.allocateToAccount(accountId, numAmount, 'Monthly income allocation');
        }
      }

      // Add to monthly allocations record
      const allocationRecord = {
        id: `allocation-${Date.now()}`,
        userId: currentUser.id,
        month: new Date().toISOString().split('T')[0].substring(0, 7),
        totalAmount: Object.values(allocationAmounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0),
        allocations: Object.entries(allocationAmounts)
          .filter(([, amount]) => parseFloat(amount) > 0)
          .map(([accountId, amount]) => ({
            accountId,
            amount: parseFloat(amount),
            accountName: financeData.accounts.find(a => a.id === accountId)?.name || 'Unknown'
          })),
        createdAt: new Date().toISOString()
      };

      await financeData.addMonthlyAllocation(allocationRecord);
      
      setShowAllocationModal(false);
      setAllocationAmounts({});
      alert('Monthly allocation completed successfully!');
    } catch (error) {
      console.error('Error processing allocation:', error);
      alert('Error processing allocation. Please try again.');
    }
  };

  // Show loading state
  if (configLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentCards = currentConfig?.layoutConfig.cards || [];

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Complete overview of your financial health • {currentConfig?.name || 'Loading...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>

          {/* Monthly Allocation Button */}
          <button
            onClick={() => setShowAllocationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Monthly Allocation
          </button>
          
          {/* Add Card Button */}
          <button
            onClick={() => setShowAddCardModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6 auto-rows-max">
        {currentCards
          .filter(card => card.config?.visible !== false)
          .map((card) => (
            <DashboardCardWrapper
              key={card.id}
              card={card}
              isEditMode={false}
              onResize={resizeCard}
              onRemove={removeCard}
              onConfigure={updateCard}
              financeData={financeData}
              onShowVestingModal={() => setShowVestingModal(true)}
            />
          ))}
      </div>

      {/* Empty State */}
      {currentCards.filter(card => card.config?.visible !== false).length === 0 && (
        <div className="text-center py-16">
          <LayoutGrid className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your dashboard is empty</h3>
          <p className="text-gray-600 mb-6">Add your first card to get started with tracking your finances.</p>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Your First Card
          </button>
        </div>
      )}

      {/* Add Card Modal - Enhanced with Multi-Select */}
      {showAddCardModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-card-modal-title"
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto" role="document">
                          <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="add-card-modal-title" className="text-2xl font-bold text-gray-900">Add Dashboard Cards</h2>
                <p className="text-gray-600 mt-1">
                  Click cards to select them, then click "Add Selected Cards" to add them to your dashboard
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Add Selected Cards Button */}
                {selectedCards.size > 0 && (
                  <button
                    onClick={addSelectedCards}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Selected Cards ({selectedCards.size})
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAddCardModal(false);
                    setSelectedCards(new Set());
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Selected Cards Count */}
            {selectedCards.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>{selectedCards.size}</strong> card{selectedCards.size !== 1 ? 's' : ''} selected
                  <button
                    onClick={() => setSelectedCards(new Set())}
                    className="ml-3 text-blue-600 hover:text-blue-700 underline text-sm"
                  >
                    Clear Selection
                  </button>
                </p>
              </div>
            )}
            
            {Object.entries(cardsByCategory).map(([category, cards]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} Cards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map((cardDef) => {
                    const isSelected = selectedCards.has(cardDef.type);
                    const isAlreadyInDashboard = isCardInDashboard(cardDef.type);
                    
                    return (
                      <div
                        key={cardDef.type}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                          isAlreadyInDashboard 
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => {
                          if (!isAlreadyInDashboard) {
                            toggleCardSelection(cardDef.type);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{cardDef.title}</h4>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <X className="h-3 w-3 text-white rotate-45" />
                            </div>
                          )}
                          {isAlreadyInDashboard && (
                            <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              Added
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{cardDef.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {cardDef.chartTypes.slice(0, 3).map(chartType => (
                              <span key={chartType} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                {chartType}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-blue-600 font-medium">
                            {cardDef.defaultSize}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Allocation Modal */}
      {showAllocationModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="allocation-modal-title"
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" role="document">
            <div className="flex items-center justify-between mb-6">
              <h2 id="allocation-modal-title" className="text-xl font-bold text-gray-900">Monthly Allocation</h2>
              <button
                onClick={() => {
                  setShowAllocationModal(false);
                  setAllocationAmounts({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Income Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Monthly Income</p>
                    <p className="text-2xl font-bold text-blue-900">€{financeData.totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">Allocated</p>
                    <p className="text-lg font-semibold text-blue-900">
                      €{Object.values(allocationAmounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Allocation Form */}
              {financeData.accounts.length > 0 ? (
                <div className="space-y-4">
                  {financeData.accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: account.color }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{account.name}</p>
                            <p className="text-sm text-gray-500">
                              Current: €{account.balance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 min-w-fit">Allocate:</label>
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                          <input
                            type="number"
                            value={allocationAmounts[account.id] || ''}
                            onChange={(e) => setAllocationAmounts(prev => ({
                              ...prev,
                              [account.id]: e.target.value
                            }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No accounts found</p>
                  <p className="text-sm">Create accounts in the Household tab first</p>
                </div>
              )}
              
              {/* Action Buttons */}
              {financeData.accounts.length > 0 && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAllocationModal(false);
                      setAllocationAmounts({});
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMonthlyAllocation}
                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    disabled={!Object.values(allocationAmounts).some(amount => parseFloat(amount) > 0)}
                  >
                    Allocate Funds
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vesting Schedule Modal */}
      <VestingScheduleModal 
        isOpen={showVestingModal}
        onClose={() => setShowVestingModal(false)}
        onSubmit={financeData.addVestingSchedule}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Dashboard;