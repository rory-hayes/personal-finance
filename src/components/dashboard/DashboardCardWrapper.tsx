import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, X, Calendar, Trash2, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

// Import all card components
import MonthlyIncomeCard from './cards/MonthlyIncomeCard';
import MonthlySpendingCard from './cards/MonthlySpendingCard';
import MonthlySavingsCard from './cards/MonthlySavingsCard';
import NetWorthCard from './cards/NetWorthCard';
import NetWorthGrowthCard from './cards/NetWorthGrowthCard';
import CashFlowForecastCard from './cards/CashFlowForecastCard';
import ExpenseCategoriesCard from './cards/ExpenseCategoriesCard';
import TopSpendingCard from './cards/TopSpendingCard';
import BudgetTrackingCard from './cards/BudgetTrackingCard';
import FinancialGoalsCard from './cards/FinancialGoalsCard';
import FinancialHealthCard from './cards/FinancialHealthCard';
import AccountProgressCard from './cards/AccountProgressCard';
import AccountListCard from './cards/AccountListCard';
import AssetsOverviewCard from './cards/AssetsOverviewCard';
import AssetAllocationCard from './cards/AssetAllocationCard';
import VestingSchedulesCard from './cards/VestingSchedulesCard';
import RecentTransactionsCard from './cards/RecentTransactionsCard';
import GoalTimelineCard from './cards/GoalTimelineCard';
import SubscriptionTrackerCard from './cards/SubscriptionTrackerCard';

import PeerBenchmarkingCard from './cards/PeerBenchmarkingCard';
import HouseholdContributionsCard from './cards/HouseholdContributionsCard';
import CashFlowInsightsCard from './cards/CashFlowInsightsCard';
import AlertsRecommendationsCard from './cards/AlertsRecommendationsCard';
import DashboardCustomizationCard from './cards/DashboardCustomizationCard';
import EmergencyFundCard from './cards/EmergencyFundCard';
import NetWorthProjectionCard from './cards/NetWorthProjectionCard';
import PlaceholderCard from './cards/PlaceholderCard';

interface DashboardCardWrapperProps {
  card: any;
  financeData: any;
  isEditMode: boolean;
  onRemove: (cardId: string) => void;
  onResize: (cardId: string, newSize: 'quarter' | 'half' | 'tall' | 'full') => void;
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

  // Available card sizes
  const sizeOptions = [
    { value: 'quarter', label: 'Quarter (3 cols)', icon: <Minimize2 className="h-3 w-3" /> },
    { value: 'half', label: 'Half (6 cols)', icon: <RotateCcw className="h-3 w-3" /> },
    { value: 'full', label: 'Full (12 cols)', icon: <Maximize2 className="h-3 w-3" /> },
    { value: 'tall', label: 'Tall (6 cols, 2 rows)', icon: <Maximize2 className="h-3 w-3" /> }
  ];

  const handleTimeRangeChange = (newTimeRange: string) => {
    onConfigure(card.id, {
      config: {
        ...card.config,
        timeRange: newTimeRange
      }
    });
    setShowMenu(false);
  };

