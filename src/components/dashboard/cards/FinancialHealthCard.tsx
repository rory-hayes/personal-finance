import React, { useMemo } from 'react';
import { Activity, TrendingUp, Shield, Target, AlertTriangle } from 'lucide-react';

interface FinancialHealthCardProps {
  card: any;
  financeData: any;
}

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ card, financeData }) => {
  const { 
    totalIncome, 
    totalSpending, 
    totalAccountBalance, 
    totalAssetValue, 
    goals,
    transactions 
  } = financeData;

  // Calculate financial health score
  const healthData = useMemo(() => {
    let totalScore = 0;
    const metrics: any[] = [];

    // 1. Savings Rate (25 points max)
    const currentSavings = totalIncome - totalSpending;
    const savingsRate = totalIncome > 0 ? (currentSavings / totalIncome) * 100 : 0;
    let savingsScore = 0;
    if (savingsRate >= 20) savingsScore = 25;
    else if (savingsRate >= 15) savingsScore = 20;
    else if (savingsRate >= 10) savingsScore = 15;
    else if (savingsRate >= 5) savingsScore = 10;
    else if (savingsRate >= 0) savingsScore = 5;
    
    metrics.push({
      name: 'Savings Rate',
      score: savingsScore,
      maxScore: 25,
      value: `${savingsRate.toFixed(1)}%`,
      status: savingsScore >= 20 ? 'excellent' : savingsScore >= 15 ? 'good' : savingsScore >= 10 ? 'fair' : 'poor',
      description: savingsRate >= 20 ? 'Excellent savings rate!' : 
                  savingsRate >= 10 ? 'Good savings habit' : 'Consider increasing savings'
    });
    totalScore += savingsScore;

    // 2. Emergency Fund (20 points max)
    const liquidAssets = totalAccountBalance; // Assuming accounts are liquid
    const monthlyExpenses = totalSpending;
    const emergencyMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
    let emergencyScore = 0;
    if (emergencyMonths >= 6) emergencyScore = 20;
    else if (emergencyMonths >= 3) emergencyScore = 15;
    else if (emergencyMonths >= 1) emergencyScore = 10;
    else if (emergencyMonths >= 0.5) emergencyScore = 5;
    
    metrics.push({
      name: 'Emergency Fund',
      score: emergencyScore,
      maxScore: 20,
      value: `${emergencyMonths.toFixed(1)} months`,
      status: emergencyScore >= 15 ? 'excellent' : emergencyScore >= 10 ? 'good' : emergencyScore >= 5 ? 'fair' : 'poor',
      description: emergencyMonths >= 6 ? 'Excellent emergency coverage' : 
                  emergencyMonths >= 3 ? 'Good emergency fund' : 'Build emergency fund'
    });
    totalScore += emergencyScore;

    // 3. Net Worth Growth (20 points max) - Simplified based on income ratio
    const netWorth = totalAccountBalance + totalAssetValue;
    const netWorthToIncomeRatio = totalIncome > 0 ? (netWorth / (totalIncome * 12)) : 0; // Annual income
    let netWorthScore = 0;
    if (netWorthToIncomeRatio >= 2) netWorthScore = 20;
    else if (netWorthToIncomeRatio >= 1) netWorthScore = 15;
    else if (netWorthToIncomeRatio >= 0.5) netWorthScore = 10;
    else if (netWorthToIncomeRatio >= 0.1) netWorthScore = 5;
    
    metrics.push({
      name: 'Net Worth',
      score: netWorthScore,
      maxScore: 20,
      value: `€${netWorth.toLocaleString()}`,
      status: netWorthScore >= 15 ? 'excellent' : netWorthScore >= 10 ? 'good' : netWorthScore >= 5 ? 'fair' : 'poor',
      description: netWorthToIncomeRatio >= 1 ? 'Strong net worth position' : 
                  netWorthToIncomeRatio >= 0.5 ? 'Building wealth steadily' : 'Focus on wealth building'
    });
    totalScore += netWorthScore;

    // 4. Goal Progress (15 points max)
    let goalScore = 0;
    if (goals.length > 0) {
      const avgProgress = goals.reduce((sum: number, goal: any) => {
        return sum + Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      }, 0) / goals.length;
      
      if (avgProgress >= 80) goalScore = 15;
      else if (avgProgress >= 60) goalScore = 12;
      else if (avgProgress >= 40) goalScore = 9;
      else if (avgProgress >= 20) goalScore = 6;
      else if (avgProgress > 0) goalScore = 3;
      
      metrics.push({
        name: 'Goal Progress',
        score: goalScore,
        maxScore: 15,
        value: `${avgProgress.toFixed(0)}%`,
        status: goalScore >= 12 ? 'excellent' : goalScore >= 9 ? 'good' : goalScore >= 6 ? 'fair' : 'poor',
        description: avgProgress >= 60 ? 'Great goal progress!' : 
                    avgProgress >= 20 ? 'Making steady progress' : 'Focus on goal achievement'
      });
    } else {
      metrics.push({
        name: 'Goal Progress',
        score: 0,
        maxScore: 15,
        value: 'No goals set',
        status: 'poor',
        description: 'Set financial goals to improve score'
      });
    }
    totalScore += goalScore;

    // 5. Spending Control (20 points max) - Based on spending consistency
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

    const spendingChange = lastMonthSpending > 0 ? 
      Math.abs((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0;
    
    let spendingScore = 0;
    if (spendingChange <= 5) spendingScore = 20; // Very consistent
    else if (spendingChange <= 10) spendingScore = 15; // Consistent
    else if (spendingChange <= 20) spendingScore = 10; // Moderate variance
    else if (spendingChange <= 30) spendingScore = 5; // High variance
    
    metrics.push({
      name: 'Spending Control',
      score: spendingScore,
      maxScore: 20,
      value: `${spendingChange.toFixed(1)}% variance`,
      status: spendingScore >= 15 ? 'excellent' : spendingScore >= 10 ? 'good' : spendingScore >= 5 ? 'fair' : 'poor',
      description: spendingChange <= 10 ? 'Excellent spending consistency' : 
                  spendingChange <= 20 ? 'Good spending control' : 'Work on spending consistency'
    });
    totalScore += spendingScore;

    // Overall health status
    let overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
    let statusColor: string;
    let statusIcon: any;
    
    if (totalScore >= 80) {
      overallStatus = 'excellent';
      statusColor = 'text-green-600 bg-green-100';
      statusIcon = TrendingUp;
    } else if (totalScore >= 65) {
      overallStatus = 'good';
      statusColor = 'text-blue-600 bg-blue-100';
      statusIcon = Activity;
    } else if (totalScore >= 45) {
      overallStatus = 'fair';
      statusColor = 'text-yellow-600 bg-yellow-100';
      statusIcon = Shield;
    } else {
      overallStatus = 'poor';
      statusColor = 'text-red-600 bg-red-100';
      statusIcon = AlertTriangle;
    }

    return {
      totalScore,
      overallStatus,
      statusColor,
      statusIcon,
      metrics: metrics.sort((a, b) => b.score - a.score)
    };
  }, [totalIncome, totalSpending, totalAccountBalance, totalAssetValue, goals, transactions]);

  const StatusIcon = healthData.statusIcon;

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${healthData.statusColor}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            {healthData.totalScore}/100
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium capitalize ${healthData.statusColor.split(' ')[0]}`}>
              {healthData.overallStatus}
            </span>
            <span className="text-sm text-gray-500">health</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                healthData.totalScore >= 80 ? 'bg-green-500' :
                healthData.totalScore >= 65 ? 'bg-blue-500' :
                healthData.totalScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthData.totalScore}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          {healthData.metrics.slice(0, 3).map((metric: any) => (
            <div key={metric.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{metric.name}</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {metric.score}/{metric.maxScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-3 p-4 rounded-xl ${healthData.statusColor}`}>
          <StatusIcon className="h-8 w-8" />
          <div>
            <p className="text-3xl font-bold">
              {healthData.totalScore}/100
            </p>
            <p className="text-lg capitalize font-medium">
              {healthData.overallStatus} Health
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-300 ${
              healthData.totalScore >= 80 ? 'bg-green-500' :
              healthData.totalScore >= 65 ? 'bg-blue-500' :
              healthData.totalScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthData.totalScore}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h4 className="font-medium text-gray-900 mb-4">Health Breakdown</h4>
        <div className="space-y-4">
          {healthData.metrics.map((metric: any) => (
            <div key={metric.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{metric.name}</h5>
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    {metric.score}/{metric.maxScore}
                  </span>
                  <p className="text-sm text-gray-600">{metric.value}</p>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.status === 'excellent' ? 'bg-green-500' :
                      metric.status === 'good' ? 'bg-blue-500' :
                      metric.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span className="capitalize">{metric.status}</span>
                <span>{((metric.score / metric.maxScore) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : renderDetailedView();
};

export default FinancialHealthCard; 