import React, { useMemo } from 'react';
import { CreditCard, Calendar, TrendingUp, AlertCircle, DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SubscriptionTrackerCardProps {
  card: any;
  financeData: any;
}

const SubscriptionTrackerCard: React.FC<SubscriptionTrackerCardProps> = ({ card, financeData }) => {
  const { recurringExpenses } = financeData;

  // Process recurring expenses to identify subscriptions
  const subscriptionData = useMemo(() => {
    if (!recurringExpenses?.length) return { subscriptions: [], totalMonthly: 0, totalAnnual: 0 };

    // Filter recurring expenses for subscription-type expenses
    const subscriptions = recurringExpenses
      .filter((expense: any) => {
        // Consider expenses with subscription-related categories or keywords
        const subscriptionCategories = ['subscription', 'entertainment', 'software', 'digital services'];
        const subscriptionKeywords = [
          'netflix', 'spotify', 'apple', 'amazon', 'disney', 'hulu',
          'subscription', 'premium', 'pro', 'plus', 'gym', 'fitness',
          'adobe', 'office', 'microsoft', 'phone', 'internet'
        ];
        
        const category = (expense.category || '').toLowerCase();
        const description = (expense.description || '').toLowerCase();
        
        return subscriptionCategories.some(cat => category.includes(cat)) ||
               subscriptionKeywords.some(keyword => description.includes(keyword)) ||
               expense.category === 'Bills'; // Include bills as potential subscriptions
      })
      .map((expense: any) => {
        // Calculate monthly equivalent amount
        let monthlyAmount = Math.abs(expense.amount);
        
        switch (expense.frequency) {
          case 'weekly':
            monthlyAmount = monthlyAmount * 4.33; // Average weeks per month
            break;
          case 'quarterly':
            monthlyAmount = monthlyAmount / 3;
            break;
          case 'yearly':
            monthlyAmount = monthlyAmount / 12;
            break;
          // monthly is already correct
        }

        // Categorize subscription type
        let category = 'Other';
        const desc = expense.description.toLowerCase();
        if (/netflix|spotify|disney|hulu|streaming/i.test(desc)) category = 'Entertainment';
        else if (/gym|fitness|health/i.test(desc)) category = 'Health & Fitness';
        else if (/phone|internet|utilities/i.test(desc)) category = 'Utilities';
        else if (/insurance/i.test(desc)) category = 'Insurance';
        else if (/adobe|office|software|saas/i.test(desc)) category = 'Software';

        return {
          id: expense.id,
          name: expense.description,
          amount: Math.abs(expense.amount),
          monthlyAmount: monthlyAmount,
          frequency: expense.frequency,
          category: category,
          nextDue: expense.nextDue || new Date().toISOString().split('T')[0],
          active: expense.active !== false
        };
      });

    const totalMonthly = subscriptions.reduce((sum: number, sub: any) => sum + sub.monthlyAmount, 0);
    const totalAnnual = totalMonthly * 12;

    return { subscriptions, totalMonthly, totalAnnual };
  }, [recurringExpenses]);

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
        <CreditCard className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-lg font-medium mb-2">No subscriptions found</p>
        <p className="text-sm text-center">Add recurring expenses in the Expenses tab to track your subscriptions</p>
      </div>
    );
  }

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-gray-900">
          €{subscriptionData.totalMonthly.toFixed(0)}
        </p>
        <p className="text-sm text-gray-600">Monthly Total</p>
      </div>
      
      <div className="space-y-2 flex-1">
        {subscriptionData.subscriptions.slice(0, 3).map((sub: any) => (
          <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-700 truncate">{sub.name}</span>
            <span className="text-sm font-bold text-gray-900">€{sub.monthlyAmount.toFixed(0)}</span>
          </div>
        ))}
        {subscriptionData.subscriptions.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{subscriptionData.subscriptions.length - 3} more
          </div>
        )}
      </div>
    </div>
  );

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-900">
            €{subscriptionData.totalMonthly.toFixed(0)}
          </p>
          <p className="text-sm text-blue-700">Monthly</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xl font-bold text-purple-900">
            {subscriptionData.subscriptions.length}
          </p>
          <p className="text-sm text-purple-700">Active</p>
        </div>
      </div>

      {/* Subscription List */}
      <div className="flex-1 space-y-2">
        {subscriptionData.subscriptions.slice(0, 5).map((sub: any) => (
          <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900 truncate">{sub.name}</p>
              <p className="text-sm text-gray-600">{sub.category} • {sub.frequency}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">€{sub.monthlyAmount.toFixed(0)}</p>
              <p className="text-xs text-gray-500">/month</p>
            </div>
          </div>
        ))}
        {subscriptionData.subscriptions.length > 5 && (
          <div className="text-sm text-gray-500 text-center">
            +{subscriptionData.subscriptions.length - 5} more subscriptions
          </div>
        )}
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-blue-900">
            €{subscriptionData.totalMonthly.toFixed(0)}
          </p>
          <p className="text-sm text-blue-700">Monthly Total</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-900">
            €{subscriptionData.totalAnnual.toFixed(0)}
          </p>
          <p className="text-sm text-green-700">Annual Total</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <CreditCard className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-xl font-bold text-purple-900">
            {subscriptionData.subscriptions.length}
          </p>
          <p className="text-sm text-purple-700">Active Subscriptions</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-xl font-bold text-orange-900">
            €{subscriptionData.subscriptions.length > 0 ? (subscriptionData.totalMonthly / subscriptionData.subscriptions.length).toFixed(0) : '0'}
          </p>
          <p className="text-sm text-orange-700">Average per Sub</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Category Breakdown Chart */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">Breakdown by Category</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={(entry) => `${entry.name}: €${(entry.value || 0).toFixed(0)}`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`€${value.toFixed(2)}`, 'Monthly Cost']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription List */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">Active Subscriptions</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subscriptionData.subscriptions.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{sub.name}</p>
                  <p className="text-sm text-gray-600">
                    {sub.category} • {sub.frequency} • Next: {new Date(sub.nextDue).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">€{sub.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">€{sub.monthlyAmount.toFixed(0)}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Subscription CTA */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-medium text-blue-900">Manage Subscriptions</h5>
            <p className="text-sm text-blue-700">Add or edit recurring expenses in the Expenses tab</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToExpenses'))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : 
         card.size === 'half' ? renderHalfView() : renderFullView();
};

export default SubscriptionTrackerCard; 