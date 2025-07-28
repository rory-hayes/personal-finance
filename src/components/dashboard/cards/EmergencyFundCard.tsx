import React, { useMemo } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { DashboardCard as DashboardCardType } from '../../../types/dashboard';

interface EmergencyFundCardProps {
  card: DashboardCardType;
  financeData: any;
}

const EmergencyFundCard: React.FC<EmergencyFundCardProps> = ({ card, financeData }) => {
  const { totalAccountBalance, totalSpending, accounts } = financeData;

  // Calculate emergency fund metrics
  const emergencyFundData = useMemo(() => {
    const monthlyExpenses = totalSpending || 0;
    const currentEmergencyFund = accounts.find((account: any) => 
      account.name.toLowerCase().includes('emergency') || 
      account.name.toLowerCase().includes('savings')
    )?.balance || totalAccountBalance * 0.3; // Estimate if no dedicated emergency fund

    const threeMonthTarget = monthlyExpenses * 3;
    const sixMonthTarget = monthlyExpenses * 6;
    const recommendedTarget = sixMonthTarget; // We recommend 6 months

    const progressToThreeMonths = monthlyExpenses > 0 ? (currentEmergencyFund / threeMonthTarget) * 100 : 0;
    const progressToSixMonths = monthlyExpenses > 0 ? (currentEmergencyFund / sixMonthTarget) * 100 : 0;

    let status: 'critical' | 'low' | 'good' | 'excellent';
    let statusText: string;
    let statusIcon: any;
    let statusColor: string;

    if (progressToThreeMonths < 50) {
      status = 'critical';
      statusText = 'Build emergency fund';
      statusIcon = AlertTriangle;
      statusColor = 'text-red-600 bg-red-100';
    } else if (progressToThreeMonths < 100) {
      status = 'low';
      statusText = 'Almost there';
      statusIcon = TrendingUp;
      statusColor = 'text-yellow-600 bg-yellow-100';
    } else if (progressToSixMonths < 100) {
      status = 'good';
      statusText = '3+ months covered';
      statusIcon = Shield;
      statusColor = 'text-blue-600 bg-blue-100';
    } else {
      status = 'excellent';
      statusText = '6+ months covered';
      statusIcon = CheckCircle;
      statusColor = 'text-green-600 bg-green-100';
    }

    return {
      currentAmount: currentEmergencyFund,
      threeMonthTarget,
      sixMonthTarget,
      recommendedTarget,
      monthlyExpenses,
      progressToThreeMonths: Math.min(progressToThreeMonths, 100),
      progressToSixMonths: Math.min(progressToSixMonths, 100),
      status,
      statusText,
      statusIcon,
      statusColor,
      monthsOfExpenses: monthlyExpenses > 0 ? currentEmergencyFund / monthlyExpenses : 0
    };
  }, [totalAccountBalance, totalSpending, accounts]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${emergencyFundData.statusColor}`}>
          <emergencyFundData.statusIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {emergencyFundData.monthsOfExpenses.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">months covered</p>
        </div>
      </div>
      <div className="flex-1">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${emergencyFundData.progressToSixMonths}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{emergencyFundData.statusText}</p>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="h-full flex flex-col">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${emergencyFundData.statusColor}`}>
            <emergencyFundData.statusIcon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">
              €{emergencyFundData.currentAmount.toLocaleString()}
            </h4>
            <p className="text-sm text-gray-600">{emergencyFundData.statusText}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {emergencyFundData.monthsOfExpenses.toFixed(1)} months
          </p>
          <p className="text-sm text-gray-500">of expenses covered</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">3 months target</span>
            <span className="font-medium">€{emergencyFundData.threeMonthTarget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${emergencyFundData.progressToThreeMonths}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {emergencyFundData.progressToThreeMonths.toFixed(1)}% complete
          </p>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700">6 months target (recommended)</span>
            <span className="font-medium">€{emergencyFundData.sixMonthTarget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${emergencyFundData.progressToSixMonths}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {emergencyFundData.progressToSixMonths.toFixed(1)}% complete
          </p>
        </div>
      </div>

      {/* Recommendations and Actions */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-2">Recommendations:</h5>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {emergencyFundData.monthsOfExpenses < 3 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Priority: Build emergency fund to €{emergencyFundData.threeMonthTarget.toLocaleString()}</span>
            </div>
          )}
          {emergencyFundData.monthsOfExpenses >= 3 && emergencyFundData.monthsOfExpenses < 6 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Good progress! Aim for €{emergencyFundData.sixMonthTarget.toLocaleString()}</span>
            </div>
          )}
          {emergencyFundData.monthsOfExpenses >= 6 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Excellent! Your emergency fund is well-funded</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {emergencyFundData.monthsOfExpenses < 6 && (
          <button
            onClick={() => {
              // Navigate to Household tab to set up emergency fund account
              const event = new CustomEvent('navigateToHousehold', { 
                detail: { action: 'addAccount', accountType: 'emergency' } 
              });
              window.dispatchEvent(event);
            }}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Build Emergency Fund
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {card.size === 'quarter' ? renderQuarterView() : renderDetailedView()}
    </>
  );
};

export default EmergencyFundCard; 