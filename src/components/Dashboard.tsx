import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Save,
  LayoutGrid,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import DashboardCard from './dashboard/DashboardCard';
import EmergencyFundCard from './dashboard/cards/EmergencyFundCard';
import CashFlowCard from './dashboard/cards/CashFlowCard';
import { CardType, CardSize } from '../types/dashboard';

// Import existing components that we'll convert to card format
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

const Dashboard: React.FC = () => {
  const { 
    transactions, 
    users, 
    assets, 
    goals,
    accounts,
    vestingSchedules,
    totalIncome, 
    totalSpending, 
    totalAssetValue,
    totalAccountBalance,
    monthlySavings, 
    savingsRate, 
    insights,
    monthlyAllocations,
    addVestingSchedule,
    addMonthlyAllocation,
    updateAccount
  } = useFinanceData();

  // Get current user (for demo, use first user or create a default)
  const currentUser = users[0] || { id: 'anonymous-user', name: 'User' };
  
  // Dashboard configuration hook
  const {
    currentConfig,
    loading,
    editMode,
    setEditMode,
    addCard,
    removeCard,
    resizeCard,
    updateCard
  } = useDashboardConfig(currentUser.id);

  // Add card modal state
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  
  // State for existing functionality
  const [showVestingModal, setShowVestingModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedVestingYear, setSelectedVestingYear] = useState(new Date().getFullYear());
  
  // Vesting form state
  const [vestingFormData, setVestingFormData] = useState({
    monthlyAmount: '',
    startDate: '',
    endDate: '',
    description: '',
    cliffAmount: '',
    cliffPeriod: '6' // 6 or 12 months
  });

  // Note: Charts will display data as it becomes available from the database
  // Users can add transactions, goals, assets, and vesting schedules to see charts populate

  // Available card types
  const availableCardTypes: { type: CardType; title: string; description: string }[] = [
    { type: 'emergency-fund', title: 'Emergency Fund', description: 'Progress toward 3-6 months expenses' },
    { type: 'cash-flow', title: 'Cash Flow Forecast', description: 'Predicted balances over 6-12 months' },
    { type: 'metric', title: 'Metric Card', description: 'Show key financial metrics' },
    { type: 'expense-categories', title: 'Expense Categories', description: 'Spending breakdown by category' },
    { type: 'goals', title: 'Financial Goals', description: 'Track goal progress' },
    { type: 'assets', title: 'Assets Overview', description: 'View asset portfolio' },
    { type: 'vesting', title: 'Share Vesting', description: 'Track equity vesting schedules' },
    { type: 'accounts', title: 'Account Progress', description: 'Monthly account balances' },
    { type: 'health-score', title: 'Financial Health Score', description: '0-100 score with recommendations' },
    { type: 'subscriptions', title: 'Subscription Tracker', description: 'Recurring payments analysis' },
    { type: 'asset-allocation', title: 'Asset Allocation', description: 'Investment portfolio pie chart' },
    { type: 'goal-timeline', title: 'Goal Timeline', description: 'Gantt chart of financial goals' },
    { type: 'bonus-tracker', title: 'Bonus Tracker', description: 'Variable income visualization' },
    { type: 'peer-benchmarking', title: 'Peer Benchmarking', description: 'Anonymous demographic comparison' }
  ];

  const handleAddCard = async (cardType: CardType, size: CardSize = 'half') => {
    await addCard(cardType, size);
    setShowAddCardModal(false);
  };

  // Handle vesting schedule form submission
  const handleVestingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monthlyAmount = parseFloat(vestingFormData.monthlyAmount);
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      alert('Please enter a valid monthly amount');
      return;
    }
    
    if (!vestingFormData.startDate || !vestingFormData.endDate) {
      alert('Please enter both start and end dates');
      return;
    }
    
    const startDate = new Date(vestingFormData.startDate);
    const endDate = new Date(vestingFormData.endDate);
    
    if (endDate <= startDate) {
      alert('End date must be after start date');
      return;
    }

    const vestingData = {
      userId: currentUser.id,
      monthlyAmount: monthlyAmount,
      startDate: vestingFormData.startDate,
      endDate: vestingFormData.endDate,
      description: vestingFormData.description.trim() || undefined,
      cliffAmount: vestingFormData.cliffAmount ? parseFloat(vestingFormData.cliffAmount) : undefined,
      cliffPeriod: vestingFormData.cliffAmount ? parseInt(vestingFormData.cliffPeriod) : undefined
    };

    await addVestingSchedule(vestingData);
    
    // Reset form
    setVestingFormData({
      monthlyAmount: '',
      startDate: '',
      endDate: '',
      description: '',
      cliffAmount: '',
      cliffPeriod: '6'
    });
    setShowVestingModal(false);
  };

  // Render different card types
  const renderCardContent = (card: any) => {
    switch (card.type) {
      case 'emergency-fund':
        return <EmergencyFundCard card={card} />;
      case 'cash-flow':
        return <CashFlowCard card={card} />;
      case 'metric':
        return <MetricCard card={card} />;
      case 'expense-categories':
        return <ExpenseCategoriesCard card={card} />;
      case 'goals':
        return <GoalsCard card={card} />;
      case 'assets':
        return <AssetsCard card={card} />;
      case 'vesting':
        return <VestingCard 
          card={card} 
          selectedVestingYear={selectedVestingYear}
          setSelectedVestingYear={setSelectedVestingYear}
          setShowVestingModal={setShowVestingModal}
        />;
      case 'accounts':
        return <AccountsCard card={card} />;
      default:
        return <PlaceholderCard card={card} />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your household's financial health and progress</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Dashboard Name */}
          {currentConfig && (
            <span className="text-sm text-gray-500 font-medium">
              {currentConfig.name}
            </span>
          )}
          
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
                Save Layout
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {currentConfig && (
        <div className="grid grid-cols-4 gap-6 auto-rows-min">
          {currentConfig.layoutConfig.cards.map((card) => (
            <DashboardCard
              key={card.id}
              card={card}
              editMode={editMode}
              onResize={resizeCard}
              onRemove={removeCard}
              onConfigure={(cardId) => {
                // TODO: Implement card configuration modal
                console.log('Configure card:', cardId);
              }}
            >
              {renderCardContent(card)}
            </DashboardCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentConfig && currentConfig.layoutConfig.cards.length === 0 && (
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
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Card</h2>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCardTypes.map((cardType) => (
                <div
                  key={cardType.type}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleAddCard(cardType.type)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{cardType.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{cardType.description}</p>
                  <div className="flex gap-2">
                    {(['quarter', 'half', 'full'] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddCard(cardType.type, size);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Monthly Allocation</h2>
              <button
                onClick={() => setShowAllocationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Allocate your monthly income across different accounts.
              </p>
              
              <div className="text-center py-8 text-gray-500">
                <p>Monthly allocation functionality</p>
                <p className="text-xs">Will be restored with modal form</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Add allocation logic
                    setShowAllocationModal(false);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Allocate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vesting Schedule Modal */}
      {showVestingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Vesting Schedule</h2>
              <button
                onClick={() => setShowVestingModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleVestingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Amount (€) *
                </label>
                <input
                  type="number"
                  value={vestingFormData.monthlyAmount}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, monthlyAmount: e.target.value }))}
                  placeholder="1000.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={vestingFormData.startDate}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={vestingFormData.endDate}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={vestingFormData.description}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Stock options, Performance shares"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliff Lump Sum (€) - Optional
                </label>
                <input
                  type="number"
                  value={vestingFormData.cliffAmount}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, cliffAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One-time payment after cliff period
                </p>
              </div>
              
              {vestingFormData.cliffAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliff Period
                  </label>
                  <select
                    value={vestingFormData.cliffPeriod}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, cliffPeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Time before cliff payment is made
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVestingModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick placeholder components for cards we haven't built yet
const MetricCard: React.FC<{ card: any }> = ({ card }) => {
  const { totalIncome, totalSpending, monthlySavings, totalAccountBalance, savingsRate } = useFinanceData();
  
  const getMetricData = () => {
    switch (card.config.customSettings?.metric) {
      case 'income': 
        return { value: `€${totalIncome.toLocaleString()}`, label: 'Monthly Income', color: 'text-green-600' };
      case 'spending': 
        return { value: `€${totalSpending.toLocaleString()}`, label: 'Monthly Spending', color: 'text-red-600' };
      case 'savings': 
        return { value: `€${monthlySavings.toLocaleString()}`, label: 'Monthly Savings', color: 'text-blue-600' };
      case 'networth': 
        return { value: `€${totalAccountBalance.toLocaleString()}`, label: 'Net Worth', color: 'text-purple-600' };
      default: 
        return { value: '€0', label: 'Metric', color: 'text-gray-600' };
    }
  };

  const metricData = getMetricData();

  return (
    <div className="text-center h-full flex flex-col justify-center">
      <p className={`text-3xl font-bold mb-2 ${metricData.color}`}>{metricData.value}</p>
      <p className="text-sm text-gray-600">{metricData.label}</p>
      {card.config.customSettings?.metric === 'savings' && (
        <p className="text-xs text-gray-500 mt-1">{savingsRate.toFixed(1)}% savings rate</p>
      )}
    </div>
  );
};

const ExpenseCategoriesCard: React.FC<{ card: any }> = ({ card }) => {
  const { transactions } = useFinanceData();
  
  const expenseData = useMemo(() => {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'];
    const colors = ['#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B', '#EF4444', '#6B7280'];
    
    return categories.map((category, index) => {
      const amount = transactions
        .filter(t => t.category === category && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        category,
        amount,
        color: colors[index]
      };
    }).filter(item => item.amount > 0);
  }, [transactions]);

  return (
    <div className="h-full">
      {expenseData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={expenseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip 
              formatter={(value) => [`€${value}`, 'Amount']}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="amount" radius={4}>
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No expense data</p>
            <p className="text-sm">Add transactions to see categories</p>
          </div>
        </div>
      )}
    </div>
  );
};

const GoalsCard: React.FC<{ card: any }> = ({ card }) => {
  const { goals } = useFinanceData();

  return (
    <div className="h-full">
      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.slice(0, 3).map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isComplete = progress >= 100;
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{goal.name}</h4>
                  <span className="text-sm text-gray-600">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isComplete ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>€{goal.currentAmount.toLocaleString()}</span>
                  <span>€{goal.targetAmount.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
          {goals.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{goals.length - 3} more goals
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No goals set yet</p>
            <button 
              onClick={() => {
                // Navigate to Goals tab
                window.dispatchEvent(new CustomEvent('switchToGoals'));
              }}
              className="text-blue-600 text-sm hover:text-blue-700"
            >
              Set Your First Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetsCard: React.FC<{ card: any }> = ({ card }) => {
  const { assets, totalAssetValue } = useFinanceData();

  return (
    <div className="h-full">
      {assets.length > 0 ? (
        <div>
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-gray-900">€{totalAssetValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Assets</p>
          </div>
          <div className="space-y-3">
            {assets.slice(0, 4).map((asset, index) => (
              <div key={asset.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">{asset.name}</span>
                </div>
                <span className="text-sm text-gray-900">€{asset.value.toLocaleString()}</span>
              </div>
            ))}
            {assets.length > 4 && (
              <p className="text-xs text-gray-500 text-center">
                +{assets.length - 4} more assets
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No assets tracked yet</p>
            <button 
              onClick={() => {
                // Navigate to Assets tab
                window.dispatchEvent(new CustomEvent('switchToAssets'));
              }}
              className="text-blue-600 text-sm hover:text-blue-700"
            >
              Add Your First Asset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VestingCard: React.FC<{ 
  card: any; 
  selectedVestingYear: number;
  setSelectedVestingYear: (year: number) => void;
  setShowVestingModal: (show: boolean) => void;
}> = ({ card, selectedVestingYear, setSelectedVestingYear, setShowVestingModal }) => {
  const { vestingSchedules, totalAccountBalance } = useFinanceData();

  const vestingData = useMemo(() => {
    const currentDate = new Date();
    const startDate = new Date(selectedVestingYear, 0, 1);
    const months = [];
    let cumulativeVested = 0;
    let cumulativeNetWorth = totalAccountBalance; // Start with current net worth
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate.getFullYear(), i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate monthly vesting for this month
      const monthlyVesting = vestingSchedules.reduce((total, schedule) => {
        const scheduleStart = new Date(schedule.startDate);
        const scheduleEnd = new Date(schedule.endDate);
        
        if (date >= scheduleStart && date <= scheduleEnd) {
          return total + schedule.monthlyAmount;
        }
        return total;
      }, 0);
      
      // Add to cumulative totals
      cumulativeVested += monthlyVesting;
      cumulativeNetWorth += monthlyVesting;
      
      months.push({
        month: monthName,
        monthlyVesting: monthlyVesting,
        cumulativeVested: cumulativeVested,
        projectedNetWorth: cumulativeNetWorth
      });
    }
    
    return months;
  }, [vestingSchedules, totalAccountBalance, selectedVestingYear]);

  return (
    <div className="h-full">
      {vestingSchedules.length > 0 ? (
                <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">Net worth growth with vesting schedules</p>
              <select
                value={selectedVestingYear}
                onChange={(e) => setSelectedVestingYear(parseInt(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + i - 2; // Show 2 years back, current, 2 years forward
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              onClick={() => setShowVestingModal(true)}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Add Schedule
            </button>
          </div>
          <ResponsiveContainer width="100%" height="60%">
            <LineChart data={vestingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `€${value.toLocaleString()}`, 
                  name === 'projectedNetWorth' ? 'Net Worth' : 
                  name === 'cumulativeVested' ? 'Total Vested' : 'Monthly Vesting'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="projectedNetWorth" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Net Worth Growth"
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeVested" 
                stroke="#3B82F6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Cumulative Vesting"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No vesting schedules tracked yet</p>
                         <button 
               onClick={() => setShowVestingModal(true)}
               className="text-blue-600 text-sm hover:text-blue-700"
             >
               Add Vesting Schedule
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AccountsCard: React.FC<{ card: any }> = ({ card }) => {
  const { accounts, monthlyData } = useFinanceData();

  const accountData = useMemo(() => {
    if (monthlyData.length > 0) {
      // Use real historical data from database
      return monthlyData.slice(-6).map(data => {
        const date = new Date(data.month);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        // Create account breakdown based on proportions
        const monthData: any = { month: monthName };
        const totalBalance = data.net_worth || 0;
        
        accounts.forEach((account, index) => {
          // Distribute the historical net worth proportionally
          const proportion = account.balance / (accounts.reduce((sum, acc) => sum + acc.balance, 0) || 1);
          monthData[account.name] = totalBalance * proportion;
        });
        
        return monthData;
      });
    } else {
      // Fallback: Generate some sample historical data
      const months = [];
      const currentDate = new Date();
      
      for (let i = -5; i <= 0; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthData: any = { month: monthName };
        accounts.forEach(account => {
          // Create more realistic historical progression
          const growthFactor = 1 + (i * 0.02); // 2% growth per month
          monthData[account.name] = Math.max(0, account.balance * growthFactor);
        });
        
        months.push(monthData);
      }
      
      return months;
    }
  }, [accounts, monthlyData]);

  return (
    <div className="h-full">
      {accounts.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={accountData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value, name) => [`€${value.toLocaleString()}`, name]}
              labelStyle={{ color: '#374151' }}
            />
            {accounts.map((account, index) => (
              <Line
                key={account.id}
                type="monotone"
                dataKey={account.name}
                stroke={account.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No accounts tracked yet</p>
            <p className="text-sm">Add accounts to see progress</p>
          </div>
        </div>
      )}
    </div>
  );
};

const PlaceholderCard: React.FC<{ card: any }> = ({ card }) => (
  <div className="text-center text-gray-500">
    <p>{card.config.title}</p>
    <p className="text-xs">Coming soon...</p>
  </div>
);

export default Dashboard;