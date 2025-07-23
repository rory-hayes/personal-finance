import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Plus } from 'lucide-react';

interface VestingSchedulesCardProps {
  card: any;
  financeData: any;
  onShowVestingModal: () => void;
}

const VestingSchedulesCard: React.FC<VestingSchedulesCardProps> = ({ 
  card, 
  financeData, 
  onShowVestingModal 
}) => {
  const { vestingSchedules } = financeData;

  // Calculate vesting data
  const vestingData = useMemo(() => {
    if (!vestingSchedules || vestingSchedules.length === 0) {
      return {
        schedules: [],
        totalVested: 0,
        totalUnvested: 0,
        monthlyProjections: [],
        hasData: false
      };
    }

    const currentDate = new Date();
    let totalVested = 0;
    let totalUnvested = 0;
    const monthlyProjections: any[] = [];

    // Process each vesting schedule
    const schedulesWithMetrics = vestingSchedules.map((schedule: any) => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const monthlyAmount = schedule.monthlyAmount;
      const cliffAmount = schedule.cliffAmount || 0;
      const cliffPeriod = schedule.cliffPeriod || 0;

      // Calculate months elapsed and total months
      const totalMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthsElapsed = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      
      // Calculate vested and unvested amounts
      let vested = 0;
      let unvested = 0;

      if (currentDate >= startDate) {
        // Regular monthly vesting
        const vestedMonths = Math.min(monthsElapsed, totalMonths);
        vested = vestedMonths * monthlyAmount;

        // Add cliff amount if cliff period has passed
        if (cliffAmount > 0 && monthsElapsed >= cliffPeriod) {
          vested += cliffAmount;
        }

        // Calculate remaining unvested
        const remainingMonths = Math.max(0, totalMonths - vestedMonths);
        unvested = remainingMonths * monthlyAmount;

        // Add cliff if not yet vested
        if (cliffAmount > 0 && monthsElapsed < cliffPeriod) {
          unvested += cliffAmount;
        }
      } else {
        // Schedule hasn't started yet
        unvested = (totalMonths * monthlyAmount) + cliffAmount;
      }

      totalVested += vested;
      totalUnvested += unvested;

      return {
        ...schedule,
        vested,
        unvested,
        totalAmount: vested + unvested,
        progress: vested + unvested > 0 ? (vested / (vested + unvested)) * 100 : 0,
        monthsElapsed,
        totalMonths,
        isActive: currentDate >= startDate && currentDate <= endDate,
        status: currentDate < startDate ? 'pending' : currentDate > endDate ? 'completed' : 'active'
      };
    });

    // Generate monthly projections for next 12 months
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      let monthlyVesting = 0;
      let cumulativeVested = totalVested;

      schedulesWithMetrics.forEach(schedule => {
        const scheduleStart = new Date(schedule.startDate);
        const scheduleEnd = new Date(schedule.endDate);
        
        if (projectionDate >= scheduleStart && projectionDate <= scheduleEnd) {
          monthlyVesting += schedule.monthlyAmount;
        }

        // Add cumulative vesting for this projection month
        if (projectionDate > currentDate) {
          const monthsFromNow = Math.ceil((projectionDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          if (projectionDate >= scheduleStart && projectionDate <= scheduleEnd) {
            cumulativeVested += schedule.monthlyAmount * Math.min(monthsFromNow, schedule.totalMonths - schedule.monthsElapsed);
          }
        }
      });

      monthlyProjections.push({
        month: projectionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        monthlyAmount: monthlyVesting,
        cumulativeVested: i === 0 ? totalVested : cumulativeVested,
        date: projectionDate
      });
    }

    return {
      schedules: schedulesWithMetrics,
      totalVested,
      totalUnvested,
      monthlyProjections,
      hasData: true
    };
  }, [vestingSchedules]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      {vestingData.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-900">
                €{vestingData.totalVested.toLocaleString()}
              </p>
              <p className="text-xs text-green-700">Vested</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-900">
                €{vestingData.totalUnvested.toLocaleString()}
              </p>
              <p className="text-xs text-blue-700">Unvested</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {vestingData.schedules.slice(0, 2).map((schedule: any) => (
              <div key={schedule.id} className="border border-gray-200 rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {schedule.description || 'Vesting Schedule'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    schedule.status === 'active' ? 'bg-green-100 text-green-700' :
                    schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {schedule.status}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${schedule.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{schedule.progress.toFixed(0)}% vested</span>
                  <span>€{schedule.monthlyAmount}/month</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onShowVestingModal}
            className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Schedule
          </button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Calendar className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No vesting schedules</p>
          <p className="text-xs text-gray-600 mb-3">Track your equity vesting progress</p>
          <button
            onClick={onShowVestingModal}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add First Schedule
          </button>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      {vestingData.hasData ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                €{vestingData.totalVested.toLocaleString()}
              </p>
              <p className="text-sm text-green-700">Total Vested</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                €{vestingData.totalUnvested.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Total Unvested</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-900">
                {vestingData.schedules.length}
              </p>
              <p className="text-sm text-purple-700">Active Schedules</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-xl font-bold text-indigo-900">
                €{vestingData.monthlyProjections[0]?.monthlyAmount.toLocaleString() || 0}
              </p>
              <p className="text-sm text-indigo-700">This Month</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">Vesting Timeline (Next 12 Months)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vestingData.monthlyProjections}>
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
                    formatter={(value: any, name: string) => [
                      `€${value.toLocaleString()}`, 
                      name === 'monthlyAmount' ? 'Monthly Vesting' : 'Cumulative Vested'
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeVested" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="cumulativeVested"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="monthlyAmount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="monthlyAmount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Schedule Details */}
            <div className="w-80">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Schedules</h4>
                <button
                  onClick={onShowVestingModal}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {vestingData.schedules.map((schedule: any) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {schedule.description || 'Vesting Schedule'}
                        </h5>
                        <p className="text-sm text-gray-600">
                          €{schedule.monthlyAmount.toLocaleString()}/month
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        schedule.status === 'active' ? 'bg-green-100 text-green-700' :
                        schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>€{schedule.vested.toLocaleString()} vested</span>
                        <span>{schedule.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${schedule.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="block">Start:</span>
                        <span className="font-medium">{new Date(schedule.startDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="block">End:</span>
                        <span className="font-medium">{new Date(schedule.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {schedule.cliffAmount > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                        <span className="text-yellow-800 font-medium">
                          Cliff: €{schedule.cliffAmount.toLocaleString()} after {schedule.cliffPeriod} months
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No vesting schedules</p>
            <p className="text-sm text-gray-600 mb-4">Track your equity vesting and cliff payments</p>
            <button
              onClick={onShowVestingModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Vesting Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'quarter' || card.size === 'half' ? renderQuarterView() : renderDetailedView();
};

export default VestingSchedulesCard; 