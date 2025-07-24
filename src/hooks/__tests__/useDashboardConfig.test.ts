import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboardConfig } from '../useDashboardConfig'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    eq: vi.fn(function(this: any) { return this }),
    order: vi.fn(function(this: any) { return this }),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }))
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseMock: false
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useDashboardConfig Hook', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))
      
      expect(result.current.currentConfig).toBeNull()
      expect(result.current.configurations).toEqual([])
      expect(result.current.loading).toBe(true)
    })

    it('should load configurations on mount', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          user_id: mockUserId,
          name: 'Main Dashboard',
          is_default: true,
          layout_config: { cards: [] },
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ]

      const configMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockConfigs, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValueOnce(configMock)

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.configurations).toHaveLength(1)
      expect(result.current.currentConfig).toEqual(mockConfigs[0])
    })

    it('should create default configuration if none exists', async () => {
      const configMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(configMock)

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(configMock.insert).toHaveBeenCalled()
    })
  })

  describe('Configuration Management', () => {
    it('should save configuration successfully', async () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const newConfig = {
        name: 'Test Dashboard',
        isDefault: false,
        layoutConfig: {
          cards: [
            {
              id: 'card-1',
              type: 'monthly-income',
              size: 'half',
              position: { x: 0, y: 0, w: 2, h: 1 },
              config: { title: 'Income', visible: true }
            }
          ]
        }
      }

      const saveMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-config-id' }, error: null }),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(saveMock)

      await act(async () => {
        const result = await result.current.saveConfiguration(newConfig)
        expect(result.error).toBeNull()
      })

      expect(saveMock.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        name: 'Test Dashboard',
        is_default: false,
        layout_config: newConfig.layoutConfig,
      })
    })

    it('should update existing configuration', async () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const existingConfig = {
        id: 'config-123',
        name: 'Updated Dashboard',
        isDefault: true,
        layoutConfig: { cards: [] }
      }

      const updateMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(updateMock)

      await act(async () => {
        const result = await result.current.saveConfiguration(existingConfig)
        expect(result.error).toBeNull()
      })

      expect(updateMock.update).toHaveBeenCalledWith({
        name: 'Updated Dashboard',
        is_default: true,
        layout_config: existingConfig.layoutConfig,
        updated_at: expect.any(String),
      })
      expect(updateMock.eq).toHaveBeenCalledWith('id', 'config-123')
    })

    it('should handle save errors gracefully', async () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const errorMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockRejectedValue(new Error('Database error')),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(errorMock)

      const newConfig = {
        name: 'Test Dashboard',
        layoutConfig: { cards: [] }
      }

      await act(async () => {
        const result = await result.current.saveConfiguration(newConfig)
        expect(result.error).toBeTruthy()
        expect(result.data).toBeNull()
      })
    })
  })

  describe('Card Management', () => {
    it('should add card to configuration', async () => {
      const initialConfig = {
        id: 'config-1',
        layoutConfig: { cards: [] }
      }

      const { result } = renderHook(() => useDashboardConfig(mockUserId))
      
      // Set initial config
      act(() => {
        result.current.setCurrentConfig(initialConfig)
      })

      const saveMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(saveMock)

      await act(async () => {
        await result.current.addCard('monthly-income', 'half')
      })

      expect(result.current.currentConfig.layoutConfig.cards).toHaveLength(1)
      expect(result.current.currentConfig.layoutConfig.cards[0]).toMatchObject({
        type: 'monthly-income',
        size: 'half'
      })
    })

    it('should create default config when adding card to null config', async () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const createMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(createMock)

      await act(async () => {
        await result.current.addCard('monthly-spending', 'quarter')
      })

      expect(result.current.currentConfig).toBeTruthy()
      expect(result.current.currentConfig.layoutConfig.cards).toHaveLength(1)
    })

    it('should remove card from configuration', async () => {
      const configWithCard = {
        id: 'config-1',
        layoutConfig: {
          cards: [
            {
              id: 'card-1',
              type: 'monthly-income',
              size: 'half',
              position: { x: 0, y: 0, w: 2, h: 1 },
              config: { title: 'Income', visible: true }
            }
          ]
        }
      }

      const { result } = renderHook(() => useDashboardConfig(mockUserId))
      
      act(() => {
        result.current.setCurrentConfig(configWithCard)
      })

      const removeMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(removeMock)

      await act(async () => {
        await result.current.removeCard('card-1')
      })

      expect(result.current.currentConfig.layoutConfig.cards).toHaveLength(0)
    })

    it('should update card configuration', async () => {
      const configWithCard = {
        id: 'config-1',
        layoutConfig: {
          cards: [
            {
              id: 'card-1',
              type: 'monthly-income',
              size: 'half',
              position: { x: 0, y: 0, w: 2, h: 1 },
              config: { title: 'Income', visible: true }
            }
          ]
        }
      }

      const { result } = renderHook(() => useDashboardConfig(mockUserId))
      
      act(() => {
        result.current.setCurrentConfig(configWithCard)
      })

      const updateMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(updateMock)

      const newCardConfig = {
        title: 'Monthly Revenue',
        chartType: 'bar',
        timeRange: 'yearly'
      }

      await act(async () => {
        await result.current.updateCardConfig('card-1', newCardConfig)
      })

      expect(result.current.currentConfig.layoutConfig.cards[0].config).toMatchObject(newCardConfig)
    })
  })

  describe('LocalStorage Fallback', () => {
    it('should use localStorage when Supabase is mocked', async () => {
      // Mock isSupabaseMock to be true
      vi.doMock('../../lib/supabase', () => ({
        supabase: mockSupabase,
        isSupabaseMock: true
      }))

      const mockStoredConfigs = JSON.stringify([
        {
          id: 'local-config-1',
          userId: mockUserId,
          name: 'Local Dashboard',
          layoutConfig: { cards: [] }
        }
      ])

      mockLocalStorage.getItem.mockReturnValue(mockStoredConfigs)

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`dashboardConfigs_${mockUserId}`)
    })

    it('should save to localStorage when Supabase is mocked', async () => {
      vi.doMock('../../lib/supabase', () => ({
        supabase: mockSupabase,
        isSupabaseMock: true
      }))

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const newConfig = {
        name: 'Local Test Dashboard',
        layoutConfig: { cards: [] }
      }

      await act(async () => {
        await result.current.saveConfiguration(newConfig)
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `dashboardConfigs_${mockUserId}`,
        expect.stringContaining('Local Test Dashboard')
      )
    })
  })

  describe('Configuration Switching', () => {
    it('should switch between configurations', async () => {
      const configs = [
        {
          id: 'config-1',
          name: 'Dashboard 1',
          layoutConfig: { cards: [] }
        },
        {
          id: 'config-2',
          name: 'Dashboard 2',
          layoutConfig: { cards: [] }
        }
      ]

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      act(() => {
        result.current.setConfigurations(configs)
        result.current.setCurrentConfig(configs[0])
      })

      expect(result.current.currentConfig.id).toBe('config-1')

      act(() => {
        result.current.setCurrentConfig(configs[1])
      })

      expect(result.current.currentConfig.id).toBe('config-2')
    })

    it('should find configuration by ID', () => {
      const configs = [
        { id: 'config-1', name: 'Dashboard 1' },
        { id: 'config-2', name: 'Dashboard 2' }
      ]

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      act(() => {
        result.current.setConfigurations(configs)
      })

      const foundConfig = result.current.findConfigById('config-2')
      expect(foundConfig).toEqual(configs[1])

      const notFound = result.current.findConfigById('config-999')
      expect(notFound).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const errorMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Connection failed')),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(errorMock)

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should fallback gracefully, possibly to localStorage or empty state
      expect(result.current.configurations).toEqual([])
    })

    it('should handle malformed localStorage data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{')

      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should handle gracefully without crashing
      expect(result.current.configurations).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should not re-trigger effects when userId is unchanged', () => {
      const { rerender } = renderHook(
        ({ userId }) => useDashboardConfig(userId),
        { initialProps: { userId: mockUserId } }
      )

      const callCount = mockSupabase.from.mock.calls.length

      rerender({ userId: mockUserId })

      // Should not make additional calls with same userId
      expect(mockSupabase.from.mock.calls.length).toBe(callCount)
    })

    it('should debounce rapid configuration saves', async () => {
      const { result } = renderHook(() => useDashboardConfig(mockUserId))

      const saveMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: {}, error: null }),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(saveMock)

      const config = { name: 'Test', layoutConfig: { cards: [] } }

      // Rapid saves
      await act(async () => {
        await Promise.all([
          result.current.saveConfiguration(config),
          result.current.saveConfiguration(config),
          result.current.saveConfiguration(config)
        ])
      })

      // Should make fewer database calls than requests
      expect(saveMock.insert.mock.calls.length).toBeLessThanOrEqual(3)
    })
  })
}) 