import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Home, Car, Briefcase } from 'lucide-react';

interface AssetsOverviewCardProps {
  card: any;
  financeData: any;
}

const AssetsOverviewCard: React.FC<AssetsOverviewCardProps> = ({ card, financeData }) => {
  const { assets, users } = financeData;

  // Calculate assets overview data
  const assetsData = useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        assetsByCategory: [],
        assetsByUser: [],
        assetsWithDetails: [],
        diversificationScore: 0,
        hasData: false
      };
    }

    // Process assets and group by category
    const categoryTotals = assets.reduce((acc: any, asset: any) => {
      const category = asset.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          name: category,
          value: 0,
          count: 0,
          assets: []
        };
      }
      acc[category].value += asset.value || 0;
      acc[category].count += 1;
      acc[category].assets.push(asset);
      return acc;
    }, {});

    // Group by user/owner
    const userTotals = assets.reduce((acc: any, asset: any) => {
      const userId = asset.userId || 'Household';
      const userName = userId === 'Household' ? 'Household' : 
        users.find((u: any) => u.id === userId)?.name || `User ${userId}`;
      
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: userName,
          value: 0,
          count: 0,
          assets: []
        };
      }
      acc[userId].value += asset.value || 0;
      acc[userId].count += 1;
      acc[userId].assets.push(asset);
      return acc;
    }, {});

    const assetsByCategory = Object.values(categoryTotals)
      .sort((a: any, b: any) => b.value - a.value);
    
    const assetsByUser = Object.values(userTotals)
      .sort((a: any, b: any) => b.value - a.value);

    const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);

    // Calculate diversification score (0-100)
    // More categories = better diversification
    const numCategories = assetsByCategory.length;
    const maxCategories = 8; // Ideal number of categories
    const categoryScore = Math.min((numCategories / maxCategories) * 50, 50);

    // More even distribution = better diversification
         const largestCategory = (assetsByCategory[0] as any)?.value || 0;
    const concentrationRatio = totalValue > 0 ? (largestCategory / totalValue) : 0;
    const distributionScore = Math.max(0, 50 - (concentrationRatio * 50));

    const diversificationScore = Math.round(categoryScore + distributionScore);

    // Add details to assets including performance indicators
    const assetsWithDetails = assets.map((asset: any) => {
      // Calculate simple performance metrics
      const purchaseValue = asset.purchaseValue || asset.value;
      const currentValue = asset.value || 0;
      const gain = currentValue - purchaseValue;
      const gainPercent = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

      return {
        ...asset,
        gain,
        gainPercent,
        performance: gainPercent >= 10 ? 'excellent' : 
                    gainPercent >= 5 ? 'good' :
                    gainPercent >= 0 ? 'fair' : 'poor'
      };
    }).sort((a: any, b: any) => b.value - a.value);

    return {
      totalValue,
      assetsByCategory,
      assetsByUser,
      assetsWithDetails,
      diversificationScore,
      hasData: true
    };
  }, [assets, users]);

  const getAssetIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'property':
      case 'real estate':
        return Home;
      case 'vehicle':
      case 'car':
      case 'vehicles':
        return Car;
      case 'investment':
      case 'stocks':
      case 'bonds':
        return Briefcase;
      default:
        return DollarSign;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {assetsData.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                €{assetsData.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Assets</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${
                assetsData.diversificationScore >= 70 ? 'text-green-600' :
                assetsData.diversificationScore >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {assetsData.diversificationScore}/100
              </p>
              <p className="text-sm text-gray-600">Diversification</p>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetsData.assetsByCategory.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {assetsData.assetsByCategory.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`€${value.toLocaleString()}`, 'Value']}
                  labelStyle={{ color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

                     <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
             {assetsData.assetsByCategory.slice(0, 4).map((category: any, index) => (
               <div key={category.name} className="flex items-center gap-1">
                 <div 
                   className="w-2 h-2 rounded-full"
                   style={{ backgroundColor: COLORS[index % COLORS.length] }}
                 />
                 <span className="truncate">{category.name}</span>
               </div>
             ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No assets data available</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {assetsData.hasData ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                €{assetsData.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Total Value</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                {assetsData.assetsWithDetails.length}
              </p>
              <p className="text-sm text-green-700">Assets</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-900">
                {assetsData.assetsByCategory.length}
              </p>
              <p className="text-sm text-purple-700">Categories</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                assetsData.diversificationScore >= 70 ? 'bg-green-100 text-green-800' :
                assetsData.diversificationScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {assetsData.diversificationScore >= 70 ? '✅' : 
                 assetsData.diversificationScore >= 50 ? '⚡' : '⚠️'}
                {assetsData.diversificationScore}/100
              </div>
              <p className="text-sm text-indigo-700 mt-1">Diversification</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">Asset Distribution by Category</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetsData.assetsByCategory} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`€${value.toLocaleString()}`, 'Value']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3B82F6"
                    radius={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Details */}
            <div className="w-96">
              <h4 className="font-medium text-gray-900 mb-4">Top Assets</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {assetsData.assetsWithDetails.slice(0, 8).map((asset: any) => {
                  const AssetIcon = getAssetIcon(asset.category);
                  return (
                    <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <AssetIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{asset.name}</h5>
                            <p className="text-sm text-gray-600">{asset.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            €{asset.value.toLocaleString()}
                          </p>
                          {asset.gainPercent !== 0 && (
                            <div className="flex items-center gap-1">
                              {asset.gain >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs font-medium ${
                                asset.gain >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {asset.gain >= 0 ? '+' : ''}€{asset.gain.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Owner:</span>
                          <span className="font-medium ml-1">
                            {users.find((u: any) => u.id === asset.userId)?.name || 'Household'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Performance:</span>
                          <span className={`font-medium ml-1 ${
                            asset.performance === 'excellent' ? 'text-green-600' :
                            asset.performance === 'good' ? 'text-blue-600' :
                            asset.performance === 'fair' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {asset.gainPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diversification Insights */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Diversification Insights</h5>
                <div className="space-y-2 text-sm">
                  {assetsData.diversificationScore >= 70 ? (
                    <p className="text-green-700">✅ Well diversified across asset types</p>
                  ) : assetsData.diversificationScore >= 50 ? (
                    <p className="text-yellow-700">⚡ Consider diversifying into more asset categories</p>
                  ) : (
                    <p className="text-red-700">⚠️ High concentration risk - diversify holdings</p>
                  )}
                  
                                     <p className="text-gray-600">
                     {assetsData.assetsByCategory.length} categories • 
                     Top category: {(((assetsData.assetsByCategory[0] as any)?.value / assetsData.totalValue) * 100).toFixed(0)}%
                   </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No assets data available</p>
            <p className="text-sm">Add assets in the Assets tab to track your wealth</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default AssetsOverviewCard; 