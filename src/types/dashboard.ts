export interface DashboardCard {
  id: string;
  type: CardType;
  size: CardSize;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: CardConfig;
}

export type CardType = 
  | 'metric'
  | 'expense-categories'
  | 'goals'
  | 'assets'
  | 'vesting'
  | 'accounts'
  | 'emergency-fund'
  | 'cash-flow'
  | 'health-score'
  | 'subscriptions'
  | 'asset-allocation'
  | 'goal-timeline'
  | 'bonus-tracker'
  | 'peer-benchmarking';

export type CardSize = 'quarter' | 'half' | 'full' | 'tall';

export type ChartType = 'number' | 'bar' | 'line' | 'pie' | 'area' | 'progress' | 'gauge' | 'timeline';

export type TimeRange = 'current' | '3months' | '6months' | '12months' | '24months' | 'custom';

export interface CardConfig {
  title: string;
  chartType: ChartType;
  timeRange: TimeRange;
  visible: boolean;
  customSettings?: Record<string, any>;
}

export interface DashboardLayout {
  cards: DashboardCard[];
  settings: DashboardSettings;
}

export interface DashboardSettings {
  gridColumns: number;
  cardSpacing: number;
  theme: 'light' | 'dark';
}

export interface DashboardConfiguration {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  layoutConfig: DashboardLayout;
  createdAt: string;
  updatedAt: string;
}

// Card size configurations
export const CARD_SIZES: Record<CardSize, { width: number; height: number; cols: number; rows: number }> = {
  quarter: { width: 1, height: 1, cols: 1, rows: 1 },
  half: { width: 2, height: 1, cols: 2, rows: 1 },
  full: { width: 4, height: 1, cols: 4, rows: 1 },
  tall: { width: 4, height: 2, cols: 4, rows: 2 }
};

// Default card configurations
export const DEFAULT_CARDS: Partial<DashboardCard>[] = [
  {
    type: 'metric',
    size: 'quarter',
    config: {
      title: 'Monthly Income',
      chartType: 'number',
      timeRange: 'current',
      visible: true,
      customSettings: { metric: 'income' }
    }
  },
  {
    type: 'metric',
    size: 'quarter',
    config: {
      title: 'Monthly Spending',
      chartType: 'number',
      timeRange: 'current',
      visible: true,
      customSettings: { metric: 'spending' }
    }
  },
  {
    type: 'metric',
    size: 'quarter',
    config: {
      title: 'Monthly Savings',
      chartType: 'number',
      timeRange: 'current',
      visible: true,
      customSettings: { metric: 'savings' }
    }
  },
  {
    type: 'metric',
    size: 'quarter',
    config: {
      title: 'Net Worth',
      chartType: 'number',
      timeRange: 'current',
      visible: true,
      customSettings: { metric: 'networth' }
    }
  },
  {
    type: 'expense-categories',
    size: 'half',
    config: {
      title: 'Expense Trend',
      chartType: 'bar',
      timeRange: '6months',
      visible: true
    }
  },
  {
    type: 'accounts',
    size: 'half',
    config: {
      title: 'Monthly Account Progress',
      chartType: 'line',
      timeRange: '6months',
      visible: true
    }
  },
  {
    type: 'goals',
    size: 'half',
    config: {
      title: 'Financial Goals',
      chartType: 'progress',
      timeRange: 'current',
      visible: true
    }
  },
  {
    type: 'assets',
    size: 'half',
    config: {
      title: 'Assets Overview',
      chartType: 'pie',
      timeRange: 'current',
      visible: true
    }
  },
  {
    type: 'vesting',
    size: 'half',
    config: {
      title: 'Share Vesting Tracker',
      chartType: 'line',
      timeRange: 'current',
      visible: true
    }
  }
]; 