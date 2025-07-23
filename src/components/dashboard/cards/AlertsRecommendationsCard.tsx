import React, { useMemo } from 'react';
import { Bell, Lightbulb, AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface AlertsRecommendationsCardProps {
  card: any;
  financeData: any;
}

const AlertsRecommendationsCard: React.FC<AlertsRecommendationsCardProps> = ({ card, financeData }) => {
  const { totalIncome, totalSpending, totalAccountBalance, transactions, goals, budgets } = financeData;

  // Generate smart alerts and recommendations
  const alertsAndRecommendations = useMemo(() => {
    const alerts: any[] = [];
    const recommendations: any[] = [];

    const monthlyNetFlow = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;
    const emergencyFundMonths = totalAccountBalance / (totalSpending || 1);

    // ALERTS - Issues requiring immediate attention
    if (monthlyNetFlow < 0) {
      alerts.push({
        id: 'negative-cashflow',
        type: 'critical',
        title: 'Negative Cash Flow',
        description: `You're spending €${Math.abs(monthlyNetFlow).toLocaleString()} more than you earn monthly.`,
        action: 'Review expenses and create a budget',
        priority: 1
      });
    }

    if (emergencyFundMonths < 3) {
      alerts.push({
        id: 'low-emergency-fund',
        type: 'warning',
        title: 'Low Emergency Fund',
        description: `Your emergency fund covers only ${emergencyFundMonths.toFixed(1)} months of expenses.`,
        action: 'Build emergency fund to 3-6 months of expenses',
        priority: 2
      });
    }

    // Check for budget overruns
    if (budgets?.length) {
      const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
      const currentBudget = budgets.find((b: any) => b.month === currentMonth);
      if (currentBudget && totalSpending > currentBudget.totalBudget) {
        alerts.push({
          id: 'budget-exceeded',
          type: 'warning',
          title: 'Budget Exceeded',
          description: `Monthly spending (€${totalSpending.toLocaleString()}) exceeds budget (€${currentBudget.totalBudget.toLocaleString()}).`,
          action: 'Review spending categories and adjust budget',
          priority: 2
        });
      }
    }

    // Check for stalled goals
    if (goals?.length) {
      const stalledGoals = goals.filter((goal: any) => {
        const monthsSinceCreated = (new Date().getTime() - new Date(goal.createdAt || '2024-01-01').getTime()) / (1000 * 60 * 60 * 24 * 30);
        const expectedProgress = monthsSinceCreated > 0 ? Math.min(50, monthsSinceCreated * 5) : 0;
        const actualProgress = (goal.currentAmount / goal.targetAmount) * 100;
        return actualProgress < expectedProgress && monthsSinceCreated > 2;
      });

      if (stalledGoals.length > 0) {
        alerts.push({
          id: 'stalled-goals',
          type: 'info',
          title: 'Goals Behind Schedule',
          description: `${stalledGoals.length} goal${stalledGoals.length > 1 ? 's are' : ' is'} behind expected progress.`,
          action: 'Increase monthly contributions or adjust target dates',
          priority: 3
        });
      }
    }

    // RECOMMENDATIONS - Opportunities for improvement
    if (savingsRate >= 10 && savingsRate < 20) {
      recommendations.push({
        id: 'increase-savings',
        type: 'opportunity',
        title: 'Boost Your Savings Rate',
        description: `Your ${savingsRate.toFixed(1)}% savings rate is good. Aim for 20% to accelerate wealth building.`,
        potentialBenefit: 'Could save an additional €' + Math.round((totalIncome * 0.2 - totalIncome * (savingsRate/100)) * 12).toLocaleString() + ' annually',
        action: 'Find ways to save an extra €' + Math.round(totalIncome * 0.1 - totalIncome * (savingsRate/100)).toLocaleString() + ' monthly'
      });
    }

    if (emergencyFundMonths >= 3 && emergencyFundMonths < 6) {
      recommendations.push({
        id: 'optimize-emergency-fund',
        type: 'optimization',
        title: 'Optimize Emergency Fund',
        description: 'Your emergency fund is adequate. Consider high-yield savings for better returns.',
        potentialBenefit: 'Could earn €' + Math.round(totalAccountBalance * 0.03).toLocaleString() + ' more annually at 3% APY',
        action: 'Move emergency fund to high-yield savings account'
      });
    }

    // Check for high spending categories
    if (transactions?.length) {
      const expensesByCategory = transactions
        .filter((t: any) => t.amount < 0)
        .reduce((acc: Record<string, number>, t: any) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        }, {});

      const topCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];

      if (topCategory && topCategory[1] > totalSpending * 0.3) {
        recommendations.push({
          id: 'reduce-top-expense',
          type: 'savings',
          title: `Reduce ${topCategory[0]} Spending`,
          description: `${topCategory[0]} accounts for ${((topCategory[1] as number / totalSpending) * 100).toFixed(1)}% of your spending.`,
          potentialBenefit: 'Could save €' + Math.round((topCategory[1] as number) * 0.1 * 12).toLocaleString() + ' annually with 10% reduction',
          action: `Review ${topCategory[0]} expenses for optimization opportunities`
        });
      }
    }

    if (monthlyNetFlow > 1000 && emergencyFundMonths >= 6) {
      recommendations.push({
        id: 'invest-surplus',
        type: 'growth',
        title: 'Invest Your Surplus',
        description: `You have €${monthlyNetFlow.toLocaleString()} monthly surplus after a fully funded emergency fund.`,
        potentialBenefit: 'Could grow to €' + Math.round(monthlyNetFlow * 12 * 10 * 1.07 ** 10).toLocaleString() + ' in 10 years at 7% returns',
        action: 'Consider index fund investing for long-term growth'
      });
    }

    return {
      alerts: alerts.sort((a, b) => a.priority - b.priority),
      recommendations: recommendations.slice(0, 4) // Limit to top 4
    };
  }, [totalIncome, totalSpending, totalAccountBalance, transactions, goals, budgets]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'growth': return <Target className="h-4 w-4 text-purple-600" />;
      default: return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getRecommendationBg = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'growth': return 'bg-purple-50 border-purple-200';
      default: return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Alerts & Recommendations</h3>
        </div>
        <div className="text-sm text-gray-600">
          {alertsAndRecommendations.alerts.length + alertsAndRecommendations.recommendations.length} Items
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Alerts</span>
          </div>
          <div className="text-lg font-bold text-red-900">
            {alertsAndRecommendations.alerts.length}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Recommendations</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {alertsAndRecommendations.recommendations.length}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alertsAndRecommendations.alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">🚨 Alerts</h4>
          <div className="space-y-3">
            {alertsAndRecommendations.alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-3 ${getAlertBg(alert.type)}`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{alert.title}</h5>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">Action:</span>
                      <span className="text-xs text-gray-700">{alert.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-900 mb-3">💡 Recommendations</h4>
        {alertsAndRecommendations.recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mb-4 text-gray-400 mx-auto" />
            <p className="text-sm">No recommendations at this time</p>
            <p className="text-xs mt-1">Keep up the great financial management!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertsAndRecommendations.recommendations.map((rec) => (
              <div key={rec.id} className={`border rounded-lg p-3 ${getRecommendationBg(rec.type)}`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    {rec.potentialBenefit && (
                      <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                        <div className="text-xs font-medium text-gray-900 mb-1">Potential Benefit:</div>
                        <div className="text-xs text-gray-700">{rec.potentialBenefit}</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">Next Step:</span>
                      <span className="text-xs text-gray-700">{rec.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Summary */}
      {(alertsAndRecommendations.alerts.length > 0 || alertsAndRecommendations.recommendations.length > 0) && (
        <div className="mt-4 border-t pt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900 mb-1">Priority Actions</div>
              <div className="text-gray-700 text-xs">
                {alertsAndRecommendations.alerts.length > 0 
                  ? `Focus on ${alertsAndRecommendations.alerts.length} alert${alertsAndRecommendations.alerts.length > 1 ? 's' : ''} first, then explore ${alertsAndRecommendations.recommendations.length} recommendation${alertsAndRecommendations.recommendations.length > 1 ? 's' : ''}.`
                  : `Explore ${alertsAndRecommendations.recommendations.length} recommendation${alertsAndRecommendations.recommendations.length > 1 ? 's' : ''} to optimize your finances.`
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsRecommendationsCard; 