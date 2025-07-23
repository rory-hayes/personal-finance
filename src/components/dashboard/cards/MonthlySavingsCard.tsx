import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface MonthlySavingsCardProps {
  card: any;
  financeData: any;
}

const MonthlySavingsCard: React.FC<MonthlySavingsCardProps> = ({ card, financeData }) => {
  const { totalIncome, totalSpending, monthlySavings, savingsRate } = financeData;

  // Calculate savings data
  const savingsData = useMemo(() => {
    const currentSavings = totalIncome - totalSpending;
    const currentRate = totalIncome > 0 ? (currentSavings / totalIncome) * 100 : 0;
    
    // Determine savings health
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    let statusColor: string;
    let statusIcon: any;
    
    if (currentRate >= 20) {
      status = 'excellent';
      statusColor = 'text-green-600 bg-green-100';
      statusIcon = TrendingUp;
    } else if (currentRate >= 10) {
      status = 'good';
      statusColor = 'text-blue-600 bg-blue-100';
      statusIcon = Target;
    } else if (currentRate >= 5) {
      status = 'warning';
      statusColor = 'text-yellow-600 bg-yellow-100';
      statusIcon = Wallet;
    } else {
      status = 'critical';
      statusColor = 'text-red-600 bg-red-100';
      statusIcon = TrendingDown;
    }

    const recommendedSavings = totalIncome * 0.2; // 20% recommendation
    const progressToRecommended = recommendedSavings > 0 ? (currentSavings / recommendedSavings) * 100 : 0;

    return {
      currentSavings,
      currentRate,
      status,
      statusColor,
      statusIcon,
      recommendedSavings,
      progressToRecommended: Math.min(progressToRecommended, 100),
      monthlyGoal: recommendedSavings
    };
  }, [totalIncome, totalSpending, monthlySavings, savingsRate]);

  const StatusIcon = savingsData.statusIcon;

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${savingsData.statusColor}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            €{savingsData.currentSavings.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              savingsData.currentRate >= 10 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {savingsData.currentRate.toFixed(1)}% saved
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress to 20% goal</span>
            <span className="font-medium">{savingsData.progressToRecommended.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                savingsData.progressToRecommended >= 100 ? 'bg-green-500' :
                savingsData.progressToRecommended >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${savingsData.progressToRecommended}%` }}
            />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Monthly Goal: €{savingsData.monthlyGoal.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            €{savingsData.currentSavings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Monthly Savings</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${
            savingsData.currentRate >= 10 ? 'text-green-600' : 'text-gray-900'
          }`}>
            {savingsData.currentRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Savings Rate</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <StatusIcon className={`h-5 w-5 ${savingsData.statusColor.split(' ')[0]}`} />
            <p className="text-sm font-medium text-gray-900 capitalize">
              {savingsData.status}
            </p>
          </div>
          <p className="text-sm text-gray-600">Status</p>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="font-medium text-gray-900 mb-4">Savings Breakdown</h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-800">Monthly Income</span>
            <span className="text-sm font-bold text-green-900">+€{totalIncome.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span className="text-sm font-medium text-red-800">Monthly Spending</span>
            <span className="text-sm font-bold text-red-900">-€{totalSpending.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <span className="text-sm font-medium text-blue-800">Net Savings</span>
            <span className="text-sm font-bold text-blue-900">€{savingsData.currentSavings.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to recommended 20%</span>
            <span className="font-medium">{savingsData.progressToRecommended.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                savingsData.progressToRecommended >= 100 ? 'bg-green-500' :
                savingsData.progressToRecommended >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${savingsData.progressToRecommended}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {savingsData.progressToRecommended >= 100 
              ? 'Excellent! You\'re exceeding the recommended savings rate.'
              : `Save €${(savingsData.monthlyGoal - savingsData.currentSavings).toLocaleString()} more to reach 20% goal.`
            }
          </p>
        </div>
      </div>
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : renderDetailedView();
};

export default MonthlySavingsCard; 