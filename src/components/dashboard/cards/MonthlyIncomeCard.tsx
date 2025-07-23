import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyIncomeCardProps {
  card: any;
  financeData: any;
}

const MonthlyIncomeCard: React.FC<MonthlyIncomeCardProps> = ({ card, financeData }) => {
  const { users, transactions, totalIncome } = financeData;

  // Calculate income data
  const incomeData = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Current month income from users.monthly_income
    const currentMonthIncome = users.reduce((sum: number, user: any) => sum + (user.monthlyIncome || 0), 0);
    
    // Also calculate actual income from transactions if available
    const currentMonthTransactionIncome = transactions
      .filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear() &&
               t.amount > 0;
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const lastMonthTransactionIncome = transactions
      .filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === lastMonth.getMonth() && 
               transactionDate.getFullYear() === lastMonth.getFullYear() &&
               t.amount > 0;
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Use the higher of the two values (expected vs actual)
    const actualCurrentIncome = Math.max(currentMonthIncome, currentMonthTransactionIncome);
    const actualLastIncome = Math.max(currentMonthIncome, lastMonthTransactionIncome);

    const change = actualLastIncome > 0 ? ((actualCurrentIncome - actualLastIncome) / actualLastIncome) * 100 : 0;
    const isPositive = change >= 0;

    // Income breakdown by user
    const incomeByUser = users.map((user: any) => ({
      name: user.name,
      income: user.monthlyIncome || 0,
      color: user.color || '#3B82F6'
    })).filter((user: any) => user.income > 0);

    return {
      currentIncome: actualCurrentIncome,
      lastIncome: actualLastIncome,
      change,
      isPositive,
      incomeByUser,
      hasMultipleUsers: users.length > 1
    };
  }, [users, transactions, totalIncome]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            €{incomeData.currentIncome.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            {incomeData.change !== 0 && (
              <>
                {incomeData.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  incomeData.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {incomeData.isPositive ? '+' : ''}{incomeData.change.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        </div>
      </div>

      {incomeData.hasMultipleUsers && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Contributors</span>
          </div>
          <div className="space-y-2">
            {incomeData.incomeByUser.slice(0, 3).map((user: any) => (
              <div key={user.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  €{user.income.toLocaleString()}
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
            €{incomeData.currentIncome.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current Month</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            {incomeData.isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-xl font-bold ${
              incomeData.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {incomeData.isPositive ? '+' : ''}{incomeData.change.toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-gray-600">Month-over-Month</p>
        </div>
      </div>

      {incomeData.hasMultipleUsers && incomeData.incomeByUser.length > 0 && (
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">Income Breakdown</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeData.incomeByUser}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => [`€${value.toLocaleString()}`, 'Monthly Income']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="income" 
                radius={4}
                fill="#10B981"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : renderDetailedView();
};

export default MonthlyIncomeCard; 