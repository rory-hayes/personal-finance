import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface CashFlowForecastCardProps {
  card: any;
  financeData: any;
}

const CashFlowForecastCard: React.FC<CashFlowForecastCardProps> = ({ card, financeData }) => {
  const { 
    totalIncome, 
    totalSpending, 
    totalAccountBalance, 
    transactions, 
    vestingSchedules, 
    goals 
  } = financeData;

  // Calculate cash flow forecast
  const forecastData = useMemo(() => {
    const currentDate = new Date();
    const forecastMonths = card.config.timeRange === '12months' ? 12 : 6;
    const projections: any[] = [];

    // Calculate current monthly patterns
    const monthlyIncome = totalIncome || 0;
    const monthlySpending = totalSpending || 0;
    const netMonthlyCashFlow = monthlyIncome - monthlySpending;

    // Get recurring transactions pattern
    const recurringIncome = transactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0) / Math.max(transactions.filter((t: any) => t.amount > 0).length / 12, 1); // Rough monthly average

    const recurringExpenses = transactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / Math.max(transactions.filter((t: any) => t.amount < 0).length / 12, 1); // Rough monthly average

    let runningBalance = totalAccountBalance;

    for (let i = 0; i < forecastMonths; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      
      // Base income and expenses
      let monthlyProjectedIncome = monthlyIncome;
      let monthlyProjectedExpenses = monthlySpending;
      
      // Add vesting income
      let vestingIncome = 0;
      if (vestingSchedules && vestingSchedules.length > 0) {
        vestingSchedules.forEach((schedule: any) => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          
          if (forecastDate >= startDate && forecastDate <= endDate) {
            vestingIncome += schedule.monthlyAmount;
            
            // Add cliff payments
            if (schedule.cliffAmount && schedule.cliffPeriod) {
              const cliffDate = new Date(startDate);
              cliffDate.setMonth(cliffDate.getMonth() + schedule.cliffPeriod);
              
              if (forecastDate.getMonth() === cliffDate.getMonth() && 
                  forecastDate.getFullYear() === cliffDate.getFullYear()) {
                vestingIncome += schedule.cliffAmount;
              }
            }
          }
        });
      }
      
      // Add goal savings (as planned outflows)
      let goalSavings = 0;
      if (goals && goals.length > 0) {
        goals.forEach((goal: any) => {
          const targetDate = new Date(goal.targetDate);
          const remaining = goal.targetAmount - goal.currentAmount;
          
          if (remaining > 0 && forecastDate <= targetDate) {
            const monthsRemaining = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            if (monthsRemaining > 0) {
              goalSavings += remaining / monthsRemaining;
            }
          }
        });
      }

      const totalIncome = monthlyProjectedIncome + vestingIncome;
      const totalExpenses = monthlyProjectedExpenses + goalSavings;
      const netCashFlow = totalIncome - totalExpenses;
      
      runningBalance += netCashFlow;

      projections.push({
        month: forecastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: forecastDate,
        balance: Math.max(runningBalance, 0), // Don't go negative for display
        income: totalIncome,
        expenses: totalExpenses,
        netCashFlow: netCashFlow,
        vestingIncome: vestingIncome,
        goalSavings: goalSavings,
        isNegative: runningBalance < 0
      });
    }

    // Calculate trends
    const finalBalance = projections[projections.length - 1]?.balance || 0;
    const balanceChange = finalBalance - totalAccountBalance;
    const avgMonthlyCashFlow = projections.reduce((sum, p) => sum + p.netCashFlow, 0) / projections.length;
    
    // Risk assessment
    const negativeMonths = projections.filter(p => p.isNegative).length;
    const riskLevel = negativeMonths > forecastMonths / 2 ? 'high' : 
                     negativeMonths > 0 ? 'medium' : 'low';

    return {
      projections,
      balanceChange,
      avgMonthlyCashFlow,
      finalBalance,
      riskLevel,
      negativeMonths,
      forecastMonths
    };
  }, [totalIncome, totalSpending, totalAccountBalance, transactions, vestingSchedules, goals, card.config.timeRange]);

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">
            €{forecastData.finalBalance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Projected Balance</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            {forecastData.balanceChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-lg font-bold ${
              forecastData.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {forecastData.balanceChange >= 0 ? '+' : ''}€{forecastData.balanceChange.toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {forecastData.forecastMonths}-Month Change
          </p>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData.projections}>
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
              formatter={(value: any) => [`€${value.toLocaleString()}`, 'Balance']}
              labelStyle={{ color: '#374151' }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {forecastData.riskLevel !== 'low' && (
        <div className={`mt-3 p-2 rounded-lg text-sm ${
          forecastData.riskLevel === 'high' 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          {forecastData.riskLevel === 'high' 
            ? `⚠️ High risk: ${forecastData.negativeMonths} months projected negative`
            : `⚡ Caution: ${forecastData.negativeMonths} months may be tight`
          }
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-900">
            €{forecastData.finalBalance.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">Projected Balance</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className={`text-xl font-bold ${
            forecastData.balanceChange >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            {forecastData.balanceChange >= 0 ? '+' : ''}€{forecastData.balanceChange.toLocaleString()}
          </p>
          <p className="text-sm text-gray-700">Net Change</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xl font-bold text-purple-900">
            €{forecastData.avgMonthlyCashFlow.toLocaleString()}
          </p>
          <p className="text-sm text-purple-700">Avg Monthly Flow</p>
        </div>
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            forecastData.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
            forecastData.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {forecastData.riskLevel === 'low' ? '✅' : 
             forecastData.riskLevel === 'medium' ? '⚡' : '⚠️'}
            {forecastData.riskLevel} risk
          </div>
          <p className="text-sm text-gray-700 mt-1">Risk Level</p>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-4">
          Cash Flow Projection ({forecastData.forecastMonths} Months)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData.projections}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
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
                const labels: any = {
                  balance: 'Balance',
                  income: 'Total Income',
                  expenses: 'Total Expenses'
                };
                return [`€${value.toLocaleString()}`, labels[name] || name];
              }}
              labelStyle={{ color: '#374151' }}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {forecastData.riskLevel !== 'low' && (
        <div className={`mt-4 p-4 rounded-lg ${
          forecastData.riskLevel === 'high' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              forecastData.riskLevel === 'high' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {forecastData.riskLevel === 'high' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Calendar className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                forecastData.riskLevel === 'high' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {forecastData.riskLevel === 'high' 
                  ? 'Cash Flow Warning' 
                  : 'Cash Flow Advisory'
                }
              </p>
              <p className={`text-sm mt-1 ${
                forecastData.riskLevel === 'high' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {forecastData.riskLevel === 'high' 
                  ? `Your projected balance will go negative in ${forecastData.negativeMonths} of the next ${forecastData.forecastMonths} months. Consider reducing expenses or increasing income.`
                  : `Some months may have tight cash flow. Monitor your spending and consider building a larger emergency fund.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default CashFlowForecastCard; 