import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useFinanceData } from '../../../hooks/useFinanceData';
import { DashboardCard as DashboardCardType } from '../../../types/dashboard';

interface CashFlowCardProps {
  card: DashboardCardType;
}

const CashFlowCard: React.FC<CashFlowCardProps> = ({ card }) => {
  const { totalAccountBalance, totalIncome, totalSpending, accounts, transactions } = useFinanceData();

  // Calculate cash flow forecast
  const cashFlowData = useMemo(() => {
    const monthlyIncome = totalIncome || 0;
    const monthlyExpenses = totalSpending || 0;
    const netCashFlow = monthlyIncome - monthlyExpenses;
    
    const months = card.config.timeRange === '12months' ? 12 : 6;
    const forecastData = [];
    
    const currentDate = new Date();
    let projectedBalance = totalAccountBalance;
    
    for (let i = 0; i <= months; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (i === 0) {
        // Current month
        forecastData.push({
          month: monthName,
          balance: projectedBalance,
          income: monthlyIncome,
          expenses: monthlyExpenses,
          netFlow: netCashFlow,
          isProjected: false
        });
      } else {
        // Add some variance to make it more realistic
        const variance = 1 + (Math.random() - 0.5) * 0.1; // ±5% variance
        const projectedIncome = monthlyIncome * variance;
        const projectedExpenses = monthlyExpenses * variance;
        const projectedNetFlow = projectedIncome - projectedExpenses;
        
        projectedBalance += projectedNetFlow;
        
        forecastData.push({
          month: monthName,
          balance: Math.max(0, projectedBalance), // Don't go negative
          income: projectedIncome,
          expenses: projectedExpenses,
          netFlow: projectedNetFlow,
          isProjected: true
        });
      }
    }
    
    // Calculate insights
    const lowestBalance = Math.min(...forecastData.map(d => d.balance));
    const highestBalance = Math.max(...forecastData.map(d => d.balance));
    const finalBalance = forecastData[forecastData.length - 1].balance;
    const balanceChange = finalBalance - projectedBalance;
    const averageNetFlow = forecastData.reduce((sum, d) => sum + d.netFlow, 0) / forecastData.length;
    
    return {
      forecastData,
      currentBalance: totalAccountBalance,
      projectedFinalBalance: finalBalance,
      balanceChange,
      averageNetFlow,
      lowestBalance,
      highestBalance,
      isPositiveTrend: averageNetFlow > 0,
      riskLevel: lowestBalance < totalAccountBalance * 0.2 ? 'high' : 
                 lowestBalance < totalAccountBalance * 0.5 ? 'medium' : 'low'
    };
  }, [totalAccountBalance, totalIncome, totalSpending, card.config.timeRange]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {cashFlowData.isPositiveTrend ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm font-medium text-gray-600">
            {card.config.timeRange === '12months' ? '12mo' : '6mo'} forecast
          </span>
        </div>
        {cashFlowData.riskLevel === 'high' && (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900">
          €{cashFlowData.projectedFinalBalance.toLocaleString()}
        </p>
        <p className={`text-sm ${cashFlowData.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {cashFlowData.balanceChange >= 0 ? '+' : ''}€{cashFlowData.balanceChange.toLocaleString()} projected
        </p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cashFlowData.forecastData}>
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              strokeWidth={2}
              strokeDasharray={d => d.isProjected ? "5 5" : "0"}
              dot={false}
            />
            <Tooltip 
              labelFormatter={(value) => `${value}`}
              formatter={(value) => [`€${value.toLocaleString()}`, 'Balance']}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="h-full flex flex-col">
      {/* Header with key metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600">Current Balance</p>
          <p className="text-lg font-bold text-gray-900">
            €{cashFlowData.currentBalance.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Projected ({card.config.timeRange === '12months' ? '12mo' : '6mo'})</p>
          <p className="text-lg font-bold text-gray-900">
            €{cashFlowData.projectedFinalBalance.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Net Change</p>
          <p className={`text-lg font-bold ${cashFlowData.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashFlowData.balanceChange >= 0 ? '+' : ''}€{cashFlowData.balanceChange.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashFlowData.forecastData}>
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
              labelFormatter={(label) => `${label}`}
              formatter={(value, name) => [
                `€${value.toLocaleString()}`,
                name === 'balance' ? 'Balance' : 
                name === 'income' ? 'Income' : 'Expenses'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-3">Cash Flow Insights</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Average Monthly Flow</p>
            <p className={`font-medium ${cashFlowData.averageNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashFlowData.averageNetFlow >= 0 ? '+' : ''}€{cashFlowData.averageNetFlow.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Risk Level</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                cashFlowData.riskLevel === 'high' ? 'bg-red-500' :
                cashFlowData.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className="font-medium capitalize">{cashFlowData.riskLevel}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Lowest Projected</p>
            <p className="font-medium">€{cashFlowData.lowestBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Highest Projected</p>
            <p className="font-medium">€{cashFlowData.highestBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {card.size === 'quarter' ? renderQuarterView() : renderDetailedView()}
    </>
  );
};

export default CashFlowCard; 