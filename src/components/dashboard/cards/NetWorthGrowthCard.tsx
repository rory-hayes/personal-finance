import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, DollarSign } from 'lucide-react';

interface NetWorthGrowthCardProps {
  card: any;
  financeData: any;
}

const NetWorthGrowthCard: React.FC<NetWorthGrowthCardProps> = ({ card, financeData }) => {
  const { 
    totalAssetValue, 
    totalAccountBalance, 
    monthlySummaries, 
    transactions,
    totalIncome,
    totalSpending,
    goals
  } = financeData;

  // Calculate comprehensive net worth growth data
  const growthData = useMemo(() => {
    const currentNetWorth = totalAssetValue + totalAccountBalance;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate historical data (past 24 months)
    const historicalData = [];
    const futureData = [];
    
    // Calculate monthly income/spending trends for forecasting
    const monthlySavings = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? monthlySavings / totalIncome : 0;
    
    // Historical data generation (24 months back)
    for (let i = 23; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      
      // Try to use actual data from monthlySummaries if available
      const actualSummary = monthlySummaries?.find((s: any) => s.month === monthKey);
      
      let netWorth;
      if (actualSummary?.netWorth !== undefined) {
        netWorth = actualSummary.netWorth;
      } else {
        // Estimate based on savings trend
        const monthsFromCurrent = i;
        const estimatedSavingsContribution = monthsFromCurrent * monthlySavings * 0.8; // Conservative estimate
        netWorth = Math.max(currentNetWorth - estimatedSavingsContribution, currentNetWorth * 0.3);
      }
      
      historicalData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fullDate: date,
        netWorth: netWorth,
        isActual: !!actualSummary,
        isProjected: false,
        isCurrent: i === 0
      });
    }
    
    // Calculate growth trends from historical data
    const recentMonths = historicalData.slice(-6);
    const avgMonthlyGrowth = recentMonths.length > 1 ? 
      (recentMonths[recentMonths.length - 1].netWorth - recentMonths[0].netWorth) / (recentMonths.length - 1) : 
      monthlySavings;
    
    // Generate future projections (next 12 months)
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      
      // Conservative projection with some variance
      const baseGrowth = avgMonthlyGrowth * 0.9; // Slightly conservative
      const variance = 1 + (Math.sin(i / 3) * 0.1); // Add some seasonal variance
      const projectedGrowth = baseGrowth * variance;
      
      const projectedNetWorth = currentNetWorth + (projectedGrowth * i);
      
      futureData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fullDate: date,
        netWorth: Math.max(projectedNetWorth, currentNetWorth),
        isActual: false,
        isProjected: true,
        isCurrent: false
      });
    }
    
    // Combine historical and future data
    const allData = [...historicalData, ...futureData];
    
    // Calculate key metrics
    const oneYearAgo = allData[allData.length - 13] || allData[0];
    const yearOverYearGrowth = oneYearAgo ? 
      ((currentNetWorth - oneYearAgo.netWorth) / oneYearAgo.netWorth) * 100 : 0;
    
    const threeMonthsAgo = allData[allData.length - 4] || allData[0];
    const quarterGrowth = threeMonthsAgo ? 
      ((currentNetWorth - threeMonthsAgo.netWorth) / threeMonthsAgo.netWorth) * 100 : 0;
    
    const oneYearProjection = futureData[11]?.netWorth || currentNetWorth;
    const projectedYearGrowth = ((oneYearProjection - currentNetWorth) / currentNetWorth) * 100;
    
    // Find relevant financial goals
    const netWorthGoals = goals?.filter((g: any) => 
      g.name.toLowerCase().includes('net worth') || 
      g.name.toLowerCase().includes('wealth') ||
      g.targetAmount > currentNetWorth * 0.5 // Likely wealth goals
    ) || [];
    
    return {
      chartData: allData,
      currentNetWorth,
      avgMonthlyGrowth,
      yearOverYearGrowth,
      quarterGrowth,
      projectedYearGrowth,
      oneYearProjection,
      netWorthGoals: netWorthGoals.slice(0, 2), // Top 2 relevant goals
      hasHistoricalData: historicalData.some(d => d.isActual),
      trend: avgMonthlyGrowth > 0 ? 'positive' : avgMonthlyGrowth < 0 ? 'negative' : 'stable'
    };
  }, [totalAssetValue, totalAccountBalance, monthlySummaries, totalIncome, totalSpending, goals]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-lg font-bold text-purple-900">
            €{growthData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-xs text-purple-700">Current Net Worth</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            {growthData.yearOverYearGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <p className={`text-lg font-bold ${
              growthData.yearOverYearGrowth >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {growthData.yearOverYearGrowth >= 0 ? '+' : ''}{growthData.yearOverYearGrowth.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-green-700">Year Growth</p>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span className="text-xs text-gray-600">Monthly Trend</span>
          <span className={`text-xs font-medium ${
            growthData.avgMonthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            €{Math.abs(growthData.avgMonthlyGrowth).toLocaleString()}/mo
          </span>
        </div>
        
        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span className="text-xs text-gray-600">1-Year Projection</span>
          <span className="text-xs font-medium text-blue-600">
            €{growthData.oneYearProjection.toLocaleString()}
          </span>
        </div>

        {growthData.netWorthGoals.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Goals Progress</p>
            {growthData.netWorthGoals.map((goal: any) => {
              const progress = (growthData.currentNetWorth / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="mb-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{goal.name}</span>
                    <span className="text-gray-600">{Math.min(progress, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">
            €{growthData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            {growthData.yearOverYearGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-lg font-bold ${
              growthData.yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growthData.yearOverYearGrowth >= 0 ? '+' : ''}{growthData.yearOverYearGrowth.toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-gray-600">YoY Growth</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">
            €{growthData.oneYearProjection.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">1-Year Target</p>
        </div>
      </div>

      <div className="flex-1">
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
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <ReferenceLine 
              x={new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              stroke="#6b7280" 
              strokeDasharray="2 2"
              label={{ value: "Today", position: "top" }}
            />
            <Line 
              type="monotone" 
              dataKey="netWorth" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-900">
            €{growthData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-purple-700">Current Net Worth</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">
            {growthData.yearOverYearGrowth >= 0 ? '+' : ''}{growthData.yearOverYearGrowth.toFixed(1)}%
          </p>
          <p className="text-sm text-green-700">Year-over-Year</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">
            €{growthData.oneYearProjection.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">1-Year Projection</p>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <Calendar className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-indigo-900">
            {growthData.projectedYearGrowth >= 0 ? '+' : ''}{growthData.projectedYearGrowth.toFixed(1)}%
          </p>
          <p className="text-sm text-indigo-700">Projected Growth</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Chart Section */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">Net Worth Growth & Projections (24 Month View)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData.chartData}>
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
                formatter={(value: any, name: string, props: any) => {
                  const isProjected = props.payload.isProjected;
                  const label = isProjected ? 'Projected Net Worth' : 'Net Worth';
                  return [`€${value.toLocaleString()}`, label];
                }}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
                             <ReferenceLine 
                 x={new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                 stroke="#6b7280" 
                 strokeDasharray="2 2"
                 label={{ value: "Today", position: "top" }}
               />
                             <Line 
                 type="monotone" 
                 dataKey="netWorth" 
                 stroke="#8B5CF6" 
                 strokeWidth={3}
                 dot={false}
                 connectNulls={false}
               />
              {/* Goal reference lines */}
              {growthData.netWorthGoals.slice(0, 1).map((goal: any) => (
                                 <ReferenceLine 
                   key={goal.id}
                   y={goal.targetAmount}
                   stroke="#10B981" 
                   strokeDasharray="5 5"
                   label={{ value: `Goal: €${goal.targetAmount.toLocaleString()}`, position: "top" }}
                 />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights Section */}
        <div className="w-80 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Growth Insights</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    growthData.trend === 'positive' ? 'bg-green-500' : 
                    growthData.trend === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {growthData.trend === 'positive' ? 'Positive Trend' : 
                     growthData.trend === 'negative' ? 'Declining Trend' : 'Stable'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Monthly average: €{Math.abs(growthData.avgMonthlyGrowth).toLocaleString()}
                  {growthData.avgMonthlyGrowth >= 0 ? ' growth' : ' decline'}
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Quarter Performance</p>
                <p className="text-xs text-blue-700">
                  {growthData.quarterGrowth >= 0 ? '+' : ''}{growthData.quarterGrowth.toFixed(1)}% 
                  growth in last 3 months
                </p>
              </div>

              {growthData.hasHistoricalData ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Data Quality</p>
                  <p className="text-xs text-green-700">Using actual historical data for accurate projections</p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Estimated Data</p>
                  <p className="text-xs text-yellow-700">Projections based on current trends</p>
                </div>
              )}
            </div>
          </div>

          {growthData.netWorthGoals.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Goal Progress</h4>
              <div className="space-y-3">
                {growthData.netWorthGoals.map((goal: any) => {
                  const progress = (growthData.currentNetWorth / goal.targetAmount) * 100;
                  const timeToGoal = goal.targetDate ? new Date(goal.targetDate) : null;
                  const monthsToGoal = timeToGoal ? 
                    Math.max(0, Math.ceil((timeToGoal.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))) : 
                    null;
                  
                  return (
                    <div key={goal.id} className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-purple-900 truncate pr-2">
                          {goal.name}
                        </span>
                        <span className="text-xs text-purple-700">
                          {Math.min(progress, 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                        <div 
                          className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-purple-700">
                        <p>Target: €{goal.targetAmount.toLocaleString()}</p>
                        {monthsToGoal && (
                          <p>
                            {monthsToGoal > 0 ? `${monthsToGoal} months remaining` : 'Overdue'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on card size
  switch (card.size) {
    case 'quarter':
      return renderQuarterView();
    case 'half':
      return renderHalfView();
    case 'full':
    case 'tall':
      return renderFullView();
    default:
      return renderHalfView();
  }
};

export default NetWorthGrowthCard; 