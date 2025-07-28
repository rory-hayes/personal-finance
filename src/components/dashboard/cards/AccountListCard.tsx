import React, { useMemo } from 'react';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Target, 
  CreditCard, 
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

interface AccountListCardProps {
  card: any;
  financeData: any;
}

const AccountListCard: React.FC<AccountListCardProps> = ({ card, financeData }) => {
  const { accounts, transactions, users } = financeData;

  // Calculate account data with recent activity
  const accountData = useMemo(() => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return {
        accounts: [],
        totalBalance: 0,
        hasData: false
      };
    }

    // Process each account with additional metrics
    const processedAccounts = accounts.map((account: any) => {
      // Get recent transactions for this account
      const accountTransactions = transactions?.filter((t: any) => 
        t.accountId === account.id
      ) || [];

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = accountTransactions.filter((t: any) => 
        new Date(t.date) >= thirtyDaysAgo
      );

      const recentIncome = recentTransactions
        .filter((t: any) => t.amount > 0)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const recentExpenses = recentTransactions
        .filter((t: any) => t.amount < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      const netChange = recentIncome - recentExpenses;

      // Calculate change percentage (if we had previous balance)
      const previousBalance = account.balance - netChange;
      const changePercent = previousBalance > 0 ? ((netChange / previousBalance) * 100) : 0;

      // Get account owner name
      const owner = users.find((u: any) => u.id === account.userId);

      return {
        ...account,
        recentIncome,
        recentExpenses,
        netChange,
        changePercent,
        recentTransactionCount: recentTransactions.length,
        owner: owner?.name || 'Household',
        lastTransaction: accountTransactions[0]?.date ? new Date(accountTransactions[0].date) : null
      };
    });

    // Sort accounts by balance (highest first)
    const sortedAccounts = processedAccounts.sort((a: any, b: any) => b.balance - a.balance);

    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);

    return {
      accounts: sortedAccounts,
      totalBalance,
      hasData: true
    };
  }, [accounts, transactions, users]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'main':
      case 'checking':
        return Wallet;
      case 'savings':
        return DollarSign;
      case 'investment':
      case 'shares':
        return TrendingUp;
      case 'retirement':
        return Target;
      default:
        return CreditCard;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'main': 'Main Account',
      'checking': 'Checking',
      'savings': 'Savings',
      'investment': 'Investment',
      'retirement': 'Retirement',
      'shares': 'Share Vesting',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getAccountColor = (type: string) => {
    const colors: Record<string, string> = {
      'main': 'bg-blue-50 text-blue-700 border-blue-200',
      'checking': 'bg-green-50 text-green-700 border-green-200',
      'savings': 'bg-purple-50 text-purple-700 border-purple-200',
      'investment': 'bg-orange-50 text-orange-700 border-orange-200',
      'retirement': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'shares': 'bg-pink-50 text-pink-700 border-pink-200',
      'other': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[type] || colors['other'];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No activity';
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderMobileView = () => (
    <div className="flex flex-col space-y-4">
      {accountData.hasData ? (
        <>
          {/* Summary */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                €{accountData.totalBalance.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{accountData.accounts.length} account{accountData.accounts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Account List - Mobile Optimized */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            {accountData.accounts.slice(0, 4).map((account: any) => {
              const IconComponent = getAccountIcon(account.type);
              return (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-1.5 bg-white rounded-md">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.accountName}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getAccountColor(account.type)}`}>
                          {getAccountTypeLabel(account.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {account.owner}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      €{account.balance.toLocaleString()}
                    </p>
                    {account.recentTransactionCount > 0 && (
                      <p className="text-xs text-gray-500">
                        {account.recentTransactionCount} recent
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {accountData.accounts.length > 4 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('switchToUsers'))}
                  className="text-sm text-blue-600 font-medium"
                >
                  View all {accountData.accounts.length} accounts
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-6">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">No accounts</p>
          <p className="text-sm text-gray-600 mb-4">
            Set up your first account to get started
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToUsers'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg active:bg-blue-700 text-sm font-medium touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
      )}
    </div>
  );

  // Render for quarter/half size cards
  const renderCompactView = () => (
    <div className="h-full flex flex-col">
      {accountData.hasData ? (
        <>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(accountData.totalBalance)}
              </p>
              <p className="text-sm text-blue-700">Total Balance</p>
              <p className="text-xs text-blue-600">{accountData.accounts.length} accounts</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {accountData.accounts.slice(0, card.size === 'quarter' ? 3 : 5).map((account: any) => {
              const AccountIcon = getAccountIcon(account.type);
              
              return (
                <div key={account.id} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`p-1.5 rounded-lg ${getAccountColor(account.type)}`}>
                        <AccountIcon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.balance)}
                      </p>
                      {account.netChange !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${
                          account.netChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {account.netChange > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatCurrency(Math.abs(account.netChange))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {accountData.accounts.length > (card.size === 'quarter' ? 3 : 5) && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                +{accountData.accounts.length - (card.size === 'quarter' ? 3 : 5)} more accounts
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Wallet className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No accounts</p>
          <p className="text-xs text-gray-600 mb-3">Set up your first account to get started</p>
          <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="h-3 w-3" />
            Add Account
          </button>
        </div>
      )}
    </div>
  );

  // Render for full size cards
  const renderDetailedView = () => (
    <div className="h-full flex flex-col">
      {accountData.hasData ? (
        <>
          {/* Summary Header */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(accountData.totalBalance)}
              </p>
              <p className="text-sm text-blue-700">Total Balance</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">
                {accountData.accounts.length}
              </p>
              <p className="text-sm text-green-700">Total Accounts</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-900">
                {accountData.accounts.filter((a: any) => a.balance > 0).length}
              </p>
              <p className="text-sm text-purple-700">Active Accounts</p>
            </div>
          </div>

          {/* Account List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {accountData.accounts.map((account: any) => {
                const AccountIcon = getAccountIcon(account.type);
                
                return (
                  <div key={account.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getAccountColor(account.type)}`}>
                          <AccountIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{account.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getAccountColor(account.type)}`}>
                              {getAccountTypeLabel(account.type)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Owner: {account.owner}</span>
                            <span>Last activity: {formatDate(account.lastTransaction)}</span>
                            <span>{account.recentTransactionCount} transactions (30d)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 mb-1">
                          {formatCurrency(account.balance)}
                        </p>
                        
                        {account.netChange !== 0 && (
                          <div className={`flex items-center justify-end gap-1 text-sm ${
                            account.netChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.netChange > 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            <span>{formatCurrency(Math.abs(account.netChange))} (30d)</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {account.recentIncome > 0 || account.recentExpenses > 0 ? (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                          {account.recentIncome > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">
                                Income: {formatCurrency(account.recentIncome)}
                              </span>
                            </div>
                          )}
                          {account.recentExpenses > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">
                                Expenses: {formatCurrency(account.recentExpenses)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('switchToUsers'))}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Manage
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Wallet className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">No accounts found</p>
          <p className="text-sm text-gray-600 mb-6">
            Set up your first account to start tracking your finances
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToUsers'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Account
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {renderMobileView()}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {card.size === 'full' || card.size === 'tall' ? renderDetailedView() : renderCompactView()}
      </div>
    </>
  );
};

export default AccountListCard; 