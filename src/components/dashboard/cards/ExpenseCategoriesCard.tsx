import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ExpenseCategoriesCardProps {
  card: any;
  financeData: any;
}

const ExpenseCategoriesCard: React.FC<ExpenseCategoriesCardProps> = ({ card, financeData }) => {
  const { transactions } = financeData;

  // Calculate expense data by category
  const expenseData = useMemo(() => {
    const currentMonth = new Date();
    
    // Get current month transactions (expenses only)
    const currentMonthExpenses = transactions.filter((t: any) => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth.getMonth() && 
             transactionDate.getFullYear() === currentMonth.getFullYear() &&
             t.amount < 0;
    });

    // Group by category
    const categoryTotals = currentMonthExpenses.reduce((acc: any, t: any) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    // Convert to array and sort
    const categoryArray = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate percentages
    const totalAmount = categoryArray.reduce((sum, item) => sum + item.amount, 0);
    categoryArray.forEach(item => {
      item.percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
    });

    // Colors for categories
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
      '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
    ];

    const chartData = categoryArray.map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));

    return {
      categories: chartData,
      totalAmount,
      hasData: categoryArray.length > 0
    };
  }, [transactions]);

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={expenseData.categories.slice(0, 8)} // Top 8 categories
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="amount"
          label={false}
        >
          {expenseData.categories.slice(0, 8).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any) => [`€${value.toLocaleString()}`, 'Amount']}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={expenseData.categories.slice(0, 6)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="category" 
          tick={{ fontSize: 12 }}
          axisLine={false}
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
          formatter={(value) => [`€${value.toLocaleString()}`, 'Amount']}
          labelStyle={{ color: '#374151' }}
        />
        <Bar dataKey="amount" radius={4}>
          {expenseData.categories.slice(0, 6).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-gray-900">
          €{expenseData.totalAmount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600">Total Monthly Spending</p>
      </div>

      {expenseData.hasData ? (
        card.config.chartType === 'pie' ? renderPieChart() : renderBarChart()
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">No expense data for this month</p>
            <p className="text-xs mt-1">Add transactions to see breakdown</p>
          </div>
        </div>
      )}

      {expenseData.hasData && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {expenseData.categories.slice(0, 4).map((category, index) => (
              <div key={category.category} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-gray-600 truncate">
                  {category.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex h-full gap-6">
      {/* Chart Section */}
      <div className="flex-1">
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-gray-900">
            €{expenseData.totalAmount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total Monthly Spending</p>
        </div>

        {expenseData.hasData ? (
          card.config.chartType === 'pie' ? renderPieChart() : renderBarChart()
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">No expense data</p>
              <p className="text-sm mt-1">Add transactions to see category breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Category List Section */}
      {expenseData.hasData && (
        <div className="w-64">
          <h4 className="font-medium text-gray-900 mb-4">Categories</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expenseData.categories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {category.category}
                  </span>
                </div>
                <div className="text-right ml-2">
                  <span className="text-sm font-bold text-gray-900">
                    €{category.amount.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'full' ? renderFullView() : renderHalfView();
};

export default ExpenseCategoriesCard; 