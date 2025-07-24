import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MonthlyIncomeCard from '../MonthlyIncomeCard'

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>
}))

// Mock recharts components
vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}))

describe('MonthlyIncomeCard', () => {
  const mockCard = {
    id: 'test-card',
    type: 'monthly-income' as const,
    size: 'half' as const,
    position: { x: 0, y: 0, w: 2, h: 1 },
    config: {
      title: 'Monthly Income',
      chartType: 'area' as const,
      timeRange: 'current' as const,
      visible: true
    }
  }

  const mockFinanceData = {
    totalIncome: 5000,
    users: [],
    accounts: [],
    assets: [],
    goals: [],
    transactions: [],
    monthlyData: [
      { month: '2024-01', income: 4800 },
      { month: '2024-02', income: 5200 },
      { month: '2024-03', income: 5000 }
    ],
    loading: false
  }

  describe('Basic Rendering', () => {
    it('should render the card with correct title', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    })

    it('should display the total income amount', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      // Should format currency properly
      expect(screen.getByText(/\$5,000/)).toBeInTheDocument()
    })

    it('should render the dollar sign icon', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument()
    })

    it('should render chart components when data is available', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should show zero income when no income data', () => {
      const noIncomeData = {
        ...mockFinanceData,
        totalIncome: 0
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={noIncomeData} />)
      
      expect(screen.getByText(/\$0/)).toBeInTheDocument()
    })

    it('should handle large income amounts', () => {
      const largeIncomeData = {
        ...mockFinanceData,
        totalIncome: 1234567.89
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={largeIncomeData} />)
      
      // Should format large numbers with commas
      expect(screen.getByText(/\$1,234,567/)).toBeInTheDocument()
    })

    it('should handle decimal income amounts', () => {
      const decimalIncomeData = {
        ...mockFinanceData,
        totalIncome: 5432.10
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={decimalIncomeData} />)
      
      expect(screen.getByText(/\$5,432/)).toBeInTheDocument()
    })
  })

  describe('Trend Analysis', () => {
    it('should show positive trend when income is increasing', () => {
      const increasingData = {
        ...mockFinanceData,
        monthlyData: [
          { month: '2024-01', income: 4000 },
          { month: '2024-02', income: 4500 },
          { month: '2024-03', income: 5000 }
        ]
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={increasingData} />)
      
      // Should show trending up icon or positive percentage
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
    })

    it('should show negative trend when income is decreasing', () => {
      const decreasingData = {
        ...mockFinanceData,
        monthlyData: [
          { month: '2024-01', income: 6000 },
          { month: '2024-02', income: 5500 },
          { month: '2024-03', income: 5000 }
        ]
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={decreasingData} />)
      
      // Should show trending down icon or negative percentage
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument()
    })

    it('should show stable trend when income is unchanged', () => {
      const stableData = {
        ...mockFinanceData,
        monthlyData: [
          { month: '2024-01', income: 5000 },
          { month: '2024-02', income: 5000 },
          { month: '2024-03', income: 5000 }
        ]
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={stableData} />)
      
      // Should show neutral icon
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state when data is loading', () => {
      const loadingData = {
        ...mockFinanceData,
        loading: true
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={loadingData} />)
      
      // Should show some loading indicator or skeleton
      expect(screen.getByText(/loading/i) || screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should handle empty monthly data gracefully', () => {
      const emptyData = {
        ...mockFinanceData,
        monthlyData: []
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={emptyData} />)
      
      // Should still render basic card structure
      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    })

    it('should handle undefined monthly data', () => {
      const undefinedData = {
        ...mockFinanceData,
        monthlyData: undefined as any
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={undefinedData} />)
      
      // Should not crash and still show basic info
      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    })
  })

  describe('Card Configuration', () => {
    it('should respect custom title from card config', () => {
      const customCard = {
        ...mockCard,
        config: {
          ...mockCard.config,
          title: 'Custom Income Title'
        }
      }
      
      render(<MonthlyIncomeCard card={customCard} financeData={mockFinanceData} />)
      
      expect(screen.getByText('Custom Income Title')).toBeInTheDocument()
    })

    it('should hide chart when chartType is none', () => {
      const noChartCard = {
        ...mockCard,
        config: {
          ...mockCard.config,
          chartType: 'none' as const
        }
      }
      
      render(<MonthlyIncomeCard card={noChartCard} financeData={mockFinanceData} />)
      
      // Chart should not be rendered
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })

    it('should render different chart types', () => {
      const lineChartCard = {
        ...mockCard,
        config: {
          ...mockCard.config,
          chartType: 'line' as const
        }
      }
      
      render(<MonthlyIncomeCard card={lineChartCard} financeData={mockFinanceData} />)
      
      // Should render appropriate chart type
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle small card size', () => {
      const smallCard = {
        ...mockCard,
        size: 'quarter' as const
      }
      
      render(<MonthlyIncomeCard card={smallCard} financeData={mockFinanceData} />)
      
      // Should still render but maybe with compressed layout
      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    })

    it('should handle large card size', () => {
      const largeCard = {
        ...mockCard,
        size: 'full' as const
      }
      
      render(<MonthlyIncomeCard card={largeCard} financeData={mockFinanceData} />)
      
      // Should render with expanded layout
      expect(screen.getByText('Monthly Income')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      // Should have accessible labels for screen readers
      const card = screen.getByRole('region') || screen.getByTestId('monthly-income-card')
      expect(card).toHaveAttribute('aria-label', 'Monthly Income Card')
    })

    it('should have proper heading hierarchy', () => {
      render(<MonthlyIncomeCard card={mockCard} financeData={mockFinanceData} />)
      
      // Title should be a proper heading
      expect(screen.getByRole('heading', { name: /monthly income/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid income values gracefully', () => {
      const invalidData = {
        ...mockFinanceData,
        totalIncome: NaN
      }
      
      render(<MonthlyIncomeCard card={invalidData} financeData={invalidData} />)
      
      // Should show fallback value instead of NaN
      expect(screen.getByText(/\$0/)).toBeInTheDocument()
    })

    it('should handle negative income values', () => {
      const negativeData = {
        ...mockFinanceData,
        totalIncome: -1000
      }
      
      render(<MonthlyIncomeCard card={mockCard} financeData={negativeData} />)
      
      // Should show negative amount properly formatted
      expect(screen.getByText(/-\$1,000/)).toBeInTheDocument()
    })
  })
}) 