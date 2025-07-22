import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar,
  Target,
  Building,
  Car,
  Home,
  Wallet,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  ChevronDown,
  Banknote
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { useFinanceData } from '../hooks/useFinanceData';
import { Account, VestingSchedule } from '../types';
import Debug from './Debug';

const Dashboard: React.FC = () => {
  const { 
    transactions, 
    users, 
    assets, 
    goals,
    accounts,
    vestingSchedules,
    totalIncome, 
    totalSpending, 
    totalAssetValue,
    totalAccountBalance,
    monthlySavings, 
    savingsRate, 
    insights,
    monthlyAllocations,
    addVestingSchedule,
    addMonthlyAllocation,
    updateAccount
  } = useFinanceData();

  // State for modals
  const [showVestingModal, setShowVestingModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedVestingYear, setSelectedVestingYear] = useState(new Date().getFullYear());

  // State for forms
  const [vestingFormData, setVestingFormData] = useState({
    userId: users[0]?.id || '',
    monthlyAmount: '',
    startDate: '',
    endDate: '',
    description: '',
    cliffAmount: '',
    cliffPeriod: '6'
  });

  const [allocationFormData, setAllocationFormData] = useState(
    accounts.reduce((acc: Record<string, { currentBalance: string; newAllocation: string }>, account: Account) => ({
      ...acc,
      [account.id]: { currentBalance: account.balance.toString(), newAllocation: '' }
    }), {} as Record<string, { currentBalance: string; newAllocation: string }>)
  );

  // Update allocation form when accounts change
  React.useEffect(() => {
    setAllocationFormData(accounts.reduce((acc: Record<string, { currentBalance: string; newAllocation: string }>, account: Account) => ({
      ...acc,
      [account.id]: { 
        currentBalance: account.balance.toString(), 
        newAllocation: allocationFormData[account.id]?.newAllocation || '' 
      }
    }), {} as Record<string, { currentBalance: string; newAllocation: string }>));
  }, [accounts]);

  // Generate monthly account data based on actual monthly allocations
  const monthlyAccountData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Find allocation for this month
      const monthAllocation = monthlyAllocations.find((alloc: any) => alloc.month === monthKey);
      
      const monthData = {
        month: monthName,
        monthKey,
        main: 0,
        savings: 0,
        investment: 0,
        retirement: 0,
        other: 0
      };
      
              if (monthAllocation) {
          // Use historical allocation data
          accounts.forEach((account: Account) => {
            const allocation = monthAllocation.allocations[account.id];
            if (allocation) {
              switch (account.type) {
                case 'main':
                  monthData.main += allocation;
                  break;
                case 'savings':
                  monthData.savings += allocation;
                  break;
                case 'investment':
                  monthData.investment += allocation;
                  break;
                case 'retirement':
                  monthData.retirement += allocation;
                  break;
                default:
                  monthData.other += allocation;
                  break;
              }
            }
          });
        } else if (i === 0) {
          // For current month with no allocation, use current balances
          accounts.forEach((account: Account) => {
          switch (account.type) {
            case 'main':
              monthData.main += account.balance;
              break;
            case 'savings':
              monthData.savings += account.balance;
              break;
            case 'investment':
              monthData.investment += account.balance;
              break;
            case 'retirement':
              monthData.retirement += account.balance;
              break;
            default:
              monthData.other += account.balance;
              break;
          }
        });
      }
      // For past months without allocation data, we show 0 (no dummy data)
      
      months.push(monthData);
    }
    
    return months;
  }, [accounts, monthlyAllocations]);

  // Generate vesting data for charts
  const vestingChartData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    let cumulativeVesting = 0;
    
    // Generate 12 months of data for selected year
    for (let i = 0; i < 12; i++) {
      const date = new Date(selectedVestingYear, i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      let monthlyVesting = 0;
      
      // Calculate vesting for this month
      vestingSchedules.forEach((schedule: VestingSchedule) => {
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        
        // Check if this month falls within the vesting period
        if (date >= startDate && date <= endDate) {
          monthlyVesting += schedule.monthlyAmount;
          
          // Add cliff amount if applicable (only once at the cliff period)
          const monthsVested = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          if (schedule.cliffAmount && schedule.cliffPeriod && monthsVested === schedule.cliffPeriod) {
            monthlyVesting += schedule.cliffAmount;
          }
        }
      });
      
      // Add monthly vesting to cumulative total
      cumulativeVesting += monthlyVesting;
      
      // Calculate net worth for this month (base net worth + accumulated savings)
      let netWorth = totalAssetValue;
      if (date <= currentDate) {
        const monthsFromStart = (date.getFullYear() - currentDate.getFullYear()) * 12 + (date.getMonth() - currentDate.getMonth());
        netWorth += Math.max(0, monthsFromStart * monthlySavings);
      }
      
      months.push({
        month: monthName,
        vesting: cumulativeVesting,
        netWorth: Math.max(netWorth, totalAssetValue),
        total: cumulativeVesting + Math.max(netWorth, totalAssetValue)
      });
    }
    
    return months;
  }, [vestingSchedules, selectedVestingYear, totalAssetValue, monthlySavings]);

  // Available years for vesting dropdown
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
    
    // Add years from vesting schedules
    vestingSchedules.forEach(schedule => {
      const startYear = new Date(schedule.startDate).getFullYear();
      const endYear = new Date(schedule.endDate).getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        if (!years.includes(year)) {
          years.push(year);
        }
      }
    });
    
    return years.sort();
  }, [vestingSchedules]);

  // Expense trend data (last 6 months)
  const expenseData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Filter transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear() &&
               t.amount < 0; // Only expenses
      });
      
      const totalExpenses = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      months.push({
        month: monthName,
        expenses: totalExpenses,
      });
    }
    
    return months;
  }, [transactions]);

  // Net worth breakdown data
  const netWorthData = useMemo(() => {
    const assetsByCategory = assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    return Object.entries(assetsByCategory).map(([category, value], index) => ({
      name: category,
      value,
      color: colors[index % colors.length]
    }));
  }, [assets]);

  // Handle vesting form submission
  const handleVestingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monthlyAmount = parseFloat(vestingFormData.monthlyAmount);
    const cliffAmount = vestingFormData.cliffAmount ? parseFloat(vestingFormData.cliffAmount) : undefined;
    
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      alert('Please enter a valid monthly amount');
      return;
    }
    
    if (!vestingFormData.startDate || !vestingFormData.endDate) {
      alert('Please select start and end dates');
      return;
    }
    
    if (new Date(vestingFormData.startDate) >= new Date(vestingFormData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    await addVestingSchedule({
      userId: vestingFormData.userId,
      monthlyAmount,
      startDate: vestingFormData.startDate,
      endDate: vestingFormData.endDate,
      description: vestingFormData.description,
      cliffAmount,
      cliffPeriod: cliffAmount ? parseInt(vestingFormData.cliffPeriod) : undefined
    });

    setVestingFormData({
      userId: users[0]?.id || '',
      monthlyAmount: '',
      startDate: '',
      endDate: '',
      description: '',
      cliffAmount: '',
      cliffPeriod: '6'
    });
    setShowVestingModal(false);
  };

  // Handle monthly allocation submission
  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const allocations: Record<string, number> = {};
    let totalAllocated = 0;
    
    // Validate and calculate allocations
    for (const accountId in allocationFormData) {
      const monthlyAllocation = parseFloat(allocationFormData[accountId].newAllocation);
      if (!isNaN(monthlyAllocation) && monthlyAllocation > 0) {
        const currentBalance = parseFloat(allocationFormData[accountId].currentBalance);
        const newBalance = currentBalance + monthlyAllocation;
        
        allocations[accountId] = newBalance;
        totalAllocated += monthlyAllocation;
        
        // Update the account balance by adding the allocation to current balance
        await updateAccount(accountId, { balance: newBalance });
      }
    }
    
    if (totalAllocated === 0) {
      alert('Please allocate amounts to at least one account');
      return;
    }
    
    // Save monthly allocation
    await addMonthlyAllocation({
      month: currentMonth,
      totalAmount: totalAllocated,
      allocations,
      timestamp: new Date().toISOString()
    });
    
    // Reset form
    setAllocationFormData(accounts.reduce((acc: Record<string, { currentBalance: string; newAllocation: string }>, account: Account) => ({
      ...acc,
      [account.id]: { currentBalance: allocations[account.id]?.toString() || account.balance.toString(), newAllocation: '' }
    }), {}));
    setShowAllocationModal(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'real estate':
        return Home;
      case 'vehicles':
        return Car;
      case 'investments':
        return TrendingUp;
      case 'cash':
        return Wallet;
      default:
        return Building;
    }
  };

  const getGoalStatus = (goal: any) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) {
      return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
    } else if (daysLeft <= 0) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    } else if (daysLeft <= 30) {
      return { status: 'urgent', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock };
    } else {
      return { status: 'on-track', color: 'text-blue-600', bg: 'bg-blue-100', icon: Target };
    }
  };

  return (
    <div className="space-y-6">
      <Debug />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
          <p className="text-gray-600">
            Overview of your household's financial health and progress
          </p>
        </div>
        <button
          onClick={() => setShowAllocationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Banknote className="h-4 w-4" />
          Monthly Allocation
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-900">€{totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Spending</p>
              <p className="text-2xl font-bold text-gray-900">€{totalSpending.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Savings</p>
              <p className="text-2xl font-bold text-gray-900">€{monthlySavings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{savingsRate.toFixed(1)}% rate</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Worth</p>
              <p className="text-2xl font-bold text-gray-900">€{totalAssetValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Expenses']} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goals Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Goals</h3>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('switchToGoals'))}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {goals.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {goals.slice(0, 4).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const status = getGoalStatus(goal);
                const StatusIcon = status.icon;
                
                return (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{goal.name}</h4>
                      <div className={`p-1 rounded-full ${status.bg}`}>
                        <StatusIcon className={`h-3 w-3 ${status.color}`} />
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>€{goal.currentAmount.toLocaleString()}</span>
                      <span>€{goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
              
              {goals.length > 4 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('switchToGoals'))}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                  >
                    View all {goals.length} goals
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No goals set yet</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('switchToGoals'))}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Set Your First Goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Accounts - Stacked Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Account Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAccountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`€${Number(value).toLocaleString()}`, name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="main" stackId="a" fill="#3B82F6" name="Main" />
              <Bar dataKey="savings" stackId="a" fill="#10B981" name="Savings" />
              <Bar dataKey="investment" stackId="a" fill="#F59E0B" name="Investment" />
              <Bar dataKey="retirement" stackId="a" fill="#8B5CF6" name="Retirement" />
              <Bar dataKey="other" stackId="a" fill="#6B7280" name="Other" />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Main</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Savings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Investment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Retirement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Other</span>
            </div>
          </div>
        </div>

        {/* Asset Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assets Overview</h3>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('switchToAssets'))}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {assets.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {assets.slice(0, 5).map((asset) => {
                const IconComponent = getCategoryIcon(asset.category);
                const percentage = totalAssetValue > 0 ? (asset.value / totalAssetValue) * 100 : 0;
                
                return (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{asset.name}</h4>
                        <p className="text-xs text-gray-500">{asset.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">€{asset.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
              
              {assets.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('switchToAssets'))}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                  >
                    View all {assets.length} assets
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No assets tracked yet</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('switchToAssets'))}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Add Your First Asset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Net Worth Breakdown */}
      {netWorthData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={netWorthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {netWorthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {netWorthData.map((item, index) => {
                const percentage = totalAssetValue > 0 ? (item.value / totalAssetValue) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">€{item.value.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Financial Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.value && (
                  <p className={`text-lg font-bold ${
                    insight.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    €{insight.value.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Vesting Tracker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Share Vesting Tracker</h3>
            <p className="text-sm text-gray-600">Track your equity vesting schedules and upcoming payments</p>
          </div>
          <div className="flex items-center gap-3">
            {availableYears.length > 1 && (
              <div className="relative">
                <select
                  value={selectedVestingYear}
                  onChange={(e) => setSelectedVestingYear(parseInt(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button
              onClick={() => setShowVestingModal(true)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {vestingSchedules.length > 0 ? (
          <div className="space-y-6">
            {/* Vesting Schedule List */}
            <div className="space-y-4">
              {vestingSchedules.slice(0, 3).map((schedule) => {
                const startDate = new Date(schedule.startDate);
                const endDate = new Date(schedule.endDate);
                const currentDate = new Date();
                const totalMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                const vestedMonths = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                const progressPercentage = Math.min((vestedMonths / totalMonths) * 100, 100);
                const totalVested = Math.min(vestedMonths * schedule.monthlyAmount, totalMonths * schedule.monthlyAmount);
                const totalValue = totalMonths * schedule.monthlyAmount + (schedule.cliffAmount || 0);
                
                // Check if cliff period has passed
                const cliffMonths = schedule.cliffPeriod || 0;
                const cliffPassed = vestedMonths >= cliffMonths;
                const cliffAmount = cliffPassed ? (schedule.cliffAmount || 0) : 0;
                
                return (
                  <div key={schedule.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{schedule.description || 'Vesting Schedule'}</h4>
                        <p className="text-sm text-gray-600">
                          €{schedule.monthlyAmount.toLocaleString()}/month
                          {schedule.cliffAmount && (
                            <span className="ml-2">
                              + €{schedule.cliffAmount.toLocaleString()} cliff {cliffPassed ? '(paid)' : `(${cliffMonths}mo)`}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">€{(totalVested + cliffAmount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">of €{totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{vestedMonths} of {totalMonths} months</span>
                      <span>{progressPercentage.toFixed(1)}% vested</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {currentDate < startDate ? (
                        <span>Starts {startDate.toLocaleDateString()}</span>
                      ) : currentDate > endDate ? (
                        <span className="text-green-600">Fully vested</span>
                      ) : (
                        <span>Ends {endDate.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {vestingSchedules.length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('switchToUsers'))}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                  >
                    View all {vestingSchedules.length} schedules
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Vesting Chart */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Vesting & Net Worth Progress ({selectedVestingYear})</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vestingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`€${Number(value).toLocaleString()}`, name]}
                    labelFormatter={(label) => `${label} ${selectedVestingYear}`}
                  />
                  <Bar dataKey="vesting" stackId="a" fill="#10B981" name="Vesting Amount" />
                  <Bar dataKey="netWorth" stackId="a" fill="#3B82F6" name="Net Worth" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Chart Legend */}
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Monthly Vesting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Net Worth</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">No vesting schedules tracked yet</p>
            <button
              onClick={() => setShowVestingModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Add Vesting Schedule
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToExpenses'))}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add Expenses</h4>
                <p className="text-sm text-gray-600">Track your spending</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToGoals'))}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set Goals</h4>
                <p className="text-sm text-gray-600">Plan your future</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchToAssets'))}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Track Assets</h4>
                <p className="text-sm text-gray-600">Monitor net worth</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Vesting Modal */}
      {showVestingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Vesting Schedule</h2>
                <button
                  onClick={() => setShowVestingModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleVestingSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={vestingFormData.userId}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Amount (€)
                </label>
                <input
                  type="number"
                  value={vestingFormData.monthlyAmount}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, monthlyAmount: e.target.value }))}
                  placeholder="e.g., 5000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={vestingFormData.startDate}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={vestingFormData.endDate}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={vestingFormData.description}
                  onChange={(e) => setVestingFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Company Stock Options"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliff Amount (€) - Optional
                  </label>
                  <input
                    type="number"
                    value={vestingFormData.cliffAmount}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, cliffAmount: e.target.value }))}
                    placeholder="e.g., 50000"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliff Period (months)
                  </label>
                  <select
                    value={vestingFormData.cliffPeriod}
                    onChange={(e) => setVestingFormData(prev => ({ ...prev, cliffPeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!vestingFormData.cliffAmount}
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Vesting Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowVestingModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Monthly Allocation</h2>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Allocate this month's income across your accounts
              </p>
            </div>
            <form onSubmit={handleAllocationSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                {accounts.map((account) => (
                  <div key={account.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{account.type} Account</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="font-semibold text-gray-900">€{account.balance.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Balance (€)
                        </label>
                        <input
                          type="number"
                          value={allocationFormData[account.id]?.currentBalance || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Allocation (€)
                        </label>
                        <input
                          type="number"
                          value={allocationFormData[account.id]?.newAllocation || ''}
                          onChange={(e) => setAllocationFormData(prev => ({
                            ...prev,
                            [account.id]: {
                              ...prev[account.id],
                              newAllocation: e.target.value
                            }
                          }))}
                          placeholder="Enter allocation amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {allocationFormData[account.id]?.newAllocation && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-700">
                          New Balance: €
                          {(
                            parseFloat(allocationFormData[account.id].currentBalance) + 
                            parseFloat(allocationFormData[account.id].newAllocation)
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Monthly Allocation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocationModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;