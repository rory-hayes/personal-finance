import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopSpendingCardProps {
  card: any;
  financeData: any;
}

const TopSpendingCard: React.FC<TopSpendingCardProps> = ({ card, financeData }) => {
  const { transactions } = financeData;

  // Calculate top spending categories
  const spendingData = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Get current month expenses
    const currentMonthExpenses = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth.getMonth() && 
             transactionDate.getFullYear() === currentMonth.getFullYear() &&
             t.amount < 0;
    });

    // Get last month expenses for comparison
    const lastMonthExpenses = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === lastMonth.getMonth() && 
             transactionDate.getFullYear() === lastMonth.getFullYear() &&
             t.amount < 0;
    });

    // Group current month by category
    const currentCategoryTotals = currentMonthExpenses.reduce((acc: any, t: any) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    // Group last month by category
    const lastCategoryTotals = lastMonthExpenses.reduce((acc: any, t: any) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    // Convert to array and calculate changes
    const topCategories = Object.entries(currentCategoryTotals)
      .map(([category, amount]) => {
        const currentAmount = amount as number;
        const lastAmount = lastCategoryTotals[category] || 0;
        const change = currentAmount - lastAmount;
        const changePercent = lastAmount > 0 ? (change / lastAmount) * 100 : (currentAmount > 0 ? 100 : 0);
        
        // Determine alert level
        let alertLevel: 'normal' | 'warning' | 'danger' = 'normal';
        if (changePercent > 30) alertLevel = 'danger';
        else if (changePercent > 15) alertLevel = 'warning';

        return {
          category,
          amount: currentAmount,
          lastAmount,
          change,
          changePercent,
          alertLevel,
          isIncreased: change > 0
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalSpending = topCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalChange = topCategories.reduce((sum, cat) => sum + cat.change, 0);
    const avgChangePercent = topCategories.length > 0 
      ? topCategories.reduce((sum, cat) => sum + Math.abs(cat.changePercent), 0) / topCategories.length 
      : 0;

    // Overall alert status
    const alertCategoriesCount = topCategories.filter(cat => cat.alertLevel !== 'normal').length;
    const overallAlert = alertCategoriesCount >= 3 ? 'danger' : 
                        alertCategoriesCount >= 1 ? 'warning' : 'normal';

    return {
      topCategories,
      totalSpending,
      totalChange,
      avgChangePercent,
      overallAlert,
      alertCategoriesCount,
      hasData: topCategories.length > 0
    };
  }, [transactions]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      {spendingData.hasData ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              spendingData.overallAlert === 'danger' ? 'bg-red-100' :
              spendingData.overallAlert === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              {spendingData.overallAlert !== 'normal' ? (
                <AlertCircle className={`h-5 w-5 ${
                  spendingData.overallAlert === 'danger' ? 'text-red-600' : 'text-yellow-600'
                }`} />
              ) : (
                <DollarSign className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">
                €{spendingData.totalSpending.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Top Categories</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {spendingData.topCategories.slice(0, 3).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {category.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    €{category.amount.toLocaleString()}
                  </span>
                  {category.changePercent !== 0 && (
                    <div className="flex items-center gap-1">
                      {category.isIncreased ? (
                        <TrendingUp className={`h-3 w-3 ${
                          category.alertLevel === 'danger' ? 'text-red-600' :
                          category.alertLevel === 'warning' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-green-600 rotate-180" />
                      )}
                      <span className={`text-xs font-medium ${
                        category.alertLevel === 'danger' ? 'text-red-600' :
                        category.alertLevel === 'warning' ? 'text-yellow-600' :
                        category.isIncreased ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.isIncreased ? '+' : ''}{category.changePercent.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {spendingData.overallAlert !== 'normal' && (
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              spendingData.overallAlert === 'danger' 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {spendingData.overallAlert === 'danger' 
                ? `⚠️ High increases in ${spendingData.alertCategoriesCount} categories`
                : `⚡ Watch ${spendingData.alertCategoriesCount} categories`
              }
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No spending data available</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      {spendingData.hasData ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-900">
                €{spendingData.totalSpending.toLocaleString()}
              </p>
              <p className="text-sm text-red-700">Total Top 5</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-xl font-bold ${
                spendingData.totalChange >= 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {spendingData.totalChange >= 0 ? '+' : ''}€{spendingData.totalChange.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">vs Last Month</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                spendingData.overallAlert === 'normal' ? 'bg-green-100 text-green-800' :
                spendingData.overallAlert === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {spendingData.overallAlert === 'normal' ? '✅' : 
                 spendingData.overallAlert === 'warning' ? '⚡' : '⚠️'}
                {spendingData.overallAlert}
              </div>
              <p className="text-sm text-gray-700 mt-1">Alert Level</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">Top Spending Categories</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData.topCategories} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toLocaleString()}`, 'Amount']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={4}
                    fill={(entry: any) => {
                      if (entry.alertLevel === 'danger') return '#EF4444';
                      if (entry.alertLevel === 'warning') return '#F59E0B';
                      return '#3B82F6';
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Details */}
            <div className="w-80">
              <h4 className="font-medium text-gray-900 mb-4">Category Analysis</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {spendingData.topCategories.map((category, index) => (
                  <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-orange-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h5 className="font-medium text-gray-900">{category.category}</h5>
                          <p className="text-sm text-gray-600">
                            €{category.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        category.alertLevel === 'danger' ? 'bg-red-100 text-red-700' :
                        category.alertLevel === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {category.alertLevel === 'danger' ? 'High Risk' :
                         category.alertLevel === 'warning' ? 'Watch' : 'Normal'
                        }
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Last Month:</span>
                        <span className="font-medium ml-1">€{category.lastAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-medium ml-1 ${
                          category.isIncreased ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {category.isIncreased ? '+' : ''}€{category.change.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {category.isIncreased ? (
                        <TrendingUp className={`h-4 w-4 ${
                          category.alertLevel === 'danger' ? 'text-red-600' :
                          category.alertLevel === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />
                      )}
                      <span className={`text-sm font-medium ${
                        category.alertLevel === 'danger' ? 'text-red-600' :
                        category.alertLevel === 'warning' ? 'text-yellow-600' :
                        category.isIncreased ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.isIncreased ? '+' : ''}{category.changePercent.toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No spending data available</p>
            <p className="text-sm">Add transactions to see top spending categories</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : renderDetailedView();
};

export default TopSpendingCard; 