// Dashboard Card Types - Complete Rewrite
// Based on comprehensive financial dashboard specification

export type CardType = 
  // Essential Financial Metrics
  | 'monthly-income'
  | 'monthly-spending' 
  | 'monthly-savings'
  | 'net-worth'
  | 'net-worth-growth'
  | 'cash-flow-forecast'
  
  // Spending Analysis
  | 'expense-categories'
  | 'top-spending-categories'
  | 'budgets-tracking'
  
  // Goals & Planning
  | 'financial-goals'
  | 'emergency-fund'
  | 'financial-health-score'
  
  // Accounts & Assets
  | 'account-progress'
  | 'account-list'
  | 'assets-overview'
  | 'asset-allocation'
  
  // Advanced Features
  | 'vesting-schedules'
  | 'goal-timeline'
  | 'recent-transactions'
  | 'subscription-tracker'
  | 'peer-benchmarking'
  | 'household-contributions'
  | 'cash-flow-insights'
  | 'alerts-recommendations'
  | 'dashboard-customization';

export type CardSize = 'quarter' | 'half' | 'full' | 'tall';

export type ChartType = 'line' | 'bar' | 'pie' | 'number' | 'progress' | 'table' | 'gantt';

export type TimeRange = 'current' | '3months' | '6months' | '12months' | 'ytd' | 'custom';

