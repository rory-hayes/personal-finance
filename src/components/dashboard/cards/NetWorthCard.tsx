import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';

interface NetWorthCardProps {
  card: any;
  financeData: any;
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({ card, financeData }) => {
  const { totalAssetValue, totalAccountBalance, assets, accounts } = financeData;

  // Calculate net worth data
  const netWorthData = useMemo(() => {
    const totalNetWorth = totalAssetValue + totalAccountBalance;
    
    // Break down by category
    const breakdown = [
      {
        category: 'Cash & Accounts',
        value: totalAccountBalance,
        percentage: totalNetWorth > 0 ? (totalAccountBalance / totalNetWorth) * 100 : 0,
        color: '#10B981'
      },
      {
        category: 'Assets',
        value: totalAssetValue,
        percentage: totalNetWorth > 0 ? (totalAssetValue / totalNetWorth) * 100 : 0,
        color: '#3B82F6'
      }
    ].filter(item => item.value > 0);

    // Asset categories if available
    const assetCategories = assets.reduce((acc: any, asset: any) => {
      const category = asset.category || 'Other';
      acc[category] = (acc[category] || 0) + asset.value;
      return acc;
    }, {});

    const assetBreakdown = Object.entries(assetCategories).map(([category, value]) => ({
      category,
      value: value as number,
      percentage: totalAssetValue > 0 ? ((value as number) / totalAssetValue) * 100 : 0
    }));

    return {
      totalNetWorth,
      breakdown,
      assetBreakdown,
      hasAssets: assets.length > 0,
      hasAccounts: accounts.length > 0
    };
  }, [totalAssetValue, totalAccountBalance, assets, accounts]);

  const renderMobileView = () => (
    <div className="flex flex-col space-y-4">
      {/* Main Value */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 rounded-lg">
          <DollarSign className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            €{netWorthData.totalNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Net Worth</p>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
      </div>

      {/* Breakdown - Mobile Optimized */}
      {netWorthData.breakdown.length > 0 ? (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Breakdown</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {netWorthData.breakdown.map((item) => (
              <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  €{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-100">
          <div className="text-center text-gray-500 py-4">
            <PieChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Add accounts and assets to track your net worth</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <DollarSign className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            €{netWorthData.totalNetWorth.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-600">Total Net Worth</span>
          </div>
        </div>
      </div>

      {netWorthData.breakdown.length > 0 && (
        <div className="flex-1">
          <div className="space-y-2">
            {netWorthData.breakdown.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    €{item.value.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500">
                    {item.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-gray-900 mb-2">
          €{netWorthData.totalNetWorth.toLocaleString()}
        </p>
        <p className="text-lg text-gray-600">Total Net Worth</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-900">
            €{totalAccountBalance.toLocaleString()}
          </p>
          <p className="text-sm text-green-700">Cash & Accounts</p>
          <p className="text-xs text-green-600 mt-1">
            {netWorthData.totalNetWorth > 0 
              ? `${((totalAccountBalance / netWorthData.totalNetWorth) * 100).toFixed(0)}% of total`
              : '0% of total'
            }
          </p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-900">
            €{totalAssetValue.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">Assets</p>
          <p className="text-xs text-blue-600 mt-1">
            {netWorthData.totalNetWorth > 0 
              ? `${((totalAssetValue / netWorthData.totalNetWorth) * 100).toFixed(0)}% of total`
              : '0% of total'
            }
          </p>
        </div>
      </div>

      {netWorthData.hasAssets && netWorthData.assetBreakdown.length > 0 && (
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Asset Breakdown
          </h4>
          <div className="space-y-3">
            {netWorthData.assetBreakdown.map((asset, index) => (
              <div key={asset.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${index * 360 / netWorthData.assetBreakdown.length}, 70%, 60%)` 
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">{asset.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    €{asset.value.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500">
                    {asset.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!netWorthData.hasAssets && !netWorthData.hasAccounts && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">Add accounts and assets to track your net worth</p>
          </div>
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
        {card.size === 'quarter' ? renderQuarterView() : renderDetailedView()}
      </div>
    </>
  );
};

export default NetWorthCard; 