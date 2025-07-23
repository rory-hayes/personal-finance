import React from 'react';
import { 
  Settings, 
  Maximize2, 
  Minimize2, 
  X,
  MoreVertical
} from 'lucide-react';
import { DashboardCard, CardSize } from '../../types/dashboard';
import * as Cards from './cards';

interface DashboardCardWrapperProps {
  card: DashboardCard;
  editMode: boolean;
  onResize: (cardId: string, newSize: CardSize) => void;
  onRemove: (cardId: string) => void;
  onUpdate: (cardId: string, updates: Partial<DashboardCard>) => void;
  financeData: any;
  onShowVestingModal: () => void;
}

const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
  card,
  editMode,
  onResize,
  onRemove,
  onUpdate,
  financeData,
  onShowVestingModal
}) => {
  const getSizeClasses = (size: CardSize): string => {
    switch (size) {
      case 'quarter':
        return 'col-span-1 row-span-1 min-h-[280px]';
      case 'half':
        return 'col-span-2 row-span-1 min-h-[320px]';
      case 'full':
        return 'col-span-4 row-span-1 min-h-[360px]';
      case 'tall':
        return 'col-span-4 row-span-2 min-h-[600px]';
      default:
        return 'col-span-2 row-span-1 min-h-[320px]';
    }
  };

  const getNextSize = (currentSize: CardSize): CardSize => {
    const sizes: CardSize[] = ['quarter', 'half', 'full', 'tall'];
    const currentIndex = sizes.indexOf(currentSize);
    return sizes[(currentIndex + 1) % sizes.length];
  };

  const handleResize = () => {
    onResize(card.id, getNextSize(card.size));
  };

  const renderCardContent = () => {
    const commonProps = {
      card,
      financeData,
      onShowVestingModal
    };

    switch (card.type) {
      // Essential Financial Metrics
      case 'monthly-income':
        return <Cards.MonthlyIncomeCard {...commonProps} />;
      case 'monthly-spending':
        return <Cards.MonthlySpendingCard {...commonProps} />;
      case 'monthly-savings':
        return <Cards.MonthlySavingsCard {...commonProps} />;
      case 'net-worth':
        return <Cards.NetWorthCard {...commonProps} />;
      case 'net-worth-growth':
        return <Cards.NetWorthGrowthCard {...commonProps} />;
      case 'cash-flow-forecast':
        return <Cards.CashFlowForecastCard {...commonProps} />;
      
      // Spending Analysis
      case 'expense-categories':
        return <Cards.ExpenseCategoriesCard {...commonProps} />;
      case 'top-spending-categories':
        return <Cards.TopSpendingCard {...commonProps} />;
      case 'budgets-tracking':
        return <Cards.BudgetTrackingCard {...commonProps} />;
      
      // Goals & Planning
      case 'financial-goals':
        return <Cards.FinancialGoalsCard {...commonProps} />;
      case 'emergency-fund':
        return <Cards.EmergencyFundCard {...commonProps} />;
      case 'financial-health-score':
        return <Cards.FinancialHealthCard {...commonProps} />;
      
      // Accounts & Assets
      case 'account-progress':
        return <Cards.AccountProgressCard {...commonProps} />;
      case 'assets-overview':
        return <Cards.AssetsOverviewCard {...commonProps} />;
      case 'asset-allocation':
        return <Cards.AssetAllocationCard {...commonProps} />;
      
      // Advanced Features
      case 'vesting-schedules':
        return <Cards.VestingSchedulesCard {...commonProps} />;
      case 'goal-timeline':
        return <Cards.GoalTimelineCard {...commonProps} />;
      case 'recent-transactions':
        return <Cards.RecentTransactionsCard {...commonProps} />;
      case 'subscription-tracker':
        return <Cards.SubscriptionTrackerCard {...commonProps} />;
      case 'bonus-tracker':
        return <Cards.BonusTrackerCard {...commonProps} />;
      case 'peer-benchmarking':
        return <Cards.PeerBenchmarkingCard {...commonProps} />;
      case 'household-contributions':
        return <Cards.HouseholdContributionsCard {...commonProps} />;
      case 'cash-flow-insights':
        return <Cards.CashFlowInsightsCard {...commonProps} />;
      case 'alerts-recommendations':
        return <Cards.AlertsRecommendationsCard {...commonProps} />;
      case 'dashboard-customization':
        return <Cards.DashboardCustomizationCard {...commonProps} />;
      
      default:
        return <Cards.PlaceholderCard card={card} />;
    }
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border border-gray-200 p-6
        ${getSizeClasses(card.size)}
        ${editMode ? 'ring-2 ring-blue-200 hover:ring-blue-300' : ''}
        transition-all duration-200 hover:shadow-md
      `}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{card.title}</h3>
        
        <div className="flex items-center gap-2">
          {/* Card Actions (always visible for certain actions) */}
          {card.config.showActions && !editMode && (
            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Card options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}

          {/* Edit Mode Controls */}
          {editMode && (
            <>
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

              <button
                onClick={() => onUpdate(card.id, { 
                  config: { ...card.config, showActions: !card.config.showActions }
                })}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Configure card"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                onClick={() => onRemove(card.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove card"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="h-[calc(100%-4rem)] flex flex-col">
        {renderCardContent()}
      </div>

      {/* Edit Mode Overlay */}
      {editMode && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-10 pointer-events-none rounded-xl" />
      )}

      {/* Size Indicator in Edit Mode */}
      {editMode && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
          {card.size}
        </div>
      )}
    </div>
  );
};

export default DashboardCardWrapper; 