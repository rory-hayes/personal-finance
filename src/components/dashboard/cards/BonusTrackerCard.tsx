import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Calendar, Target, BarChart3, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BonusTrackerCardProps {
  card: any;
  financeData: any;
}

const BonusTrackerCard: React.FC<BonusTrackerCardProps> = ({ card, financeData }) => {
  const { transactions, vestingSchedules } = financeData;

  // Analyze transactions and vesting to identify variable income
  const bonusData = useMemo(() => {
    if (!transactions?.length) return { bonuses: [], totalYTD: 0, avgMonthly: 0, forecast: [] };

    // Patterns for identifying bonus/variable income
    const bonusPatterns = [
      /bonus/i, /commission/i, /incentive/i, /award/i, /prize/i,
      /dividend/i, /royalty/i, /freelance/i, /consulting/i, /contract/i,
      /performance/i, /quarterly/i, /annual/i, /overtime/i
    ];

    const currentYear = new Date().getFullYear();
    const currentDate = new Date();

    // Filter positive transactions that look like variable income
    const variableIncomeTransactions = transactions.filter((transaction: any) => 
      transaction.amount > 0 && (
        bonusPatterns.some(pattern => pattern.test(transaction.description)) ||
        (transaction.amount > 1000 && transaction.category === 'Income') // Large irregular income
      )
    );

    // Process bonus transactions
    const bonuses = variableIncomeTransactions.map((transaction: any) => {
      const date = new Date(transaction.date);
      let type = 'Other';
      
      if (/bonus/i.test(transaction.description)) type = 'Bonus';
      else if (/commission/i.test(transaction.description)) type = 'Commission';
      else if (/dividend/i.test(transaction.description)) type = 'Dividend';
      else if (/freelance|consulting/i.test(transaction.description)) type = 'Freelance';
      else if (/vesting|equity/i.test(transaction.description)) type = 'Equity';
      else if (/overtime/i.test(transaction.description)) type = 'Overtime';

      return {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        quarter: Math.floor(date.getMonth() / 3) + 1,
        isCurrentYear: date.getFullYear() === currentYear
      };
    });

    // Add vesting schedules as expected bonuses
    const vestingBonuses = vestingSchedules?.filter((schedule: any) => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      return currentDate >= startDate && currentDate <= endDate;
    }).map((schedule: any) => ({
      id: `vesting-${schedule.id}`,
      description: schedule.description || 'Equity Vesting',
      amount: schedule.monthlyAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'Vesting',
      month: currentDate.getMonth() + 1,
      year: currentYear,
      quarter: Math.floor(currentDate.getMonth() / 3) + 1,
      isCurrentYear: true,
      isRecurring: true
    })) || [];

    const allBonuses = [...bonuses, ...vestingBonuses];

    // Calculate YTD total
    const totalYTD = allBonuses
      .filter(bonus => bonus.isCurrentYear)
      .reduce((sum, bonus) => sum + bonus.amount, 0);

    // Calculate average monthly (based on historical data)
    const historicalBonuses = bonuses.filter(bonus => bonus.year < currentYear);
    const avgMonthly = historicalBonuses.length > 0 ? 
      historicalBonuses.reduce((sum, bonus) => sum + bonus.amount, 0) / 12 : 0;

    // Create monthly trend data
    const monthlyTrend = [];
    for (let month = 1; month <= 12; month++) {
      const monthBonuses = allBonuses.filter(bonus => 
        bonus.month === month && bonus.isCurrentYear
      );
      const monthTotal = monthBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      
      const monthName = new Date(2024, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      monthlyTrend.push({
        month: monthName,
        monthNumber: month,
        amount: monthTotal,
        count: monthBonuses.length,
        isPast: month <= currentDate.getMonth() + 1
      });
    }

    // Forecast remaining year based on patterns
    const forecast = [];
    const remainingMonths = 12 - (currentDate.getMonth() + 1);
    const avgBonusPerMonth = totalYTD / (currentDate.getMonth() + 1) || avgMonthly / 12;
    
    for (let i = 1; i <= remainingMonths; i++) {
      const forecastMonth = currentDate.getMonth() + 1 + i;
      const forecastDate = new Date(currentYear, forecastMonth - 1, 1);
      const monthName = forecastDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Add expected vesting
      const expectedVesting = vestingSchedules?.filter((schedule: any) => {
        const scheduleDate = new Date(schedule.startDate);
        return scheduleDate.getMonth() + 1 === forecastMonth;
      }).reduce((sum: number, schedule: any) => sum + schedule.monthlyAmount, 0) || 0;

      forecast.push({
        month: monthName,
        expectedAmount: avgBonusPerMonth + expectedVesting,
        vestingAmount: expectedVesting,
        isProjected: true
      });
    }

    return { 
      bonuses: allBonuses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalYTD, 
      avgMonthly, 
      monthlyTrend,
      forecast
    };
  }, [transactions, vestingSchedules]);

  // Group bonuses by type for analysis
  const bonusByType = useMemo(() => {
    const types = bonusData.bonuses.reduce((acc: Record<string, any>, bonus: any) => {
      if (!acc[bonus.type]) {
        acc[bonus.type] = { type: bonus.type, total: 0, count: 0, items: [] };
      }
      acc[bonus.type].total += bonus.amount;
      acc[bonus.type].count += 1;
      acc[bonus.type].items.push(bonus);
      return acc;
    }, {});

    return Object.values(types).sort((a: any, b: any) => b.total - a.total);
  }, [bonusData.bonuses]);

  if (!bonusData.bonuses.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Star className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Variable Income Found</h3>
        <p className="text-sm text-center">No bonuses, commissions, or irregular income detected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Bonus Tracker</h3>
        </div>
        <div className="text-sm text-gray-600">
          {bonusData.bonuses.length} Income Events
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">YTD Total</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            €{bonusData.totalYTD.toLocaleString()}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Avg Monthly</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            €{Math.round(bonusData.avgMonthly / 12).toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-800">This Month</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            €{bonusData.monthlyTrend[new Date().getMonth()]?.amount.toLocaleString() || '0'}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Monthly Trend</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bonusData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip 
                formatter={(value: any) => [`€${Math.round(value)}`, 'Amount']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar 
                dataKey="amount" 
                fill="#10B981" 
                opacity={(entry: any) => entry?.isPast ? 1 : 0.3}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bonus Types Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Income by Type</h4>
        <div className="space-y-2">
          {bonusByType.slice(0, 4).map((typeData: any) => (
            <div key={typeData.type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{typeData.type}</span>
                <span className="text-xs text-gray-600">({typeData.count} events)</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                €{typeData.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bonuses */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Variable Income</h4>
        <div className="space-y-2">
          {bonusData.bonuses.slice(0, 5).map((bonus: any) => (
            <div key={bonus.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {bonus.description}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                      {bonus.type}
                    </span>
                    {bonus.isRecurring && (
                      <span className="bg-blue-100 px-2 py-1 rounded text-xs text-blue-600">
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(bonus.date).toLocaleDateString()} • Q{bonus.quarter} {bonus.year}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    €{bonus.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast */}
      {bonusData.forecast.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Remaining Year Forecast</h4>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">Expected Additional Income:</span>
              <span className="font-bold text-blue-900">
                €{Math.round(bonusData.forecast.reduce((sum, item) => sum + item.expectedAmount, 0)).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Based on historical patterns and scheduled vesting
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusTrackerCard; 