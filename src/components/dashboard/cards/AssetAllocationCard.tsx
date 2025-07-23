import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';

interface AssetAllocationCardProps {
  card: any;
  financeData: any;
}

const AssetAllocationCard: React.FC<AssetAllocationCardProps> = ({ card, financeData }) => {
  const { assets } = financeData;

  // Calculate asset allocation data
  const allocationData = useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        allocationByCategory: [],
        targetAllocation: [],
        allocationHealth: 'unknown',
        hasData: false
      };
    }

    // Group assets by category
    const categoryTotals = assets.reduce((acc: any, asset: any) => {
      const category = asset.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          name: category,
          value: 0,
          count: 0
        };
      }
      acc[category].value += asset.value || 0;
      acc[category].count += 1;
      return acc;
    }, {});

    const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);

    // Calculate percentages and add target allocations
    const allocationByCategory = Object.values(categoryTotals).map((category: any) => {
      const percentage = totalValue > 0 ? (category.value / totalValue) * 100 : 0;
      
      // Define target allocations based on common portfolio theory
      let targetPercentage = 0;
      switch (category.name.toLowerCase()) {
        case 'property':
        case 'real estate':
          targetPercentage = 30;
          break;
        case 'stocks':
        case 'investment':
        case 'equity':
          targetPercentage = 40;
          break;
        case 'bonds':
        case 'fixed income':
          targetPercentage = 20;
          break;
        case 'cash':
        case 'savings':
          targetPercentage = 10;
          break;
        default:
          targetPercentage = 0;
      }

      const deviation = Math.abs(percentage - targetPercentage);
      const status = deviation <= 5 ? 'on-track' : 
                   deviation <= 15 ? 'moderate' : 'high-deviation';

      return {
        name: category.name,
        value: category.value,
        count: category.count,
        percentage: Math.round(percentage * 10) / 10,
        targetPercentage,
        deviation: Math.round(deviation * 10) / 10,
        status
      };
    }).sort((a: any, b: any) => b.value - a.value);

    // Calculate overall allocation health
    const highDeviations = allocationByCategory.filter((cat: any) => cat.status === 'high-deviation').length;
    const moderateDeviations = allocationByCategory.filter((cat: any) => cat.status === 'moderate').length;
    
    let allocationHealth: 'excellent' | 'good' | 'moderate' | 'poor';
    if (highDeviations === 0 && moderateDeviations <= 1) allocationHealth = 'excellent';
    else if (highDeviations === 0) allocationHealth = 'good';
    else if (highDeviations <= 1) allocationHealth = 'moderate';
    else allocationHealth = 'poor';

    // Create target allocation comparison data
    const targetAllocation = allocationByCategory.filter((cat: any) => cat.targetPercentage > 0);

    return {
      totalValue,
      allocationByCategory,
      targetAllocation,
      allocationHealth,
      hasData: true
    };
  }, [assets]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <Target className="h-4 w-4 text-green-600" />;
      case 'moderate': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'high-deviation': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      {allocationData.hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                €{allocationData.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Allocated</p>
            </div>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getHealthColor(allocationData.allocationHealth)}`}>
                {allocationData.allocationHealth === 'excellent' ? '✅' : 
                 allocationData.allocationHealth === 'good' ? '👍' :
                 allocationData.allocationHealth === 'moderate' ? '⚡' : '⚠️'}
                {allocationData.allocationHealth}
              </span>
              <p className="text-sm text-gray-600 mt-1">Health</p>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData.allocationByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                >
                  {allocationData.allocationByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `€${value.toLocaleString()} (${props.payload.percentage}%)`, 
                    name
                  ]}
                  labelStyle={{ color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1">
            {allocationData.allocationByCategory.slice(0, 3).map((category: any, index) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{category.name}</span>
                </div>
                <span className="font-medium">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm">No allocation data available</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {allocationData.hasData ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-900">
                €{allocationData.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Total Value</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-900">
                {allocationData.allocationByCategory.length}
              </p>
              <p className="text-sm text-green-700">Asset Classes</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-900">
                {allocationData.targetAllocation.length}
              </p>
              <p className="text-sm text-purple-700">Tracked Categories</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getHealthColor(allocationData.allocationHealth)}`}>
                {allocationData.allocationHealth === 'excellent' ? '✅' : 
                 allocationData.allocationHealth === 'good' ? '👍' :
                 allocationData.allocationHealth === 'moderate' ? '⚡' : '⚠️'}
                {allocationData.allocationHealth}
              </span>
              <p className="text-sm text-indigo-700 mt-1">Health Score</p>
            </div>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Chart Section */}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-4">Current vs Target Allocation</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationData.targetAllocation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value}%`, 
                      name === 'percentage' ? 'Current' : 'Target'
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="targetPercentage" fill="#E5E7EB" name="targetPercentage" radius={4} />
                  <Bar 
                    dataKey="percentage" 
                    fill="#3B82F6"
                    name="percentage"
                    radius={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Allocation Details */}
            <div className="w-80">
              <h4 className="font-medium text-gray-900 mb-4">Allocation Analysis</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {allocationData.allocationByCategory.map((category: any, index) => (
                  <div key={category.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <h5 className="font-medium text-gray-900">{category.name}</h5>
                          <p className="text-sm text-gray-600">{category.count} assets</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {category.percentage}%
                        </p>
                        <p className="text-sm text-gray-600">
                          €{category.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {category.targetPercentage > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Target: {category.targetPercentage}%</span>
                          <span className={`font-medium ${
                            category.status === 'on-track' ? 'text-green-600' :
                            category.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {category.deviation > 0 ? `±${category.deviation}%` : 'On target'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(category.status)}
                          <span className={`text-sm font-medium ${
                            category.status === 'on-track' ? 'text-green-600' :
                            category.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {category.status === 'on-track' ? 'Well allocated' :
                             category.status === 'moderate' ? 'Minor adjustment needed' :
                             'Significant rebalancing needed'}
                          </span>
                        </div>
                      </div>
                    )}

                    {category.targetPercentage === 0 && (
                      <div className="text-sm text-gray-500">
                        No target allocation set
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Rebalancing Suggestions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Rebalancing Tips</h5>
                <div className="space-y-2 text-sm">
                  {allocationData.allocationHealth === 'excellent' ? (
                    <p className="text-green-700">✅ Your portfolio is well balanced!</p>
                  ) : (
                    <>
                      {allocationData.allocationByCategory
                        .filter((cat: any) => cat.status === 'high-deviation' && cat.targetPercentage > 0)
                        .slice(0, 2)
                        .map((cat: any) => (
                          <p key={cat.name} className="text-gray-600">
                            • {cat.percentage > cat.targetPercentage ? 'Reduce' : 'Increase'} {cat.name} allocation
                          </p>
                        ))}
                      {allocationData.allocationByCategory.filter((cat: any) => cat.status === 'high-deviation').length === 0 && (
                        <p className="text-blue-700">Minor adjustments can improve balance</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No allocation data available</p>
            <p className="text-sm">Add assets to see allocation breakdown</p>
          </div>
        </div>
      )}
    </div>
  );

  return card.size === 'half' ? renderHalfView() : renderFullView();
};

export default AssetAllocationCard; 