import React, { useMemo } from 'react';
import { Users, PieChart, DollarSign, TrendingUp } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HouseholdContributionsCardProps {
  card: any;
  financeData: any;
}

const HouseholdContributionsCard: React.FC<HouseholdContributionsCardProps> = ({ card, financeData }) => {
  const { users, transactions, assets, accounts } = financeData;

  // Calculate contributions for each household member
  const contributionData = useMemo(() => {
    if (!users?.length) return { members: [], totalIncome: 0, totalSpending: 0, totalAssets: 0 };

    const contributions = users.map((user: any) => {
      // Calculate income from transactions
      const userIncome = transactions
        ?.filter((t: any) => t.userId === user.id && t.amount > 0)
        ?.reduce((sum: number, t: any) => sum + t.amount, 0) || user.monthlyIncome * 12 || 0;

      // Calculate spending from transactions
      const userSpending = transactions
        ?.filter((t: any) => t.userId === user.id && t.amount < 0)
        ?.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;

      // Calculate assets owned by user
      const userAssets = assets
        ?.filter((a: any) => a.userId === user.id)
        ?.reduce((sum: number, a: any) => sum + a.value, 0) || 0;

      // Calculate account balances for user
      const userAccounts = accounts
        ?.filter((a: any) => a.userId === user.id)
        ?.reduce((sum: number, a: any) => sum + a.balance, 0) || 0;

      const totalUserWealth = userAssets + userAccounts;

      return {
        id: user.id,
        name: user.name,
        color: user.color || '#6B7280',
        income: userIncome,
        spending: userSpending,
        assets: userAssets,
        accounts: userAccounts,
        totalWealth: totalUserWealth,
        savingsRate: userIncome > 0 ? ((userIncome - userSpending) / userIncome) * 100 : 0,
        transactionCount: transactions?.filter((t: any) => t.userId === user.id)?.length || 0
      };
    });

    const totalIncome = contributions.reduce((sum, member) => sum + member.income, 0);
    const totalSpending = contributions.reduce((sum, member) => sum + member.spending, 0);
    const totalAssets = contributions.reduce((sum, member) => sum + member.totalWealth, 0);

    // Add percentage calculations
    const membersWithPercentages = contributions.map(member => ({
      ...member,
      incomePercentage: totalIncome > 0 ? (member.income / totalIncome) * 100 : 0,
      spendingPercentage: totalSpending > 0 ? (member.spending / totalSpending) * 100 : 0,
      assetsPercentage: totalAssets > 0 ? (member.totalWealth / totalAssets) * 100 : 0
    }));

    return {
      members: membersWithPercentages,
      totalIncome,
      totalSpending,
      totalAssets
    };
  }, [users, transactions, assets, accounts]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  // Prepare chart data
  const incomeChartData = contributionData.members.map(member => ({
    name: member.name,
    value: member.income,
    percentage: member.incomePercentage
  }));

  const spendingChartData = contributionData.members.map(member => ({
    name: member.name,
    value: member.spending,
    percentage: member.spendingPercentage
  }));

  if (!contributionData.members.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Users className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Household Members</h3>
        <p className="text-sm text-center">Add household members to see contribution analysis</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Household Contributions</h3>
        </div>
        <div className="text-sm text-gray-600">
          {contributionData.members.length} Members
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Total Income</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            €{contributionData.totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-800">Total Spending</span>
          </div>
          <div className="text-lg font-bold text-red-900">
            €{contributionData.totalSpending.toLocaleString()}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Total Assets</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            €{contributionData.totalAssets.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Member Details */}
      <div className="space-y-3 mb-6">
        {contributionData.members.map((member, index) => (
          <div key={member.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="font-medium text-gray-900">{member.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {member.savingsRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
                  Savings Rate
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Income</div>
                <div className="font-medium">€{member.income.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {member.incomePercentage.toFixed(1)}% of household
                </div>
              </div>
              <div>
                <div className="text-gray-600">Spending</div>
                <div className="font-medium">€{member.spending.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {member.spendingPercentage.toFixed(1)}% of household
                </div>
              </div>
              <div>
                <div className="text-gray-600">Net Worth</div>
                <div className="font-medium">€{member.totalWealth.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {member.assetsPercentage.toFixed(1)}% of household
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Income Distribution Chart */}
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Income Distribution</h4>
        <div className="grid grid-cols-2 gap-4 h-32">
          <div>
            <h5 className="text-xs text-gray-600 mb-2">By Income</h5>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={incomeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  labelLine={false}
                  fontSize={8}
                >
                  {incomeChartData.map((entry, index) => (
                    <Cell key={`income-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`€${Math.round(value)}`, 'Income']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h5 className="text-xs text-gray-600 mb-2">By Spending</h5>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={spendingChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  labelLine={false}
                  fontSize={8}
                >
                  {spendingChartData.map((entry, index) => (
                    <Cell key={`spending-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`€${Math.round(value)}`, 'Spending']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 border-t pt-4">
        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="text-sm">
            <div className="font-medium text-indigo-800 mb-1">Household Balance</div>
            <div className="text-indigo-700 text-xs">
              {contributionData.members.length > 1 ? (
                <>
                  Income distribution: {contributionData.members.map((m, i) => 
                    `${m.name} (${m.incomePercentage.toFixed(0)}%)`
                  ).join(', ')}
                </>
              ) : (
                'Add more household members to see contribution analysis'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdContributionsCard; 