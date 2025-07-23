import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';

interface AccountProgressCardProps {
  card: any;
  financeData: any;
}

const AccountProgressCard: React.FC<AccountProgressCardProps> = ({ card, financeData }) => {
  const { accounts, transactions } = financeData;

  // Calculate account progress data
  const progressData = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return {
        accountsWithHistory: [],
        chartData: [],
        totalBalance: 0,
        totalChange: 0,
        hasData: false
      };
    }

    const months = card.config.timeRange === '12months' ? 12 : card.config.timeRange === '6months' ? 6 : 3;
    const currentDate = new Date();
    
    // Generate monthly data for each account
    const monthlyData: any[] = [];
    const accountsWithMetrics: any[] = [];

    // Create timeline
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthData: any = {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        date: date,
        total: 0
      };

      // Calculate balance for each account at this point in time
      accounts.forEach((account: any) => {
        // Get all transactions for this account up to this date
        const accountTransactions = transactions.filter((t: any) => {
          const transactionDate = new Date(t.date);
          return t.accountId === account.id && transactionDate <= date;
        });

        // Calculate balance at this point
        const balanceAtDate = accountTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        
        monthData[account.id] = Math.max(balanceAtDate, 0);
        monthData.total += monthData[account.id];
      });

      monthlyData.push(monthData);
    }

    // Calculate metrics for each account
    accounts.forEach((account: any) => {
      const firstBalance = monthlyData[0]?.[account.id] || 0;
      const lastBalance = monthlyData[monthlyData.length - 1]?.[account.id] || account.balance;
      const change = lastBalance - firstBalance;
      const changePercent = firstBalance > 0 ? (change / firstBalance) * 100 : (lastBalance > 0 ? 100 : 0);

      // Calculate transaction volume for this account
      const accountTransactions = transactions.filter((t: any) => t.accountId === account.id);
      const totalInflow = accountTransactions
        .filter((t: any) => t.amount > 0)
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalOutflow = accountTransactions
        .filter((t: any) => t.amount < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      accountsWithMetrics.push({
        ...account,
        firstBalance,
        lastBalance,
        change,
        changePercent,
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        transactionCount: accountTransactions.length
      });
    });

    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
    const totalFirstBalance = monthlyData[0]?.total || 0;
    const totalChange = totalBalance - totalFirstBalance;

    return {
      accountsWithHistory: accountsWithMetrics.sort((a, b) => b.balance - a.balance),
      chartData: monthlyData,
      totalBalance,
      totalChange,
      hasData: monthlyData.length > 0 && accounts.length > 0
    };
  }, [accounts, transactions, card.config.timeRange]);

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {progressData.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                €{progressData.totalBalance.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Balance</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {progressData.totalChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <p className={`text-lg font-bold ${
                  progressData.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {progressData.totalChange >= 0 ? '+' : ''}€{progressData.totalChange.toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-600">Change</p>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'total') return [`€${value.toLocaleString()}`, 'Total Balance'];
                    const account = progressData.accountsWithHistory.find(acc => acc.id === name);
                    return [`€${value.toLocaleString()}`, account?.name || name];
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                {progressData.accountsWithHistory.slice(0, 3).map((account, index) => (
                  <Line 
                    key={account.id}
                    type="monotone" 
                    dataKey={account.id} 
                    stroke={account.color || `hsl(${index * 120}, 70%, 50%)`}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No account data available</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {progressData.hasData ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                {progressData.accountsWithHistory.length}
              </p>
              <p className="text-sm text-blue-700">Accounts</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                €{progressData.totalBalance.toLocaleString()}
              </p>
              <p className="text-sm text-green-700">Total Balance</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className={`text-xl font-bold ${
                progressData.totalChange >= 0 ? 'text-purple-900' : 'text-red-900'
              }`}>
                {progressData.totalChange >= 0 ? '+' : ''}€{progressData.totalChange.toLocaleString()}
              </p>
              <p className="text-sm text-purple-700">Net Change</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-xl font-bold text-indigo-900">
                {progressData.accountsWithHistory.reduce((sum, acc) => sum + acc.transactionCount, 0)}
              </p>
              <p className="text-sm text-indigo-700">Transactions</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">Account Balance History</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData.chartData}>
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
                    formatter={(value: any, name: string) => {
                      if (name === 'total') return [`€${value.toLocaleString()}`, 'Total Balance'];
                      const account = progressData.accountsWithHistory.find(acc => acc.id === name);
                      return [`€${value.toLocaleString()}`, account?.name || name];
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  
                  {/* Total balance line */}
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#1F2937" 
                    strokeWidth={4}
                    dot={{ fill: '#1F2937', strokeWidth: 2, r: 5 }}
                    name="total"
                  />
                  
                  {/* Individual account lines */}
                  {progressData.accountsWithHistory.map((account, index) => (
                    <Line 
                      key={account.id}
                      type="monotone" 
                      dataKey={account.id} 
                      stroke={account.color || `hsl(${index * 360 / progressData.accountsWithHistory.length}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ strokeWidth: 1, r: 3 }}
                      name={account.id}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Account Details */}
            <div className="w-80">
              <h4 className="font-medium text-gray-900 mb-4">Account Details</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {progressData.accountsWithHistory.map((account, index) => (
                  <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: account.color || `hsl(${index * 360 / progressData.accountsWithHistory.length}, 70%, 50%)` }}
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{account.name}</h5>
                          <p className="text-sm text-gray-600">{account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          €{account.balance.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1">
                          {account.change >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${
                            account.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.change >= 0 ? '+' : ''}€{account.change.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="font-medium text-green-900">€{account.totalInflow.toLocaleString()}</p>
                        <p className="text-xs text-green-700">Inflow</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <p className="font-medium text-red-900">€{account.totalOutflow.toLocaleString()}</p>
                        <p className="text-xs text-red-700">Outflow</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center text-sm">
                      <span className="text-gray-600">Net Flow: </span>
                      <span className={`font-medium ${
                        account.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {account.netFlow >= 0 ? '+' : ''}€{account.netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No account data available</p>
            <p className="text-sm">Add accounts in the Household tab to track progress</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default AccountProgressCard; 