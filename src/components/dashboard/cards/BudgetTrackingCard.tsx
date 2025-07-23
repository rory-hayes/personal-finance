import React, { useMemo } from 'react';
import { Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BudgetTrackingCardProps {
  card: any;
  financeData: any;
}

const BudgetTrackingCard: React.FC<BudgetTrackingCardProps> = ({ card, financeData }) => {
  const { budgets, budgetCategories, transactions, totalSpending } = financeData;

  // Calculate budget tracking data
  const budgetData = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      // Fallback: Create estimated budgets based on spending patterns
      const currentMonth = new Date();
      const currentMonthExpenses = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear() &&
               t.amount < 0;
      });

      // Group expenses by category
      const categorySpending = currentMonthExpenses.reduce((acc: any, t: any) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});

      // Create budget tracking for top spending categories
      const estimatedBudgets = Object.entries(categorySpending)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 6)
        .map(([category, spent]) => {
          const spentAmount = spent as number;
          const estimatedBudget = spentAmount * 1.2; // Assume 20% buffer
          const usage = (spentAmount / estimatedBudget) * 100;
          
          let status: 'on-track' | 'warning' | 'over-budget';
          if (usage > 100) status = 'over-budget';
          else if (usage > 80) status = 'warning';
          else status = 'on-track';

          return {
            id: `estimated-${category}`,
            name: category,
            budgetAmount: estimatedBudget,
            spentAmount: spentAmount,
            remainingAmount: Math.max(estimatedBudget - spentAmount, 0),
            usage,
            status,
            isEstimated: true
          };
        });

      const totalBudget = estimatedBudgets.reduce((sum, cat) => sum + cat.budgetAmount, 0);
      const totalSpent = estimatedBudgets.reduce((sum, cat) => sum + cat.spentAmount, 0);
      const overBudgetCount = estimatedBudgets.filter(cat => cat.status === 'over-budget').length;
      const warningCount = estimatedBudgets.filter(cat => cat.status === 'warning').length;

      return {
        categories: estimatedBudgets,
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallUsage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        overBudgetCount,
        warningCount,
        isEstimated: true,
        hasData: estimatedBudgets.length > 0
      };
    }

    // Real budget data processing
    const currentMonth = new Date();
    const currentMonthExpenses = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth.getMonth() && 
             transactionDate.getFullYear() === currentMonth.getFullYear() &&
             t.amount < 0;
    });

    // Process budget categories
    const categoriesWithSpending = budgetCategories.map((category: any) => {
      // Calculate actual spending for this category
      const categorySpending = currentMonthExpenses
        .filter((t: any) => t.budgetCategoryId === category.id || t.category === category.name)
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      const usage = category.allocatedAmount > 0 ? (categorySpending / category.allocatedAmount) * 100 : 0;
      const remaining = Math.max(category.allocatedAmount - categorySpending, 0);

      let status: 'on-track' | 'warning' | 'over-budget';
      if (usage > 100) status = 'over-budget';
      else if (usage > 80) status = 'warning';
      else status = 'on-track';

      return {
        id: category.id,
        name: category.name,
        budgetAmount: category.allocatedAmount,
        spentAmount: categorySpending,
        remainingAmount: remaining,
        usage,
        status,
        isEstimated: false
      };
    });

    const totalBudget = budgets.reduce((sum: number, budget: any) => sum + budget.totalBudget, 0);
    const totalSpent = categoriesWithSpending.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const overBudgetCount = categoriesWithSpending.filter(cat => cat.status === 'over-budget').length;
    const warningCount = categoriesWithSpending.filter(cat => cat.status === 'warning').length;

    return {
      categories: categoriesWithSpending.sort((a, b) => b.usage - a.usage),
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overallUsage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      overBudgetCount,
      warningCount,
      isEstimated: false,
      hasData: categoriesWithSpending.length > 0
    };
  }, [budgets, budgetCategories, transactions, totalSpending]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'over-budget':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'over-budget':
        return TrendingUp;
      default:
        return Target;
    }
  };

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {budgetData.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {budgetData.overallUsage.toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Budget Used</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${
                budgetData.overBudgetCount > 0 ? 'text-red-600' :
                budgetData.warningCount > 0 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {budgetData.overBudgetCount + budgetData.warningCount}
              </p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>€{budgetData.totalSpent.toLocaleString()}</span>
              <span>€{budgetData.totalBudget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetData.overallUsage > 100 ? 'bg-red-500' :
                  budgetData.overallUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetData.overallUsage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {budgetData.categories.slice(0, 4).map((category: any) => {
              const StatusIcon = getStatusIcon(category.status);
              return (
                <div key={category.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusIcon className={`h-4 w-4 ${
                      category.status === 'on-track' ? 'text-green-600' :
                      category.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {category.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {category.usage.toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-500">
                      €{category.spentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {budgetData.isEstimated && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              ⚡ Estimated based on spending patterns
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No budget data available</p>
            <p className="text-xs mt-1">Set up budgets to track spending</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {budgetData.hasData ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                €{budgetData.totalBudget.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Total Budget</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-900">
                €{budgetData.totalSpent.toLocaleString()}
              </p>
              <p className="text-sm text-red-700">Total Spent</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                €{budgetData.totalRemaining.toLocaleString()}
              </p>
              <p className="text-sm text-green-700">Remaining</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className={`text-xl font-bold ${
                budgetData.overallUsage > 100 ? 'text-red-900' :
                budgetData.overallUsage > 80 ? 'text-yellow-900' : 'text-purple-900'
              }`}>
                {budgetData.overallUsage.toFixed(0)}%
              </p>
              <p className="text-sm text-purple-700">Used</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">
                Budget vs Actual Spending
                {budgetData.isEstimated && (
                  <span className="text-sm text-gray-500 ml-2">(Estimated)</span>
                )}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `€${value.toLocaleString()}`, 
                      name === 'budgetAmount' ? 'Budget' : 'Spent'
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="budgetAmount" fill="#E5E7EB" name="budgetAmount" radius={4} />
                  <Bar 
                    dataKey="spentAmount" 
                    fill={(entry: any) => {
                      if (entry.status === 'over-budget') return '#EF4444';
                      if (entry.status === 'warning') return '#F59E0B';
                      return '#10B981';
                    }}
                    name="spentAmount"
                    radius={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Details */}
            <div className="w-80">
              <h4 className="font-medium text-gray-900 mb-4">Category Status</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {budgetData.categories.map((category: any) => {
                  const StatusIcon = getStatusIcon(category.status);
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{category.name}</h5>
                          <p className="text-sm text-gray-600">
                            €{category.spentAmount.toLocaleString()} of €{category.budgetAmount.toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(category.status)}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {category.status === 'on-track' ? 'On Track' :
                           category.status === 'warning' ? 'Warning' : 'Over Budget'
                          }
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.usage.toFixed(0)}% used</span>
                          <span>€{category.remainingAmount.toLocaleString()} left</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              category.status === 'over-budget' ? 'bg-red-500' :
                              category.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(category.usage, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      {category.status === 'over-budget' && (
                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                          Over budget by €{(category.spentAmount - category.budgetAmount).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No budget data available</p>
            <p className="text-sm">Set up budgets in the Budget tab to track spending</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default BudgetTrackingCard; 