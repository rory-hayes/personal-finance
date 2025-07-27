import React, { useMemo, useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, User } from 'lucide-react';

interface RecentTransactionsCardProps {
  card: any;
  financeData: any;
}

const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({ card, financeData }) => {
  const { transactions, accounts, users } = financeData;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Helper function to get relative date (moved before useMemo to avoid temporal dead zone)
  const getRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Process recent transactions
  const transactionData = useMemo(() => {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        recentTransactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        hasData: false
      };
    }

    // Filter and search transactions
    let filteredTransactions = transactions.filter((transaction: any) => {
      const matchesSearch = searchTerm === '' || 
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount.toString().includes(searchTerm);

      const matchesFilter = filterType === 'all' ||
        (filterType === 'income' && transaction.amount > 0) ||
        (filterType === 'expense' && transaction.amount < 0);

      return matchesSearch && matchesFilter;
    });

    // Sort by date (most recent first) and take the required amount
    const limit = card.size === 'quarter' ? 5 : card.size === 'half' ? 8 : 12;
    filteredTransactions = filteredTransactions
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    // Add enriched data
    const enrichedTransactions = filteredTransactions.map((transaction: any) => {
      const account = accounts.find((acc: any) => acc.id === transaction.accountId);
      const user = users.find((u: any) => u.id === transaction.userId);
      
      return {
        ...transaction,
        accountName: account?.name || 'Unknown Account',
        userName: user?.name || 'Unknown User',
        isIncome: transaction.amount > 0,
        displayAmount: Math.abs(transaction.amount),
        relativeDate: getRelativeDate(new Date(transaction.date))
      };
    });

    // Calculate totals for the filtered set
    const totalIncome = filteredTransactions
      .filter((t: any) => t.amount > 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(filteredTransactions
      .filter((t: any) => t.amount < 0)
      .reduce((sum: number, t: any) => sum + t.amount, 0));

    return {
      recentTransactions: enrichedTransactions,
      totalIncome,
      totalExpenses,
      hasData: enrichedTransactions.length > 0
    };
  }, [transactions, accounts, users, searchTerm, filterType, card.size]);

  const getCategoryColor = (category: string): string => {
    const colors: any = {
      'salary': 'bg-green-100 text-green-800',
      'bonus': 'bg-blue-100 text-blue-800',
      'groceries': 'bg-orange-100 text-orange-800',
      'dining': 'bg-red-100 text-red-800',
      'transport': 'bg-purple-100 text-purple-800',
      'utilities': 'bg-yellow-100 text-yellow-800',
      'entertainment': 'bg-pink-100 text-pink-800',
      'shopping': 'bg-indigo-100 text-indigo-800',
      'healthcare': 'bg-teal-100 text-teal-800',
      'education': 'bg-cyan-100 text-cyan-800'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      {transactionData.hasData ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {transactionData.recentTransactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className={`p-1 rounded-full ${transaction.isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.isIncome ? (
                    <ArrowDownLeft className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {transaction.relativeDate} • {transaction.accountName}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-bold ${transaction.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.isIncome ? '+' : '-'}€{transaction.displayAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No transactions found</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      {transactionData.hasData ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                €{transactionData.totalIncome.toLocaleString()}
              </p>
              <p className="text-sm text-green-700">Income</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-900">
                €{transactionData.totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-red-700">Expenses</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                {transactionData.recentTransactions.length}
              </p>
              <p className="text-sm text-blue-700">Transactions</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Transaction List */}
            <div className="flex-1">
              {/* Search and Filter */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>

              {/* Transaction List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {transactionData.recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${transaction.isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.isIncome ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || 'Transaction'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.relativeDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.isIncome ? '+' : '-'}€{transaction.displayAmount.toLocaleString()}
                        </p>
                        {transaction.category && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(transaction.category)}`}>
                            {transaction.category}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        <span>{transaction.accountName}</span>
                      </div>
                      {transaction.userName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {transaction.userName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="w-64">
              <h4 className="font-medium text-gray-900 mb-4">Quick Stats</h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Net Flow</p>
                  <p className={`text-lg font-bold ${
                    transactionData.totalIncome - transactionData.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transactionData.totalIncome - transactionData.totalExpenses >= 0 ? '+' : ''}
                    €{(transactionData.totalIncome - transactionData.totalExpenses).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average Transaction</p>
                  <p className="text-lg font-bold text-gray-900">
                                         €{(transactionData.recentTransactions.length > 0 ? 
                       transactionData.recentTransactions.reduce((sum: number, t: any) => sum + t.displayAmount, 0) / transactionData.recentTransactions.length 
                       : 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Most Recent</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transactionData.recentTransactions[0]?.relativeDate || 'None'}
                  </p>
                </div>

                {/* Top Categories */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Top Categories</p>
                  <div className="space-y-1">
                    {Object.entries(
                      transactionData.recentTransactions.reduce((acc: any, t: any) => {
                        if (t.category) {
                          acc[t.category] = (acc[t.category] || 0) + 1;
                        }
                        return acc;
                      }, {})
                    )
                    .sort(([,a]: any, [,b]: any) => b - a)
                    .slice(0, 3)
                                         .map(([category, count]) => (
                       <div key={category as string} className="flex justify-between text-xs">
                         <span className="truncate">{category as string}</span>
                         <span className="font-medium">{count as number}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No transactions found</p>
            <p className="text-sm">Add transactions to see recent activity</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'quarter' ? renderQuarterView() : renderDetailedView();
};

export default RecentTransactionsCard; 