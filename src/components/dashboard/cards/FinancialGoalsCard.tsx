import React, { useMemo } from 'react';
import { Target, Calendar, TrendingUp, Plus } from 'lucide-react';

interface FinancialGoalsCardProps {
  card: any;
  financeData: any;
}

const FinancialGoalsCard: React.FC<FinancialGoalsCardProps> = ({ card, financeData }) => {
  const { goals } = financeData;

  // Calculate goals data
  const goalsData = useMemo(() => {
    const activeGoals = goals.filter((goal: any) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      return progress < 100; // Only show incomplete goals
    });

    const completedGoals = goals.filter((goal: any) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      return progress >= 100;
    });

    const goalsWithMetrics = goals.map((goal: any) => {
      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
      
      // Calculate time to target
      const targetDate = new Date(goal.targetDate);
      const today = new Date();
      const daysRemaining = Math.max(Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
      const monthsRemaining = Math.max(Math.ceil(daysRemaining / 30), 1);
      
      // Calculate required monthly savings
      const requiredMonthlySavings = remaining / monthsRemaining;
      
      // Determine status
      let status: 'on-track' | 'behind' | 'at-risk' | 'completed';
      if (progress >= 100) {
        status = 'completed';
      } else if (daysRemaining <= 0) {
        status = 'at-risk';
      } else if (progress >= (100 - (daysRemaining / (365 * 2)) * 100)) { // Simple heuristic
        status = 'on-track';
      } else {
        status = 'behind';
      }

      return {
        ...goal,
        progress,
        remaining,
        daysRemaining,
        monthsRemaining,
        requiredMonthlySavings,
        status
      };
    });

    return {
      activeGoals,
      completedGoals,
      goalsWithMetrics: goalsWithMetrics.sort((a, b) => a.daysRemaining - b.daysRemaining),
      totalGoalValue: goals.reduce((sum: number, goal: any) => sum + goal.targetAmount, 0),
      totalSavedValue: goals.reduce((sum: number, goal: any) => sum + goal.currentAmount, 0)
    };
  }, [goals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'on-track':
        return 'text-blue-600 bg-blue-100';
      case 'behind':
        return 'text-yellow-600 bg-yellow-100';
      case 'at-risk':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {goals.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {goalsData.activeGoals.length}
              </p>
              <p className="text-xs text-gray-600">Active Goals</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {goalsData.completedGoals.length}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {goalsData.goalsWithMetrics.slice(0, 3).map((goal: any) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {goal.name}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status === 'on-track' ? 'On Track' :
                     goal.status === 'completed' ? 'Done' :
                     goal.status === 'behind' ? 'Behind' : 'At Risk'
                    }
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>€{goal.currentAmount.toLocaleString()}</span>
                    <span>€{goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.status === 'completed' ? 'bg-green-500' :
                        goal.status === 'on-track' ? 'bg-blue-500' :
                        goal.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{goal.progress.toFixed(0)}% complete</span>
                  {goal.daysRemaining > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {goal.daysRemaining}d left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No financial goals set</p>
            <p className="text-xs mb-3">Set goals to track your progress</p>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switchToGoals'));
              }}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3 w-3" />
              Add Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-900">{goals.length}</p>
          <p className="text-sm text-blue-700">Total Goals</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-900">{goalsData.completedGoals.length}</p>
          <p className="text-sm text-green-700">Completed</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-lg font-bold text-purple-900">
            €{goalsData.totalGoalValue.toLocaleString()}
          </p>
          <p className="text-sm text-purple-700">Target Value</p>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <p className="text-lg font-bold text-indigo-900">
            €{goalsData.totalSavedValue.toLocaleString()}
          </p>
          <p className="text-sm text-indigo-700">Total Saved</p>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-4">Goal Progress</h4>
          <div className="space-y-4">
            {goalsData.goalsWithMetrics.map((goal: any) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{goal.name}</h5>
                    {goal.description && (
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status === 'on-track' ? 'On Track' :
                     goal.status === 'completed' ? 'Completed' :
                     goal.status === 'behind' ? 'Behind Schedule' : 'At Risk'
                    }
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>€{goal.currentAmount.toLocaleString()} saved</span>
                    <span>€{goal.targetAmount.toLocaleString()} target</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        goal.status === 'completed' ? 'bg-green-500' :
                        goal.status === 'on-track' ? 'bg-blue-500' :
                        goal.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium ml-1">{goal.progress.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium ml-1">€{goal.remaining.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Target Date:</span>
                    <span className="font-medium ml-1">
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {goal.status !== 'completed' && goal.daysRemaining > 0 && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-600">
                      Need to save €{goal.requiredMonthlySavings.toLocaleString()}/month 
                      for {goal.monthsRemaining} months to reach goal
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No financial goals set</p>
            <p className="text-sm mb-4">Create goals to track your financial progress</p>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switchToGoals'));
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'full' ? renderFullView() : renderHalfView();
};

export default FinancialGoalsCard; 