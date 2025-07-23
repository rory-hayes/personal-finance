import React, { useMemo } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface CashFlowInsightsCardProps {
  card: any;
  financeData: any;
}

const CashFlowInsightsCard: React.FC<CashFlowInsightsCardProps> = ({ card, financeData }) => {
  const { totalIncome, totalSpending, totalAccountBalance, transactions, goals } = financeData;

  // Generate AI-like insights based on financial data
  const insights = useMemo(() => {
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;
    const monthlyNetFlow = totalIncome - totalSpending;
    const emergencyFundRatio = totalAccountBalance / (totalSpending || 1);
    
    const analyses = [
      {
        id: 'savings-rate',
        type: 'positive' as const,
        title: 'Savings Performance',
        description: savingsRate >= 20 
          ? `Excellent savings rate of ${savingsRate.toFixed(1)}%. You're building wealth faster than 75% of people.`
          : savingsRate >= 10
          ? `Good savings rate of ${savingsRate.toFixed(1)}%. Consider increasing to 20% for optimal wealth building.`
          : `Low savings rate of ${savingsRate.toFixed(1)}%. Focus on increasing income or reducing expenses.`,
        impact: savingsRate >= 20 ? 'high' : savingsRate >= 10 ? 'medium' : 'low',
        actionable: savingsRate < 20
      },
      {
        id: 'cash-flow',
        type: monthlyNetFlow > 0 ? 'positive' as const : 'risk' as const,
        title: 'Monthly Cash Flow',
        description: monthlyNetFlow > 0
          ? `Positive cash flow of €${monthlyNetFlow.toLocaleString()}/month. Your income exceeds expenses.`
          : `Negative cash flow of €${Math.abs(monthlyNetFlow).toLocaleString()}/month. Review expenses immediately.`,
        impact: Math.abs(monthlyNetFlow) > 1000 ? 'high' : 'medium',
        actionable: monthlyNetFlow <= 0
      },
      {
        id: 'emergency-fund',
        type: emergencyFundRatio >= 3 ? 'positive' as const : 'warning' as const,
        title: 'Emergency Fund Status',
        description: emergencyFundRatio >= 6
          ? `Strong emergency fund covering ${emergencyFundRatio.toFixed(1)} months of expenses.`
          : emergencyFundRatio >= 3
          ? `Adequate emergency fund covering ${emergencyFundRatio.toFixed(1)} months. Consider building to 6 months.`
          : `Low emergency fund covering only ${emergencyFundRatio.toFixed(1)} months. Build to 3-6 months.`,
        impact: emergencyFundRatio < 3 ? 'high' : 'medium',
        actionable: emergencyFundRatio < 6
      },
      {
        id: 'spending-trend',
        type: 'neutral' as const,
        title: 'Spending Analysis',
        description: transactions?.length 
          ? `Analyzed ${transactions.length} transactions. Most spending in ${getMostCommonCategory(transactions)} category.`
          : 'No recent transactions to analyze spending patterns.',
        impact: 'medium',
        actionable: true
      }
    ];

    // Add goal-specific insights
    if (goals?.length) {
      const behindGoals = goals.filter((g: any) => {
        const progress = g.currentAmount / g.targetAmount;
        const timeProgress = (new Date().getTime() - new Date(g.createdAt || '2024-01-01').getTime()) / 
                            (new Date(g.targetDate).getTime() - new Date(g.createdAt || '2024-01-01').getTime());
        return progress < timeProgress * 0.8;
      });

      if (behindGoals.length > 0) {
        analyses.push({
          id: 'goal-progress',
          type: 'warning' as const,
          title: 'Goal Progress Alert',
          description: `${behindGoals.length} goal${behindGoals.length > 1 ? 's' : ''} behind schedule. Increase monthly contributions.`,
          impact: 'high',
          actionable: true
        });
      }
    }

    return analyses;
  }, [totalIncome, totalSpending, totalAccountBalance, transactions, goals]);

  function getMostCommonCategory(transactions: any[]): string {
    const categories = transactions.reduce((acc: Record<string, number>, t: any) => {
      if (t.amount < 0) { // Only expenses
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {});
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown';
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Eye className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'risk': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Cash Flow Insights</h3>
        </div>
        <div className="text-sm text-gray-600">
          AI Analysis
        </div>
      </div>

      {/* Insights Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-900">
              {insights.filter(i => i.type === 'positive').length}
            </div>
            <div className="text-xs text-green-800">Positive</div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-900">
              {insights.filter(i => i.type === 'warning').length}
            </div>
            <div className="text-xs text-yellow-800">Warnings</div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-red-900">
              {insights.filter(i => i.type === 'risk').length}
            </div>
            <div className="text-xs text-red-800">Risks</div>
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {insights.map((insight) => (
          <div key={insight.id} className={`border rounded-lg p-4 ${getInsightBg(insight.type)}`}>
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact} impact
                    </span>
                    {insight.actionable && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Actionable
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Recommendations */}
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top Recommendations</h4>
        <div className="space-y-2">
          {insights
            .filter(i => i.actionable && i.impact === 'high')
            .slice(0, 2)
            .map((insight) => (
              <div key={`rec-${insight.id}`} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-600 rounded-full" />
                <span className="text-gray-700">
                  {insight.type === 'risk' ? 'Address' : 'Improve'} {insight.title.toLowerCase()}
                </span>
              </div>
            ))}
          {insights.filter(i => i.actionable && i.impact === 'high').length === 0 && (
            <div className="text-sm text-gray-600 italic">
              No critical actions needed. Keep up the good work!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowInsightsCard; 