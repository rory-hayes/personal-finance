import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Save,
  LayoutGrid,
  X,
  Grid,
  Filter,
  Download
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { 
  CardType, 
  CardSize, 
  DashboardCard, 
  DashboardLayout, 
  DEFAULT_LAYOUTS, 
  CARD_DEFINITIONS,
  getCardDefinition 
} from '../types/dashboard';

// Import all card components
import DashboardCardWrapper from './dashboard/DashboardCardWrapper';
import * as Cards from './dashboard/cards';

const Dashboard: React.FC = () => {
  // Get financial data
  const financeData = useFinanceData();
  
  // Dashboard state
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(DEFAULT_LAYOUTS[0]);
  const [editMode, setEditMode] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'current' | '3months' | '6months' | '12months'>('current');
  
  // Modals for dashboard actions
  const [showVestingModal, setShowVestingModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, string>>({});

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

  // Add card to dashboard
  const addCard = (cardType: CardType, size?: CardSize) => {
    const definition = getCardDefinition(cardType);
    if (!definition) return;

    const newCard: DashboardCard = {
      id: `card-${Date.now()}-${cardType}`,
      type: cardType,
      title: definition.title,
      size: size || definition.defaultSize,
      visible: true,
      position: { x: 0, y: currentLayout.cards.length }, // Auto-position
      config: {
        timeRange: selectedTimeRange,
        chartType: definition.chartTypes[0],
        showActions: true
      }
    };

    setCurrentLayout(prev => ({
      ...prev,
      cards: [...prev.cards, newCard]
    }));
    setShowAddCardModal(false);
  };

  // Remove card from dashboard
  const removeCard = (cardId: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      cards: prev.cards.filter(card => card.id !== cardId)
    }));
  };

  // Update card (resize, configure, etc.)
  const updateCard = (cardId: string, updates: Partial<DashboardCard>) => {
    setCurrentLayout(prev => ({
      ...prev,
      cards: prev.cards.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    }));
  };

  // Resize card
  const resizeCard = (cardId: string, newSize: CardSize) => {
    updateCard(cardId, { size: newSize });
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

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Complete overview of your financial health • {currentLayout.name}
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
          
          {/* Edit Mode Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              editMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {editMode ? (
              <>
                <Save className="h-4 w-4" />
                Done Editing
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Layout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-4 gap-6 auto-rows-min">
        {currentLayout.cards
          .filter(card => card.visible)
          .map((card) => (
            <DashboardCardWrapper
              key={card.id}
              card={card}
              editMode={editMode}
              onResize={resizeCard}
              onRemove={removeCard}
              onUpdate={updateCard}
              financeData={financeData}
              onShowVestingModal={() => setShowVestingModal(true)}
            />
          ))}
      </div>

      {/* Empty State */}
      {currentLayout.cards.filter(card => card.visible).length === 0 && (
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

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Dashboard Card</h2>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {Object.entries(cardsByCategory).map(([category, cards]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} Cards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map((cardDef) => (
                    <div
                      key={cardDef.type}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => addCard(cardDef.type)}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{cardDef.title}</h4>
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Monthly Allocation</h2>
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
      <Cards.VestingScheduleModal 
        isOpen={showVestingModal}
        onClose={() => setShowVestingModal(false)}
        onSubmit={financeData.addVestingSchedule}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Dashboard;