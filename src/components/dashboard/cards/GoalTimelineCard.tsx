import React, { useMemo } from 'react';
import { Calendar, Target, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GoalTimelineCardProps {
  card: any;
  financeData: any;
}

const GoalTimelineCard: React.FC<GoalTimelineCardProps> = ({ card, financeData }) => {
  const { goals } = financeData;

  // Process goals for timeline visualization
  const timelineData = useMemo(() => {
    if (!goals?.length) return [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return goals.map((goal: any) => {
      const targetDate = new Date(goal.targetDate);
      const monthsUntilTarget = (targetDate.getFullYear() - currentYear) * 12 + (targetDate.getMonth() - currentMonth);
      const progressPercentage = goal.currentAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      
      // Calculate if goal is on track
      const expectedProgress = monthsUntilTarget > 0 ? Math.max(0, 100 - (monthsUntilTarget / 24) * 100) : 100;
      const status = progressPercentage >= expectedProgress * 0.9 ? 'on-track' : 
                   progressPercentage >= expectedProgress * 0.7 ? 'behind' : 'critical';

      // Calculate required monthly savings
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const requiredMonthly = monthsUntilTarget > 0 ? remaining / monthsUntilTarget : 0;

      return {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
        monthsUntilTarget: Math.max(0, monthsUntilTarget),
        progressPercentage: Math.min(100, progressPercentage),
        status,
        requiredMonthly,
        remaining,
        category: goal.category || 'General'
      };
    }).sort((a: any, b: any) => a.monthsUntilTarget - b.monthsUntilTarget);
  }, [goals]);

  // Create Gantt chart data
  const ganttData = useMemo(() => {
    if (!timelineData.length) return [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const maxMonths = 36; // Show 3 years

    const monthsData = [];
    for (let i = 0; i < maxMonths; i++) {
      const monthDate = new Date(currentYear, currentDate.getMonth() + i, 1);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthData: any = {
        month: monthLabel,
        monthIndex: i
      };

      // Add goal progress for this month
      timelineData.forEach((goal: any) => {
        if (i <= goal.monthsUntilTarget) {
          const progressAtMonth = Math.min(100, (goal.progressPercentage / goal.monthsUntilTarget) * (goal.monthsUntilTarget - i));
          monthData[`goal_${goal.id}`] = progressAtMonth;
          monthData[`goal_${goal.id}_name`] = goal.name;
          monthData[`goal_${goal.id}_status`] = goal.status;
        }
      });

      monthsData.push(monthData);
    }

    return monthsData;
  }, [timelineData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return '#10B981';
      case 'behind': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'behind': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!goals?.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Target className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Goals Set</h3>
        <p className="text-sm text-center">Create financial goals to see your timeline</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Goal Timeline</h3>
        </div>
        <div className="text-sm text-gray-600">
          {timelineData.length} Active Goals
        </div>
      </div>

      {/* Goals Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">On Track</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {timelineData.filter((g: any) => g.status === 'on-track').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Behind</span>
          </div>
          <div className="text-lg font-bold text-yellow-900">
            {timelineData.filter((g: any) => g.status === 'behind' || g.status === 'critical').length}
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {timelineData.map((goal) => (
          <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(goal.status)}
                  <h4 className="font-medium text-gray-900">{goal.name}</h4>
                </div>
                <div className="text-sm text-gray-600">
                  Target: €{goal.targetAmount.toLocaleString()} by {new Date(goal.targetDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {goal.progressPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
                  {goal.monthsUntilTarget} months left
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>€{goal.currentAmount.toLocaleString()}</span>
                <span>€{goal.targetAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, goal.progressPercentage)}%`,
                    backgroundColor: getStatusColor(goal.status)
                  }}
                />
              </div>
            </div>

            {/* Required Monthly Savings */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly needed:</span>
              <span className="font-medium text-gray-900">
                €{goal.requiredMonthly.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gantt Chart Visualization */}
      {timelineData.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline Visualization</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganttData.slice(0, 12)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        {payload.map((entry: any, index: number) => {
                          if (entry.dataKey.startsWith('goal_') && !entry.dataKey.includes('_name') && !entry.dataKey.includes('_status')) {
                            const goalId = entry.dataKey.replace('goal_', '');
                            const goalName = entry.payload[`goal_${goalId}_name`];
                            const goalStatus = entry.payload[`goal_${goalId}_status`];
                            
                            return (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{goalName}</span>
                                <span className="ml-2" style={{ color: getStatusColor(goalStatus) }}>
                                  {entry.value?.toFixed(1)}%
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  }}
                />
                {timelineData.map((goal: any) => (
                  <Bar
                    key={goal.id}
                    dataKey={`goal_${goal.id}`}
                    stackId="goals"
                    fill={getStatusColor(goal.status)}
                    opacity={0.8}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTimelineCard; 