export interface DashboardCard {
  id: string;
  type: CardType;
  title?: string;
  size: CardSize;
  visible?: boolean;
  position: {
    x: number;
    y: number;
    w?: number;
    h?: number;
  };
  config: {
    title?: string;
    timeRange?: TimeRange;
    chartType?: ChartType;
    showActions?: boolean;
    visible?: boolean;
    customSettings?: Record<string, any>;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  cards: DashboardCard[];
  settings: {
    gridColumns: number;
    cardSpacing: number;
    theme: 'light' | 'dark';
  };
}

// Configuration interface for useDashboardConfig hook
export interface DashboardConfiguration {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  layoutConfig: {
    cards: DashboardCard[];
    settings: {
      gridColumns: number;
      cardSpacing: number;
      theme: 'light' | 'dark';
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Card Information for UI
export interface CardDefinition {
  type: CardType;
  title: string;
  description: string;
  defaultSize: CardSize;
  category: 'essential' | 'spending' | 'planning' | 'assets' | 'advanced';
  dataSource: string[];
  chartTypes: ChartType[];
}

// Default cards for useDashboardConfig hook
export const DEFAULT_CARDS: Partial<DashboardCard>[] = [
  {
    type: 'monthly-income',
    size: 'quarter',
    config: { chartType: 'number', timeRange: 'current', visible: true }
  },
  {
    type: 'monthly-spending',
    size: 'quarter',
    config: { chartType: 'number', timeRange: 'current', visible: true }
  },
  {
    type: 'monthly-savings',
    size: 'quarter',
    config: { chartType: 'number', timeRange: 'current', visible: true }
  },
  {
    type: 'net-worth',
    size: 'quarter',
    config: { chartType: 'number', timeRange: 'current', visible: true }
  }
];

// Predefined Card Definitions
export const CARD_DEFINITIONS: CardDefinition[] = [
  // Essential Financial Metrics
  {
    type: 'monthly-income',
    title: 'Monthly Income',
    description: 'Total income for the selected month across all sources',
    defaultSize: 'quarter',
    category: 'essential',
    dataSource: ['users.monthly_income', 'transactions'],
    chartTypes: ['number', 'bar']
  },
  {
    type: 'monthly-spending',
    title: 'Monthly Spending',
    description: 'Total expenses for the selected month',
    defaultSize: 'quarter',
    category: 'essential',
    dataSource: ['transactions'],
    chartTypes: ['number', 'bar']
  },
  {
    type: 'monthly-savings',
    title: 'Monthly Savings',
    description: 'Difference between income and spending with savings rate',
    defaultSize: 'quarter',
    category: 'essential',
    dataSource: ['calculated'],
    chartTypes: ['number', 'progress']
  },
  {
    type: 'net-worth',
    title: 'Net Worth',
    description: 'Total household wealth snapshot',
    defaultSize: 'quarter',
    category: 'essential',
    dataSource: ['assets', 'accounts', 'monthly_summaries'],
    chartTypes: ['number', 'progress']
  },
  {
    type: 'net-worth-growth',
    title: 'Net Worth Growth',
    description: 'Historical net worth progression over time',
    defaultSize: 'half',
    category: 'essential',
    dataSource: ['monthly_summaries'],
    chartTypes: ['line', 'bar']
  },
  {
    type: 'cash-flow-forecast',
    title: 'Cash Flow Forecast',
    description: 'Projected balances over 6-12 months',
    defaultSize: 'half',
    category: 'essential',
    dataSource: ['transactions', 'accounts', 'vesting_schedules', 'goals'],
    chartTypes: ['line']
  },
  
  // Spending Analysis
  {
    type: 'expense-categories',
    title: 'Expense Categories',
    description: 'Spending breakdown by category',
    defaultSize: 'half',
    category: 'spending',
    dataSource: ['transactions'],
    chartTypes: ['pie', 'bar']
  },
  {
    type: 'top-spending-categories',
    title: 'Top Spending Categories',
    description: 'Highest spending categories for quick overspending check',
    defaultSize: 'quarter',
    category: 'spending',
    dataSource: ['transactions'],
    chartTypes: ['bar', 'table']
  },
  {
    type: 'budgets-tracking',
    title: 'Budget Tracking',
    description: 'Budget vs actual spending by category',
    defaultSize: 'half',
    category: 'spending',
    dataSource: ['budgets', 'budget_categories', 'transactions'],
    chartTypes: ['progress', 'bar']
  },
  
  // Goals & Planning
  {
    type: 'financial-goals',
    title: 'Financial Goals',
    description: 'Progress toward savings goals',
    defaultSize: 'half',
    category: 'planning',
    dataSource: ['goals'],
    chartTypes: ['progress', 'table']
  },
  {
    type: 'emergency-fund',
    title: 'Emergency Fund',
    description: 'Progress toward 3-6 months of expenses',
    defaultSize: 'quarter',
    category: 'planning',
    dataSource: ['accounts', 'assets', 'monthly_summaries'],
    chartTypes: ['progress', 'number']
  },
  {
    type: 'financial-health-score',
    title: 'Financial Health Score',
    description: '0-100 wellness score based on key metrics',
    defaultSize: 'quarter',
    category: 'planning',
    dataSource: ['calculated'],
    chartTypes: ['number', 'progress']
  },
  
  // Accounts & Assets
  {
    type: 'account-progress',
    title: 'Account Progress',
    description: 'Balance history across all accounts',
    defaultSize: 'half',
    category: 'assets',
    dataSource: ['accounts', 'transactions'],
    chartTypes: ['line', 'bar']
  },
  {
    type: 'account-list',
    title: 'Account List',
    description: 'Complete list of all accounts with balances and activity',
    defaultSize: 'half',
    category: 'assets',
    dataSource: ['accounts', 'transactions', 'users'],
    chartTypes: ['table']
  },
  {
    type: 'assets-overview',
    title: 'Assets Overview',
    description: 'List and value of all assets by type',
    defaultSize: 'half',
    category: 'assets',
    dataSource: ['assets'],
    chartTypes: ['table', 'bar']
  },
  {
    type: 'asset-allocation',
    title: 'Asset Allocation',
    description: 'Distribution of assets by category',
    defaultSize: 'half',
    category: 'assets',
    dataSource: ['assets'],
    chartTypes: ['pie', 'bar']
  },
  
  // Advanced Features
  {
    type: 'vesting-schedules',
    title: 'Vesting Schedules',
    description: 'Track equity vesting including cliff payments',
    defaultSize: 'full',
    category: 'advanced',
    dataSource: ['vesting_schedules'],
    chartTypes: ['line', 'gantt']
  },
  {
    type: 'goal-timeline',
    title: 'Goal Timeline',
    description: 'Gantt chart of all financial goals timing',
    defaultSize: 'full',
    category: 'advanced',
    dataSource: ['goals'],
    chartTypes: ['gantt', 'line']
  },
  {
    type: 'recent-transactions',
    title: 'Recent Transactions',
    description: 'Last 10 transactions with search/filter',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['transactions'],
    chartTypes: ['table']
  },
  {
    type: 'subscription-tracker',
    title: 'Subscription Tracker',
    description: 'Recurring payments and potential savings',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['transactions'],
    chartTypes: ['table', 'bar']
  },

  {
    type: 'peer-benchmarking',
    title: 'Peer Benchmarking',
    description: 'Compare stats to similar income/age brackets',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['calculated'],
    chartTypes: ['bar', 'number']
  },
  {
    type: 'household-contributions',
    title: 'Household Contributions',
    description: 'Each member\'s share of income, spending, assets',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['users', 'transactions', 'assets'],
    chartTypes: ['pie', 'bar']
  },
  {
    type: 'cash-flow-insights',
    title: 'Cash Flow Insights',
    description: 'AI-generated highlights and risk analysis',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['calculated'],
    chartTypes: ['table', 'progress']
  },
  {
    type: 'alerts-recommendations',
    title: 'Alerts & Recommendations',
    description: 'Smart insights and suggested actions',
    defaultSize: 'half',
    category: 'advanced',
    dataSource: ['calculated'],
    chartTypes: ['table']
  },
  {
    type: 'dashboard-customization',
    title: 'Dashboard Layout',
    description: 'Customize dashboard cards and layout',
    defaultSize: 'quarter',
    category: 'advanced',
    dataSource: ['dashboard_configurations'],
    chartTypes: ['table']
  }
];

// Default Dashboard Layouts
export const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default-overview',
    name: 'Financial Overview',
    isDefault: true,
    cards: [
      {
        id: 'card-income',
        type: 'monthly-income',
        title: 'Monthly Income',
        size: 'quarter',
        visible: true,
        position: { x: 0, y: 0 },
        config: { timeRange: 'current', chartType: 'number', showActions: true }
      },
      {
        id: 'card-spending',
        type: 'monthly-spending',
        title: 'Monthly Spending',
        size: 'quarter',
        visible: true,
        position: { x: 1, y: 0 },
        config: { timeRange: 'current', chartType: 'number', showActions: true }
      },
      {
        id: 'card-savings',
        type: 'monthly-savings',
        title: 'Monthly Savings',
        size: 'quarter',
        visible: true,
        position: { x: 2, y: 0 },
        config: { timeRange: 'current', chartType: 'number', showActions: true }
      },
      {
        id: 'card-networth',
        type: 'net-worth',
        title: 'Net Worth',
        size: 'quarter',
        visible: true,
        position: { x: 3, y: 0 },
        config: { timeRange: 'current', chartType: 'number', showActions: true }
      },
      {
        id: 'card-cash-flow',
        type: 'cash-flow-forecast',
        title: 'Cash Flow Forecast',
        size: 'half',
        visible: true,
        position: { x: 0, y: 1 },
        config: { timeRange: '6months', chartType: 'line', showActions: true }
      },
      {
        id: 'card-expenses',
        type: 'expense-categories',
        title: 'Expense Categories',
        size: 'half',
        visible: true,
        position: { x: 2, y: 1 },
        config: { timeRange: 'current', chartType: 'pie', showActions: true }
      },
      {
        id: 'card-goals',
        type: 'financial-goals',
        title: 'Financial Goals',
        size: 'half',
        visible: true,
        position: { x: 0, y: 2 },
        config: { timeRange: 'current', chartType: 'progress', showActions: true }
      },
      {
        id: 'card-emergency',
        type: 'emergency-fund',
        title: 'Emergency Fund',
        size: 'quarter',
        visible: true,
        position: { x: 2, y: 2 },
        config: { timeRange: 'current', chartType: 'progress', showActions: true }
      },
      {
        id: 'card-health',
        type: 'financial-health-score',
        title: 'Health Score',
        size: 'quarter',
        visible: true,
        position: { x: 3, y: 2 },
        config: { timeRange: 'current', chartType: 'number', showActions: true }
      }
    ],
    settings: {
      gridColumns: 12,
      cardSpacing: 24,
      theme: 'light'
    }
  }
];

// Utility function to get card definition by type
export const getCardDefinition = (type: CardType): CardDefinition | undefined => {
  return CARD_DEFINITIONS.find(def => def.type === type);
}; 