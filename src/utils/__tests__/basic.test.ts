import { describe, it, expect } from 'vitest'

// Simple utility functions to test
function add(a: number, b: number): number {
  return a + b
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

describe('Basic Utility Functions', () => {
  describe('Math Operations', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
      expect(add(-1, 1)).toBe(0)
      expect(add(0, 0)).toBe(0)
    })

    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50)
      expect(calculatePercentage(1, 3)).toBe(33)
      expect(calculatePercentage(0, 100)).toBe(0)
      expect(calculatePercentage(100, 0)).toBe(0)
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(-500)).toBe('-$500.00')
    })
  })

  describe('Edge Cases', () => {
    it('should handle large numbers', () => {
      expect(add(999999, 1)).toBe(1000000)
      expect(calculatePercentage(1000000, 2000000)).toBe(50)
    })

    it('should handle decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3, 5)
      expect(calculatePercentage(33.333, 100)).toBe(33)
    })
  })
}) 