  const handleSizeChange = (newSize: 'quarter' | 'half' | 'tall' | 'full') => {
    onResize(card.id, newSize);
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
      case 'quarter': return 'col-span-1 lg:col-span-3 row-span-1';
      case 'half': return 'col-span-1 lg:col-span-6 row-span-1';
      case 'full': return 'col-span-1 lg:col-span-12 row-span-1';
      case 'tall': return 'col-span-1 lg:col-span-6 lg:row-span-2';
      default: return 'col-span-1 lg:col-span-6 row-span-1';
    }
  };

  const renderCardContent = () => {
    // Render the appropriate card component based on card.type
    switch (card.type) {
      case 'monthly-income':
        return <MonthlyIncomeCard card={card} financeData={financeData} />;
      
      case 'monthly-spending':
        return <MonthlySpendingCard card={card} financeData={financeData} />;
      
      case 'monthly-savings':
        return <MonthlySavingsCard card={card} financeData={financeData} />;
      
      case 'net-worth':
        return <NetWorthCard card={card} financeData={financeData} />;
      
      case 'net-worth-growth':
        return <NetWorthGrowthCard card={card} financeData={financeData} />;
      
      case 'cash-flow-forecast':
        return <CashFlowForecastCard card={card} financeData={financeData} />;
      
      case 'expense-categories':
        return <ExpenseCategoriesCard card={card} financeData={financeData} />;
      
      case 'top-spending':
      case 'top-spending-categories':
        return <TopSpendingCard card={card} financeData={financeData} />;
      
      case 'budget-tracking':
      case 'budgets-tracking':
        return <BudgetTrackingCard card={card} financeData={financeData} />;
      
      case 'financial-goals':
        return <FinancialGoalsCard card={card} financeData={financeData} />;

      case 'financial-health-score':
        return <FinancialHealthCard card={card} financeData={financeData} />;
      
      // Accounts & Assets
      case 'account-progress':
        return <AccountProgressCard card={card} financeData={financeData} />;
      case 'account-list':
        return <AccountListCard card={card} financeData={financeData} />;
      case 'assets-overview':
        return <AssetsOverviewCard card={card} financeData={financeData} />;
      case 'asset-allocation':
        return <AssetAllocationCard card={card} financeData={financeData} />;
      
      case 'vesting-schedules':
        return <VestingSchedulesCard 
          card={card} 
          financeData={financeData} 
          onShowVestingModal={onShowVestingModal || (() => {})}
        />;

      case 'recent-transactions':
        return <RecentTransactionsCard card={card} financeData={financeData} />;

      case 'goal-timeline':
        return <GoalTimelineCard card={card} financeData={financeData} />;

      case 'subscription-tracker':
        return <SubscriptionTrackerCard card={card} financeData={financeData} />;



      case 'peer-benchmarking':
        return <PeerBenchmarkingCard card={card} financeData={financeData} />;

      case 'household-contributions':
        return <HouseholdContributionsCard card={card} financeData={financeData} />;

      case 'cash-flow-insights':
        return <CashFlowInsightsCard card={card} financeData={financeData} />;

      case 'alerts-recommendations':
        return <AlertsRecommendationsCard card={card} financeData={financeData} />;

      case 'dashboard-customization':
        return <DashboardCustomizationCard card={card} financeData={financeData} />;

      case 'emergency-fund':
        return <EmergencyFundCard card={card} financeData={financeData} />;

      case 'net-worth-projection':
        return <NetWorthProjectionCard card={card} financeData={financeData} />;

      // Fallback for any unrecognized cards
      default:
        return <PlaceholderCard card={card} />;
    }
  };

  return (
    <div className={`relative ${getSizeClass(card.size)}`}>
      <div className={`dashboard-card ${card.size}-size bg-white rounded-lg shadow-sm border border-gray-200 min-h-0 flex flex-col lg:min-h-[200px]`}>
        {/* Card Header */}
        <div className="flex items-center justify-between p-4 lg:p-4 border-b border-gray-100">
          <h3 className="text-lg lg:text-lg font-semibold text-gray-900 truncate pr-2">
            {card.config?.title || cardDefinition.title}
          </h3>
          
          {/* Card Menu */}
          <div className="relative flex-shrink-0">
            <button
              ref={buttonRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 active:text-gray-600 lg:hover:text-gray-600 active:bg-gray-100 lg:hover:bg-gray-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              title="Card options"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {/* Card Size Options */}
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-700 mb-2">Card Size</div>
                  <div className="space-y-1">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSizeChange(option.value as any)}
                        className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${
                          card.size === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Range Options (if supported) */}
                {supportsTimeRange && (
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-2">Time Range</div>
                    <div className="space-y-1">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTimeRangeChange(option.value)}
                          className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                            currentTimeRange === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remove Card */}
                <div className="p-1">
                  <button
                    onClick={handleRemoveCard}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-4 lg:p-4 flex-1 min-h-0">
          {renderCardContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardCardWrapper; 