import React, { useMemo } from 'react';
import { Users, TrendingUp, Award, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PeerBenchmarkingCardProps {
  card: any;
  financeData: any;
}

const PeerBenchmarkingCard: React.FC<PeerBenchmarkingCardProps> = ({ card, financeData }) => {
  const { totalAccountBalance, totalIncome, totalSpending, users } = financeData;

  // Calculate user's metrics and compare to benchmarks
  const benchmarkData = useMemo(() => {
    const userAge = 35; // Could be from user profile
    const userIncome = totalIncome || 0;
    const userNetWorth = totalAccountBalance || 0;
    const userSavingsRate = userIncome > 0 ? ((userIncome - totalSpending) / userIncome) * 100 : 0;

    // Mock benchmark data (in reality, this would come from external API or database)
    const ageBracket = userAge < 30 ? '20-29' : userAge < 40 ? '30-39' : userAge < 50 ? '40-49' : '50+';
    const incomeBracket = userIncome < 40000 ? '<40k' : userIncome < 70000 ? '40-70k' : userIncome < 100000 ? '70-100k' : '100k+';

    // Mock peer data based on demographics
    const benchmarks = {
      savingsRate: {
        peer25th: 5,
        peer50th: 15,
        peer75th: 25,
        user: userSavingsRate
      },
      netWorth: {
        peer25th: userAge < 30 ? 5000 : userAge < 40 ? 25000 : userAge < 50 ? 75000 : 150000,
        peer50th: userAge < 30 ? 15000 : userAge < 40 ? 65000 : userAge < 50 ? 180000 : 350000,
        peer75th: userAge < 30 ? 40000 : userAge < 40 ? 150000 : userAge < 50 ? 450000 : 750000,
        user: userNetWorth
      },
      monthlySpending: {
        peer25th: userIncome * 0.6 / 12,
        peer50th: userIncome * 0.75 / 12,
        peer75th: userIncome * 0.9 / 12,
        user: totalSpending || 0
      }
    };

    // Calculate percentiles
    const calculatePercentile = (value: number, p25: number, p50: number, p75: number) => {
      if (value <= p25) return Math.max(5, (value / p25) * 25);
      if (value <= p50) return 25 + ((value - p25) / (p50 - p25)) * 25;
      if (value <= p75) return 50 + ((value - p50) / (p75 - p50)) * 25;
      return Math.min(95, 75 + ((value - p75) / (p75 * 0.5)) * 20);
    };

    const metrics = [
      {
        name: 'Savings Rate',
        user: userSavingsRate,
        peer25th: benchmarks.savingsRate.peer25th,
        peer50th: benchmarks.savingsRate.peer50th,
        peer75th: benchmarks.savingsRate.peer75th,
        percentile: calculatePercentile(userSavingsRate, benchmarks.savingsRate.peer25th, benchmarks.savingsRate.peer50th, benchmarks.savingsRate.peer75th),
        format: (val: number) => `${val.toFixed(1)}%`,
        good: userSavingsRate >= benchmarks.savingsRate.peer50th
      },
      {
        name: 'Net Worth',
        user: userNetWorth,
        peer25th: benchmarks.netWorth.peer25th,
        peer50th: benchmarks.netWorth.peer50th,
        peer75th: benchmarks.netWorth.peer75th,
        percentile: calculatePercentile(userNetWorth, benchmarks.netWorth.peer25th, benchmarks.netWorth.peer50th, benchmarks.netWorth.peer75th),
        format: (val: number) => `€${Math.round(val).toLocaleString()}`,
        good: userNetWorth >= benchmarks.netWorth.peer50th
      },
      {
        name: 'Monthly Spending',
        user: totalSpending || 0,
        peer25th: benchmarks.monthlySpending.peer25th,
        peer50th: benchmarks.monthlySpending.peer50th,
        peer75th: benchmarks.monthlySpending.peer75th,
        percentile: 100 - calculatePercentile(totalSpending || 0, benchmarks.monthlySpending.peer25th, benchmarks.monthlySpending.peer50th, benchmarks.monthlySpending.peer75th),
        format: (val: number) => `€${Math.round(val).toLocaleString()}`,
        good: (totalSpending || 0) <= benchmarks.monthlySpending.peer50th
      }
    ];

    return {
      ageBracket,
      incomeBracket,
      metrics,
      overallPercentile: Math.round(metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length)
    };
  }, [totalAccountBalance, totalIncome, totalSpending]);

  const chartData = benchmarkData.metrics.map(m => ({
    name: m.name,
    'You': m.user,
    '25th %ile': m.peer25th,
    '50th %ile': m.peer50th,
    '75th %ile': m.peer75th
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Peer Benchmarking</h3>
        </div>
        <div className="text-sm text-gray-600">
          {benchmarkData.ageBracket} • {benchmarkData.incomeBracket}
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Percentile</span>
            <Award className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-indigo-900">
              {benchmarkData.overallPercentile}
            </span>
            <span className="text-lg text-indigo-700 mb-1">percentile</span>
          </div>
          <p className="text-sm text-indigo-700 mt-1">
            You're doing better than {benchmarkData.overallPercentile}% of people in your demographic
          </p>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Your Performance vs Peers</h4>
        <div className="space-y-4">
          {benchmarkData.metrics.map((metric) => (
            <div key={metric.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${metric.good ? 'text-green-600' : 'text-orange-600'}`}>
                    {metric.format(metric.user)}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({Math.round(metric.percentile)}th %ile)
                  </span>
                </div>
              </div>
              
              {/* Progress bar showing position vs peers */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${metric.good ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(100, metric.percentile)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>25th: {metric.format(metric.peer25th)}</span>
                  <span>50th: {metric.format(metric.peer50th)}</span>
                  <span>75th: {metric.format(metric.peer75th)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Benchmark Comparison</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={10} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const metric = benchmarkData.metrics.find(m => chartData.some(c => c.name === m.name));
                  return [metric?.format(Number(value)) || value, name];
                }}
              />
              <Bar dataKey="25th %ile" fill="#E5E7EB" />
              <Bar dataKey="50th %ile" fill="#9CA3AF" />
              <Bar dataKey="75th %ile" fill="#6B7280" />
              <Bar dataKey="You" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 border-t pt-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">Key Insights</div>
              <ul className="text-blue-700 space-y-1">
                {benchmarkData.metrics.map((metric) => (
                  <li key={metric.name} className="text-xs">
                    • {metric.name}: {metric.good ? 'Above' : 'Below'} median for your demographic
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerBenchmarkingCard; 