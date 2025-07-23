import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';

interface NetWorthGrowthCardProps {
  card: any;
  financeData: any;
}

const NetWorthGrowthCard: React.FC<NetWorthGrowthCardProps> = ({ card, financeData }) => {
  const { 
    totalAssetValue, 
    totalAccountBalance, 
    monthlySummaries, 
    transactions 
  } = financeData;

  // Calculate net worth growth data
  const growthData = useMemo(() => {
    const currentNetWorth = totalAssetValue + totalAccountBalance;
    const currentDate = new Date();
    const months = card.config.timeRange === '12months' ? 12 : card.config.timeRange === '6months' ? 6 : 24;
    
    // If we have monthly summaries, use those
    if (monthlySummaries && monthlySummaries.length > 0) {
      const summariesWithNetWorth = monthlySummaries
        .filter((summary: any) => summary.netWorth !== undefined)
        .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-months);

      // Add current month if not already included
      const lastSummaryMonth = summariesWithNetWorth[summariesWithNetWorth.length - 1]?.month;
      const currentMonthStr = currentDate.toISOString().substring(0, 7);
      
      if (lastSummaryMonth !== currentMonthStr) {
        summariesWithNetWorth.push({
          month: currentMonthStr,
          netWorth: currentNetWorth,
          totalIncome: totalAssetValue, // Placeholder
          totalSpending: 0 // Placeholder
        });
      }

      const chartData = summariesWithNetWorth.map((summary: any, index: number) => {
        const date = new Date(summary.month + '-01');
        const prevNetWorth = index > 0 ? summariesWithNetWorth[index - 1].netWorth : summary.netWorth;
        const change = summary.netWorth - prevNetWorth;
        const changePercent = prevNetWorth > 0 ? (change / prevNetWorth) * 100 : 0;

        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          netWorth: summary.netWorth,
          change: change,
          changePercent: changePercent,
          date: date
        };
      });

      // Calculate overall growth metrics
      const firstNetWorth = chartData[0]?.netWorth || 0;
      const lastNetWorth = chartData[chartData.length - 1]?.netWorth || 0;
      const totalGrowth = lastNetWorth - firstNetWorth;
      const totalGrowthPercent = firstNetWorth > 0 ? (totalGrowth / firstNetWorth) * 100 : 0;
      const avgMonthlyGrowth = chartData.length > 1 ? totalGrowth / (chartData.length - 1) : 0;

      return {
        chartData,
        currentNetWorth,
        totalGrowth,
        totalGrowthPercent,
        avgMonthlyGrowth,
        hasData: chartData.length > 1,
        dataSource: 'summaries'
      };
    }

    // Fallback: Generate estimated data from transactions
    const monthlyData: any[] = [];
    let runningNetWorth = currentNetWorth;

    // Work backwards from current month
    for (let i = 0; i < months; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);

      // Calculate net worth change for this month based on transactions
      const monthTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return transactionDate.toISOString().substring(0, 7) === monthStr;
      });

      const monthlyChange = monthTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      if (i === 0) {
        // Current month
        runningNetWorth = currentNetWorth;
      } else {
        // Estimate previous months by subtracting transaction changes
        runningNetWorth -= monthlyChange;
      }

      monthlyData.unshift({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        netWorth: Math.max(runningNetWorth, 0),
        change: i === 0 ? 0 : monthlyChange,
        changePercent: 0,
        date: date,
        estimated: i > 0
      });
    }

    // Calculate change percentages
    monthlyData.forEach((data, index) => {
      if (index > 0) {
        const prevNetWorth = monthlyData[index - 1].netWorth;
        data.change = data.netWorth - prevNetWorth;
        data.changePercent = prevNetWorth > 0 ? (data.change / prevNetWorth) * 100 : 0;
      }
    });

    const firstNetWorth = monthlyData[0]?.netWorth || 0;
    const lastNetWorth = monthlyData[monthlyData.length - 1]?.netWorth || 0;
    const totalGrowth = lastNetWorth - firstNetWorth;
    const totalGrowthPercent = firstNetWorth > 0 ? (totalGrowth / firstNetWorth) * 100 : 0;
    const avgMonthlyGrowth = monthlyData.length > 1 ? totalGrowth / (monthlyData.length - 1) : 0;

    return {
      chartData: monthlyData,
      currentNetWorth,
      totalGrowth,
      totalGrowthPercent,
      avgMonthlyGrowth,
      hasData: monthlyData.length > 1,
      dataSource: 'estimated'
    };
  }, [totalAssetValue, totalAccountBalance, monthlySummaries, transactions, card.config.timeRange]);

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">
            €{growthData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current Net Worth</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            {growthData.totalGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-lg font-bold ${
              growthData.totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growthData.totalGrowthPercent >= 0 ? '+' : ''}{growthData.totalGrowthPercent.toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-gray-600">Growth</p>
        </div>
      </div>

      <div className="flex-1">
        {growthData.hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any) => [`€${value.toLocaleString()}`, 'Net Worth']}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                strokeDasharray={growthData.dataSource === 'estimated' ? '5 5' : '0'}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm">Not enough data for growth chart</p>
            </div>
          </div>
        )}
      </div>

      {growthData.dataSource === 'estimated' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          ⚡ Estimated based on transaction history
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xl font-bold text-purple-900">
            €{growthData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-purple-700">Current Net Worth</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className={`text-xl font-bold ${
            growthData.totalGrowth >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {growthData.totalGrowth >= 0 ? '+' : ''}€{growthData.totalGrowth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-700">Total Growth</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className={`text-xl font-bold ${
            growthData.totalGrowthPercent >= 0 ? 'text-blue-900' : 'text-red-900'
          }`}>
            {growthData.totalGrowthPercent >= 0 ? '+' : ''}{growthData.totalGrowthPercent.toFixed(1)}%
          </p>
          <p className="text-sm text-blue-700">Growth Rate</p>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <p className="text-xl font-bold text-indigo-900">
            {growthData.avgMonthlyGrowth >= 0 ? '+' : ''}€{growthData.avgMonthlyGrowth.toLocaleString()}
          </p>
          <p className="text-sm text-indigo-700">Avg Monthly</p>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Net Worth Progression</h4>
          {growthData.dataSource === 'estimated' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Estimated from transactions</span>
            </div>
          )}
        </div>

        {growthData.hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData.chartData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'netWorth') return [`€${value.toLocaleString()}`, 'Net Worth'];
                  if (name === 'change') return [`€${value.toLocaleString()}`, 'Monthly Change'];
                  return [value, name];
                }}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#8B5CF6" 
                strokeWidth={4}
                fill="url(#colorNetWorth)"
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                strokeDasharray={growthData.dataSource === 'estimated' ? '8 4' : '0'}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No growth data available</p>
              <p className="text-sm">Add historical data or monthly summaries to see trends</p>
            </div>
          </div>
        )}
      </div>

      {growthData.hasData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">Best Month</p>
            <p className="text-gray-600">
              {growthData.chartData.reduce((best: any, current: any) => 
                (current.change > (best?.change || -Infinity)) ? current : best, null
              )?.month || 'N/A'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">Trend</p>
            <p className={`font-medium ${
              growthData.totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growthData.totalGrowth >= 0 ? 'Growing' : 'Declining'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">Data Points</p>
            <p className="text-gray-600">{growthData.chartData.length} months</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default NetWorthGrowthCard; 