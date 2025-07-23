import React, { useMemo, useState } from 'react';
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Settings, 
  DollarSign, 
  PiggyBank,
  Building2,
  Briefcase,
  Home,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface NetWorthProjectionCardProps {
  card: any;
  financeData: any;
}

const NetWorthProjectionCard: React.FC<NetWorthProjectionCardProps> = ({ card, financeData }) => {
  const { 
    accounts, 
    assets, 
    totalIncome, 
    totalSpending, 
    monthlySummaries,
    goals,
    users
  } = financeData;

  // Projection settings state
  const [projectionYears, setProjectionYears] = useState(10);
  const [scenarioType, setScenarioType] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [showAccounts, setShowAccounts] = useState(true);

  // Calculate comprehensive projections
  const projectionData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Calculate current account balances and asset values
    const currentAccountBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
    const currentAssetValue = assets.reduce((sum: number, asset: any) => sum + asset.value, 0);
    const currentNetWorth = currentAccountBalance + currentAssetValue;
    
    // Monthly cash flow
    const monthlySavings = totalIncome - totalSpending;
    
    // Growth rate assumptions based on scenario
    const growthRates = {
      conservative: {
        savings: 0.02,      // 2% annual
        checking: 0.01,     // 1% annual
        investment: 0.06,   // 6% annual
        retirement: 0.07,   // 7% annual
        realEstate: 0.03,   // 3% annual
        other: 0.02         // 2% annual
      },
      moderate: {
        savings: 0.025,     // 2.5% annual
        checking: 0.015,    // 1.5% annual
        investment: 0.08,   // 8% annual
        retirement: 0.085,  // 8.5% annual
        realEstate: 0.04,   // 4% annual
        other: 0.03         // 3% annual
      },
      aggressive: {
        savings: 0.03,      // 3% annual
        checking: 0.02,     // 2% annual
        investment: 0.10,   // 10% annual
        retirement: 0.10,   // 10% annual
        realEstate: 0.05,   // 5% annual
        other: 0.04         // 4% annual
      }
    };

    const rates = growthRates[scenarioType];
    
    // Categorize accounts and assets
    const accountsByType = accounts.reduce((acc: any, account: any) => {
      const type = account.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {});

    const assetsByCategory = assets.reduce((acc: any, asset: any) => {
      const category = asset.category?.toLowerCase() || 'other';
      const mappedCategory = category.includes('property') || category.includes('real estate') ? 'realEstate' : 'other';
      if (!acc[mappedCategory]) acc[mappedCategory] = [];
      acc[mappedCategory].push(asset);
      return acc;
    }, {});

    // Generate projections
    const projections = [];
    
    for (let year = 0; year <= projectionYears; year++) {
      const date = new Date(currentYear + year, currentMonth, 1);
      const yearLabel = year === 0 ? 'Current' : `Y${year}`;
      
      let yearData: any = {
        year: yearLabel,
        fullDate: date,
        totalNetWorth: 0,
        isCurrentYear: year === 0
      };

      // Project each account type
      Object.entries(accountsByType).forEach(([type, typeAccounts]: [string, any]) => {
        const currentValue = typeAccounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
        
        // Apply growth rate and additional contributions
        let projectedValue = currentValue;
        
        if (year > 0) {
          // Compound growth
          const growthRate = rates[type as keyof typeof rates] || rates.other;
          projectedValue = currentValue * Math.pow(1 + growthRate, year);
          
          // Add accumulated savings (assuming portion goes to each account type)
          const contributionRatio = type === 'investment' ? 0.4 : 
                                  type === 'retirement' ? 0.3 : 
                                  type === 'savings' ? 0.2 : 0.1;
          const totalContributions = monthlySavings * 12 * year * contributionRatio;
          projectedValue += totalContributions;
        }
        
        yearData[type] = Math.max(projectedValue, 0);
        yearData.totalNetWorth += yearData[type];
      });

      // Project assets
      Object.entries(assetsByCategory).forEach(([category, categoryAssets]: [string, any]) => {
        const currentValue = categoryAssets.reduce((sum: number, asset: any) => sum + asset.value, 0);
        
        let projectedValue = currentValue;
        if (year > 0) {
          const growthRate = rates[category as keyof typeof rates] || rates.other;
          projectedValue = currentValue * Math.pow(1 + growthRate, year);
        }
        
        yearData[category] = Math.max(projectedValue, 0);
        yearData.totalNetWorth += yearData[category];
      });

      projections.push(yearData);
    }

    // Calculate key metrics
    const finalNetWorth = projections[projections.length - 1]?.totalNetWorth || currentNetWorth;
    const totalGrowth = finalNetWorth - currentNetWorth;
    const annualizedGrowthRate = projectionYears > 0 && currentNetWorth > 0 ? 
      Math.pow(finalNetWorth / currentNetWorth, 1 / projectionYears) - 1 : 0;

    // Find milestone years
    const millionaireMilestone = projections.find(p => p && p.totalNetWorth >= 1000000);
    const doubleNetWorthMilestone = currentNetWorth > 0 
      ? projections.find(p => p && p.totalNetWorth >= currentNetWorth * 2)
      : null;

    // Calculate largest growth drivers
    const finalYear = projections[projections.length - 1];
    const growthDrivers = finalYear && finalYear.totalNetWorth > 0 
      ? Object.entries(finalYear)
          .filter(([key]) => !['year', 'fullDate', 'totalNetWorth', 'isCurrentYear'].includes(key))
          .map(([key, value]) => {
            const numValue = Number(value) || 0;
            return {
              category: key,
              value: numValue,
              percentage: (numValue / finalYear.totalNetWorth) * 100
            };
          })
          .sort((a, b) => b.value - a.value)
      : [];

    return {
      projections,
      currentNetWorth,
      finalNetWorth,
      totalGrowth,
      annualizedGrowthRate: annualizedGrowthRate * 100,
      millionaireMilestone,
      doubleNetWorthMilestone,
      growthDrivers: growthDrivers.slice(0, 4),
      monthlyContributionNeeded: monthlySavings
    };
  }, [accounts, assets, totalIncome, totalSpending, projectionYears, scenarioType]);

  // Goal integration
  const goalAnalysis = useMemo(() => {
    if (!goals?.length) return { achievableGoals: [], riskGoals: [] };

    const achievableGoals = goals.filter((goal: any) => {
      const targetYear = new Date(goal.targetDate).getFullYear();
      const yearsToTarget = targetYear - new Date().getFullYear();
      const projectedAtTarget = projectionData.projections[Math.min(yearsToTarget, projectionData.projections.length - 1)];
      return projectedAtTarget && projectedAtTarget.totalNetWorth >= goal.targetAmount;
    });

    const riskGoals = goals.filter((goal: any) => !achievableGoals.includes(goal));

    return { achievableGoals, riskGoals };
  }, [goals, projectionData.projections]);

  const renderQuarterView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-lg font-bold text-purple-900">
            €{projectionData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-xs text-purple-700">Current</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-900">
            €{projectionData.finalNetWorth.toLocaleString()}
          </p>
          <p className="text-xs text-green-700">{projectionYears}Y Target</p>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span className="text-xs text-gray-600">Growth Rate</span>
          <span className="text-xs font-medium text-blue-600">
            {projectionData.annualizedGrowthRate.toFixed(1)}%/year
          </span>
        </div>
        
        {projectionData.millionaireMilestone && (
          <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
            <span className="text-xs text-gray-600">€1M Milestone</span>
            <span className="text-xs font-medium text-yellow-700">
              {projectionData.millionaireMilestone.year}
            </span>
          </div>
        )}

        <div className="mt-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Top Growth Driver</p>
          <div className="text-xs text-gray-600">
            {projectionData.growthDrivers?.[0] ? (
              <>
                {projectionData.growthDrivers[0].category.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                : {projectionData.growthDrivers[0].percentage.toFixed(1)}%
              </>
            ) : (
              'Not enough data'
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHalfView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">
            €{projectionData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">
            +{projectionData.annualizedGrowthRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Annual Growth</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">
            €{projectionData.finalNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">{projectionYears}Y Projection</p>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projectionData.projections}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 11 }}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                `€${(value as number).toLocaleString()}`, 
                                   name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())
              ]}
              labelStyle={{ color: '#374151' }}
            />
            <Area
              type="monotone"
              dataKey="totalNetWorth"
              stackId="1"
              stroke="#8B5CF6"
              fill="rgba(139, 92, 246, 0.1)"
              strokeWidth={3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select 
              value={projectionYears}
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
              <option value={15}>15 Years</option>
              <option value={20}>20 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <select 
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          <button
            onClick={() => setShowAccounts(!showAccounts)}
            className={`text-xs px-3 py-1 rounded ${
              showAccounts ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Show Breakdown
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-900">
            €{projectionData.currentNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-purple-700">Current Net Worth</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">
            +{projectionData.annualizedGrowthRate.toFixed(1)}%
          </p>
          <p className="text-sm text-green-700">Annual Growth Rate</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">
            €{projectionData.finalNetWorth.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">{projectionYears}-Year Projection</p>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <PiggyBank className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-indigo-900">
            €{projectionData.totalGrowth.toLocaleString()}
          </p>
          <p className="text-sm text-indigo-700">Total Growth</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Chart Section */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-4">
            Net Worth Projection - {scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={projectionData.projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `€${(value as number).toLocaleString()}`, 
                  name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())
                ]}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              
              {showAccounts ? (
                <>
                  {['investment', 'retirement', 'savings', 'checking', 'realEstate', 'other'].map((type, index) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stackId="1"
                      stroke={['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6B7280'][index]}
                      fill={['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6B7280'][index]}
                      fillOpacity={0.6}
                    />
                  ))}
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="totalNetWorth"
                  stroke="#8B5CF6"
                  fill="rgba(139, 92, 246, 0.2)"
                  strokeWidth={3}
                />
              )}
              
              {/* Milestone reference lines */}
              {projectionData.millionaireMilestone && (
                <ReferenceLine 
                  y={1000000}
                  stroke="#10B981" 
                  strokeDasharray="5 5"
                                     label={{ value: "€1M Milestone", position: "top" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights & Goals Section */}
        <div className="w-80 space-y-4">
          {/* Growth Drivers */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Growth Drivers</h4>
            <div className="space-y-2">
              {projectionData.growthDrivers.map((driver: any, index: number) => (
                <div key={driver.category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">
                                         {driver.category.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {driver.percentage.toFixed(1)}%
                    </span>
                    <div className="text-xs text-gray-500">
                      €{driver.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Milestones</h4>
            <div className="space-y-3">
              {projectionData.millionaireMilestone && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">€1M Net Worth</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    Projected in {projectionData.millionaireMilestone.year}
                  </p>
                </div>
              )}
              
              {projectionData.doubleNetWorthMilestone && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Double Net Worth</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Projected in {projectionData.doubleNetWorthMilestone.year}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Goal Analysis */}
          {(goalAnalysis.achievableGoals.length > 0 || goalAnalysis.riskGoals.length > 0) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Goal Analysis</h4>
              <div className="space-y-2">
                {goalAnalysis.achievableGoals.slice(0, 2).map((goal: any) => (
                  <div key={goal.id} className="p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-900">{goal.name}</span>
                    </div>
                    <p className="text-xs text-green-700">On track for {new Date(goal.targetDate).getFullYear()}</p>
                  </div>
                ))}
                
                {goalAnalysis.riskGoals.slice(0, 2).map((goal: any) => (
                  <div key={goal.id} className="p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-medium text-red-900">{goal.name}</span>
                    </div>
                    <p className="text-xs text-red-700">May need increased savings</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scenario Comparison */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Scenario Impact</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Conservative: {scenarioType === 'conservative' ? 'Current' : 'Lower returns, safer'}</div>
              <div>Moderate: {scenarioType === 'moderate' ? 'Current' : 'Balanced growth'}</div>
              <div>Aggressive: {scenarioType === 'aggressive' ? 'Current' : 'Higher risk/reward'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on card size
  switch (card.size) {
    case 'quarter':
      return renderQuarterView();
    case 'half':
      return renderHalfView();
    case 'full':
    case 'tall':
      return renderFullView();
    default:
      return renderHalfView();
  }
};

export default NetWorthProjectionCard; 