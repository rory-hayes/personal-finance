import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, CreditCard, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlySpendingCardProps {
  card: any;
  financeData: any;
}

const MonthlySpendingCard: React.FC<MonthlySpendingCardProps> = ({ card, financeData }) => {
  const { transactions, totalSpending } = financeData;

  // Calculate spending data
  const spendingData = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const currentMonthSpending = transactions
      .filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear() &&
               t.amount < 0;
      })
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    const lastMonthSpending = transactions
      .filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === lastMonth.getMonth() && 
               transactionDate.getFullYear() === lastMonth.getFullYear() &&
               t.amount < 0;
      })
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    const change = lastMonthSpending > 0 ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;
    const isIncreased = change > 0;

    // Top spending categories for current month
    const categorySpending = transactions
      .filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear() &&
               t.amount < 0;
      })
      .reduce((acc: any, t: any) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Spending alert level
    const alertLevel = change > 20 ? 'high' : change > 10 ? 'medium' : 'low';

    return {
      currentSpending: currentMonthSpending,
      lastSpending: lastMonthSpending,
      change,
      isIncreased,
      topCategories,
      alertLevel
    };
  }, [transactions, totalSpending]);

  const renderMobileView = () => (
    <div className="flex flex-col space-y-4">
      {/* Main Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            spendingData.alertLevel === 'high' ? 'bg-red-100' :
            spendingData.alertLevel === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
          }`}>
            {spendingData.alertLevel === 'high' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <CreditCard className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              €{spendingData.currentSpending.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
        </div>
        {spendingData.change !== 0 && (
          <div className="flex items-center gap-1">
            {spendingData.isIncreased ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
            <span className={`text-sm font-medium ${
              spendingData.isIncreased ? 'text-red-600' : 'text-green-600'
            }`}>
              {spendingData.isIncreased ? '+' : ''}{spendingData.change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Top Categories - Mobile Optimized */}
      {spendingData.topCategories.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Top Categories</span>
            <span className="text-xs text-gray-500">{spendingData.topCategories.length} categories</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {spendingData.topCategories.slice(0, 3).map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700 font-medium">{cat.category}</span>
                <span className="text-sm font-semibold text-gray-900">
                  €{cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert */}
      {spendingData.change > 10 && (
        <div className={`p-3 rounded-lg ${
          spendingData.alertLevel === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${
              spendingData.alertLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <p className={`text-sm font-medium ${
              spendingData.alertLevel === 'high' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {spendingData.alertLevel === 'high' 
                ? 'High spending increase' 
                : 'Moderate spending increase'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          spendingData.alertLevel === 'high' ? 'bg-red-100' :
          spendingData.alertLevel === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
        }`}>
          {spendingData.alertLevel === 'high' ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <CreditCard className={`h-5 w-5 ${
              spendingData.alertLevel === 'medium' ? 'text-yellow-600' : 'text-blue-600'
            }`} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            €{spendingData.currentSpending.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            {spendingData.change !== 0 && (
              <>
                {spendingData.isIncreased ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                  spendingData.isIncreased ? 'text-red-600' : 'text-green-600'
                }`}>
                  {spendingData.isIncreased ? '+' : ''}{spendingData.change.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      {spendingData.topCategories.length > 0 && (
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-2">Top Categories</div>
          <div className="space-y-2">
            {spendingData.topCategories.slice(0, 3).map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate">{cat.category}</span>
                <span className="text-sm font-medium text-gray-900">
                  €{cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            €{spendingData.currentSpending.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current Month</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            {spendingData.isIncreased ? (
              <TrendingUp className="h-5 w-5 text-red-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-600" />
            )}
            <p className={`text-xl font-bold ${
              spendingData.isIncreased ? 'text-red-600' : 'text-green-600'
            }`}>
              {spendingData.isIncreased ? '+' : ''}{spendingData.change.toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-gray-600">Month-over-Month</p>
        </div>
      </div>

      {spendingData.topCategories.length > 0 && (
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">Spending by Category</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendingData.topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => [`€${value.toLocaleString()}`, 'Spending']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="amount" 
                radius={4}
                fill="#EF4444"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {spendingData.alertLevel !== 'low' && (
        <div className={`mt-4 p-3 rounded-lg ${
          spendingData.alertLevel === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${
              spendingData.alertLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <p className={`text-sm font-medium ${
              spendingData.alertLevel === 'high' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {spendingData.alertLevel === 'high' 
                ? 'High spending increase detected' 
                : 'Moderate spending increase'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {renderMobileView()}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {card.size === 'quarter' ? renderQuarterView() : renderDetailedView()}
      </div>
    </>
  );
};

export default MonthlySpendingCard; 