import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, X, Calendar, Trash2 } from 'lucide-react';

interface DashboardCardWrapperProps {
  card: any;
  financeData: any;
  isEditMode: boolean;
  onRemove: (cardId: string) => void;
  onResize: (cardId: string, newSize: string) => void;
  onConfigure: (cardId: string, config: any) => void;
  onShowVestingModal?: () => void;
  onShowMonthlyAllocationModal?: () => void;
}

const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
  card,
  financeData,
  isEditMode,
  onRemove,
  onResize,
  onConfigure,
  onShowVestingModal,
  onShowMonthlyAllocationModal
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardDefinition = {
    title: card.type.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  };
  
  // Get current time range
  const currentTimeRange = card.config?.timeRange || '6months';
  
  // Available time ranges for cards that support them
  const timeRangeOptions = [
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '12months', label: '12 Months' },
    { value: '24months', label: '24 Months' }
  ];

  // Cards that support time range configuration
  const supportsTimeRange = [
    'net-worth-growth',
    'cash-flow-forecast',
    'account-progress',
    'goal-timeline'
  ].includes(card.type);

  const handleTimeRangeChange = (newTimeRange: string) => {
    onConfigure(card.id, {
      ...card.config,
      timeRange: newTimeRange
    });
    setShowMenu(false);
  };

  const handleRemoveCard = () => {
    if (window.confirm(`Are you sure you want to remove the ${cardDefinition?.title || 'this'} card?`)) {
      onRemove(card.id);
    }
    setShowMenu(false);
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'quarter': return 'col-span-3 row-span-1';
      case 'half': return 'col-span-6 row-span-1';
      case 'full': return 'col-span-12 row-span-1';
      case 'tall': return 'col-span-6 row-span-2';
      default: return 'col-span-6 row-span-1';
    }
  };

  const renderCardContent = () => {
    // Import and render the appropriate card component based on card.type
    switch (card.type) {
      case 'monthly-income':
        const MonthlyIncomeCard = require('./cards/MonthlyIncomeCard').default;
        return <MonthlyIncomeCard card={card} financeData={financeData} />;
      
      case 'monthly-spending':
        const MonthlySpendingCard = require('./cards/MonthlySpendingCard').default;
        return <MonthlySpendingCard card={card} financeData={financeData} />;
      
      case 'monthly-savings':
        const MonthlySavingsCard = require('./cards/MonthlySavingsCard').default;
        return <MonthlySavingsCard card={card} financeData={financeData} />;
      
      case 'net-worth':
        const NetWorthCard = require('./cards/NetWorthCard').default;
        return <NetWorthCard card={card} financeData={financeData} />;
      
      case 'net-worth-growth':
        const NetWorthGrowthCard = require('./cards/NetWorthGrowthCard').default;
        return <NetWorthGrowthCard card={card} financeData={financeData} />;
      
      case 'cash-flow-forecast':
        const CashFlowForecastCard = require('./cards/CashFlowForecastCard').default;
        return <CashFlowForecastCard card={card} financeData={financeData} />;
      
      case 'expense-categories':
        const ExpenseCategoriesCard = require('./cards/ExpenseCategoriesCard').default;
        return <ExpenseCategoriesCard card={card} financeData={financeData} />;
      
      case 'top-spending':
        const TopSpendingCard = require('./cards/TopSpendingCard').default;
        return <TopSpendingCard card={card} financeData={financeData} />;
      
      case 'budget-tracking':
        const BudgetTrackingCard = require('./cards/BudgetTrackingCard').default;
        return <BudgetTrackingCard card={card} financeData={financeData} />;
      
      case 'financial-goals':
        const FinancialGoalsCard = require('./cards/FinancialGoalsCard').default;
        return <FinancialGoalsCard card={card} financeData={financeData} />;

      case 'financial-health-score':
        const FinancialHealthCard = require('./cards/FinancialHealthCard').default;
        return <FinancialHealthCard card={card} financeData={financeData} />;
      
      case 'account-progress':
        const AccountProgressCard = require('./cards/AccountProgressCard').default;
        return <AccountProgressCard card={card} financeData={financeData} />;
        
      case 'assets-overview':
        const AssetsOverviewCard = require('./cards/AssetsOverviewCard').default;
        return <AssetsOverviewCard card={card} financeData={financeData} />;
      
      case 'asset-allocation':
        const AssetAllocationCard = require('./cards/AssetAllocationCard').default;
        return <AssetAllocationCard card={card} financeData={financeData} />;
      
             case 'vesting-schedules':
         const VestingSchedulesCard = require('./cards/VestingSchedulesCard').default;
         return <VestingSchedulesCard 
           card={card} 
           financeData={financeData} 
           onShowVestingModal={onShowVestingModal}
         />;

       case 'recent-transactions':
         const RecentTransactionsCard = require('./cards/RecentTransactionsCard').default;
         return <RecentTransactionsCard card={card} financeData={financeData} />;

       // Add more card cases as needed...
      default:
        const PlaceholderCard = require('./cards/PlaceholderCard').default;
        return <PlaceholderCard card={card} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm relative ${getSizeClass(card.size)}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          {cardDefinition?.title || card.type}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Time Range Indicator */}
          {supportsTimeRange && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {timeRangeOptions.find(opt => opt.value === currentTimeRange)?.label || '6 Months'}
            </span>
          )}

          {/* Card Menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Card options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                <div className="py-1">
                  {/* Time Range Options */}
                  {supportsTimeRange && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Time Range
                      </div>
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTimeRangeChange(option.value)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            currentTimeRange === option.value ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          {option.label}
                          {currentTimeRange === option.value && (
                            <span className="ml-auto text-blue-600">✓</span>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )}

                  {/* Remove Card */}
                  <button
                    onClick={handleRemoveCard}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="flex gap-2">
            <button
              onClick={() => onResize(card.id, 'quarter')}
              className={`px-3 py-1 text-sm rounded ${
                card.size === 'quarter' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => onResize(card.id, 'half')}
              className={`px-3 py-1 text-sm rounded ${
                card.size === 'half' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              Half
            </button>
            <button
              onClick={() => onResize(card.id, 'full')}
              className={`px-3 py-1 text-sm rounded ${
                card.size === 'full' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              Full
            </button>
            <button
              onClick={() => onRemove(card.id)}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-4 h-full">
        {renderCardContent()}
      </div>
    </div>
  );
};

export default DashboardCardWrapper; 