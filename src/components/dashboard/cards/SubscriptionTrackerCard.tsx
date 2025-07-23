import React, { useMemo } from 'react';
import { CreditCard, Calendar, TrendingUp, AlertCircle, DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SubscriptionTrackerCardProps {
  card: any;
  financeData: any;
}

const SubscriptionTrackerCard: React.FC<SubscriptionTrackerCardProps> = ({ card, financeData }) => {
  const { transactions } = financeData;

  // Analyze transactions to identify subscriptions
  const subscriptionData = useMemo(() => {
    if (!transactions?.length) return { subscriptions: [], totalMonthly: 0, totalAnnual: 0 };

    // Common subscription patterns
    const subscriptionPatterns = [
      /netflix/i, /spotify/i, /apple/i, /amazon/i, /disney/i, /hulu/i,
      /subscription/i, /monthly/i, /premium/i, /pro/i, /plus/i,
      /gym/i, /fitness/i, /adobe/i, /office/i, /microsoft/i,
      /insurance/i, /phone/i, /internet/i, /utilities/i
    ];

    // Group transactions by description and look for recurring patterns
    const transactionGroups = transactions.reduce((groups: Record<string, any[]>, transaction: any) => {
      // Normalize description for grouping
      const normalizedDesc = transaction.description.toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[^\w\s]/g, '') // Remove special chars
        .trim();

      if (!groups[normalizedDesc]) {
        groups[normalizedDesc] = [];
      }
      groups[normalizedDesc].push(transaction);
      return groups;
    }, {});

    // Identify subscriptions based on recurring patterns
    const subscriptions = Object.entries(transactionGroups)
      .map(([description, groupTransactions]) => {
        const sortedTransactions = groupTransactions.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Check if it's a subscription (recurring pattern)
        const isSubscription = groupTransactions.length >= 2 && (
          subscriptionPatterns.some(pattern => pattern.test(description)) ||
          groupTransactions.length >= 3 // 3+ occurrences likely subscription
        );

        if (!isSubscription) return null;

        // Calculate average amount and frequency
        const amounts = groupTransactions.map((t: any) => Math.abs(t.amount));
        const avgAmount = amounts.reduce((sum: number, amt: number) => sum + amt, 0) / amounts.length;
        
        // Estimate frequency based on transaction intervals
        const intervals = [];
        for (let i = 1; i < sortedTransactions.length; i++) {
          const prevDate = new Date(sortedTransactions[i - 1].date);
          const currDate = new Date(sortedTransactions[i].date);
          const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.length > 0 ? 
          intervals.reduce((sum: number, interval: number) => sum + interval, 0) / intervals.length : 30;

        // Determine frequency type
        let frequency = 'monthly';
        let monthlyAmount = avgAmount;
        
        if (avgInterval < 20) {
          frequency = 'weekly';
          monthlyAmount = avgAmount * 4.33; // weeks per month
        } else if (avgInterval > 40 && avgInterval < 100) {
          frequency = 'monthly';
          monthlyAmount = avgAmount;
        } else if (avgInterval > 300) {
          frequency = 'yearly';
          monthlyAmount = avgAmount / 12;
        }

        // Categorize subscription type
        let category = 'Other';
        if (/netflix|spotify|disney|hulu|streaming/i.test(description)) category = 'Entertainment';
        else if (/gym|fitness|health/i.test(description)) category = 'Health & Fitness';
        else if (/phone|internet|utilities/i.test(description)) category = 'Utilities';
        else if (/insurance/i.test(description)) category = 'Insurance';
        else if (/adobe|office|software|saas/i.test(description)) category = 'Software';

        return {
          id: `sub-${description.replace(/\s+/g, '-')}`,
          name: groupTransactions[0].description,
          category,
          frequency,
          amount: avgAmount,
          monthlyAmount,
          transactionCount: groupTransactions.length,
          lastPayment: sortedTransactions[sortedTransactions.length - 1].date,
          nextEstimatedPayment: new Date(
            new Date(sortedTransactions[sortedTransactions.length - 1].date).getTime() + 
            (avgInterval * 24 * 60 * 60 * 1000)
          ).toISOString().split('T')[0],
          avgInterval: Math.round(avgInterval),
          transactions: groupTransactions
        };
      })
      .filter((sub: any) => sub !== null)
      .sort((a: any, b: any) => b.monthlyAmount - a.monthlyAmount);

    const totalMonthly = subscriptions.reduce((sum: number, sub: any) => sum + sub.monthlyAmount, 0);
    const totalAnnual = totalMonthly * 12;

    return { subscriptions, totalMonthly, totalAnnual };
  }, [transactions]);

  // Group subscriptions by category for pie chart
  const categoryData = useMemo(() => {
    const categories = subscriptionData.subscriptions.reduce((acc: Record<string, number>, sub: any) => {
      acc[sub.category] = (acc[sub.category] || 0) + sub.monthlyAmount;
      return acc;
    }, {});

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [subscriptionData.subscriptions]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  if (!subscriptionData.subscriptions.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <CreditCard className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Subscriptions Found</h3>
        <p className="text-sm text-center">No recurring payments detected in your transactions</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Subscription Tracker</h3>
        </div>
        <div className="text-sm text-gray-600">
          {subscriptionData.subscriptions.length} Active
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Monthly Total</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            €{subscriptionData.totalMonthly.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Annual Total</span>
          </div>
          <div className="text-xl font-bold text-purple-900">
            €{subscriptionData.totalAnnual.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Category Breakdown</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: €${Math.round(value)}`}
                  labelLine={false}
                  fontSize={10}
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`€${Math.round(value)}`, 'Monthly Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Active Subscriptions</h4>
        <div className="space-y-3">
          {subscriptionData.subscriptions.map((subscription: any) => (
            <div key={subscription.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{subscription.name}</h5>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {subscription.category}
                    </span>
                    <span>{subscription.frequency}</span>
                    <span>{subscription.transactionCount} transactions</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    €{subscription.monthlyAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    per month
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Last Payment:</span>
                  <div className="font-medium">
                    {new Date(subscription.lastPayment).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Next Payment:</span>
                  <div className="font-medium">
                    {new Date(subscription.nextEstimatedPayment).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Frequency Pattern */}
              <div className="mt-3 text-xs text-gray-600">
                <span>Pattern: Every ~{subscription.avgInterval} days</span>
                <span className="ml-4">Amount: €{subscription.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 border-t pt-4">
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800 mb-1">Savings Tip</div>
              <div className="text-yellow-700">
                                 Review subscriptions over €20/month. You could save €
                 {Math.round((subscriptionData.subscriptions
                   .filter((s: any) => s.monthlyAmount > 20)
                   .reduce((sum: number, s: any) => sum + s.monthlyAmount, 0) * 0.3) || 0
                 )} annually by optimizing unused services.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTrackerCard; 