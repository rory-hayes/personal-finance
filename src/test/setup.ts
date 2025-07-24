import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'

// Global test setup
beforeAll(() => {
  // Mock environment variables
  Object.defineProperty(process, 'env', {
    value: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      NODE_ENV: 'test'
    },
    writable: true
  })

  // Mock window methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  })

  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7)
    }
  })
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

afterAll(() => {
  vi.resetAllMocks()
})

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  monthlyIncome: 5000,
  color: '#3B82F6',
  createdAt: new Date().toISOString(),
  ...overrides
})

export const createMockAccount = (overrides = {}) => ({
  id: 'test-account-id',
  userId: 'test-user-id',
  name: 'Test Account',
  type: 'checking' as const,
  balance: 1000,
  color: '#3B82F6',
  lastUpdated: new Date().toISOString(),
  ...overrides
})

export const createMockTransaction = (overrides = {}) => ({
  id: 'test-transaction-id',
  userId: 'test-user-id',
  date: new Date().toISOString().split('T')[0],
  description: 'Test Transaction',
  amount: -50,
  category: 'Groceries',
  createdAt: new Date().toISOString(),
  ...overrides
})

export const createMockAsset = (overrides = {}) => ({
  id: 'test-asset-id',
  userId: 'test-user-id',
  name: 'Test Asset',
  category: 'Real Estate',
  value: 100000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

export const createMockGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  userId: 'test-user-id',
  name: 'Test Goal',
  targetAmount: 10000,
  currentAmount: 2500,
  targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  description: 'Test goal description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Mock Supabase client
export const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    eq: vi.fn(function(this: any) { return this }),
    order: vi.fn(function(this: any) { return this }),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    signUp: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  }
}) 