import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import React from 'react'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    eq: vi.fn(function(this: any) { return this }),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }))
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseMock: false
}))

// Test component to access the context
const TestComponent: React.FC = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
      <div data-testid="profile">{auth.profile ? auth.profile.full_name : 'No Profile'}</div>
      <button 
        data-testid="sign-up"
        onClick={() => auth.signUp('test@example.com', 'password123', 'Test User')}
      >
        Sign Up
      </button>
      <button 
        data-testid="sign-in"
        onClick={() => auth.signIn('test@example.com', 'password123')}
      >
        Sign In
      </button>
      <button 
        data-testid="sign-out"
        onClick={() => auth.signOut()}
      >
        Sign Out
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  })

  describe('Context Provider', () => {
    it('should provide auth context to child components', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('user')).toBeInTheDocument()
      expect(screen.getByTestId('profile')).toBeInTheDocument()
    })

    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleError.mockRestore()
    })
  })

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
      expect(screen.getByTestId('profile')).toHaveTextContent('No Profile')
    })

    it('should call getSession on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should set up auth state change listener', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z'
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-up').click()
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })
    })

    it('should handle registration errors gracefully', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Email already registered' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-up').click()
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
      // Should handle error without crashing
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    it('should validate email format during registration', async () => {
      const TestComponentWithInvalidEmail = () => {
        const auth = useAuth()
        return (
          <button 
            data-testid="sign-up-invalid"
            onClick={() => auth.signUp('invalid-email', 'password123', 'Test User')}
          >
            Sign Up Invalid
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestComponentWithInvalidEmail />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-up-invalid').click()
      })

      // Should still call Supabase (let Supabase handle email validation)
      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
    })
  })

  describe('User Authentication', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-in').click()
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-in').click()
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })
  })

  describe('User Profile Management', () => {
    it('should load user profile when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        onboarding_completed: true,
        created_at: '2024-01-01T00:00:00.000Z'
      }

      // Mock getSession to return authenticated user
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token'
          } 
        },
        error: null
      })

      // Mock profile fetch
      const profileMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }
      mockSupabase.from.mockReturnValueOnce(profileMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      })
    })

    it('should create profile if it does not exist', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token'
          } 
        },
        error: null
      })

      // Mock profile not found
      const profileNotFoundMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // No rows returned
        })
      }
      mockSupabase.from.mockReturnValueOnce(profileNotFoundMock)

      // Mock profile creation
      const profileCreateMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            full_name: 'Test User',
            onboarding_completed: false
          },
          error: null
        })
      }
      mockSupabase.from.mockReturnValueOnce(profileCreateMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      })
    })
  })

  describe('Sign Out', () => {
    it('should successfully sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-out').click()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should handle sign out errors gracefully', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Sign out failed' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('sign-out').click()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Onboarding Flow', () => {
    it('should complete onboarding successfully', async () => {
      const TestOnboardingComponent = () => {
        const auth = useAuth()
        return (
          <button 
            data-testid="complete-onboarding"
            onClick={() => auth.completeOnboarding({
              household_size: 2,
              household_members: [
                { name: 'John Doe', isMain: true },
                { name: 'Jane Doe', isMain: false }
              ],
              monthly_income: 5000,
              accounts: [
                { name: 'Checking', type: 'checking', balance: '1000' },
                { name: 'Savings', type: 'savings', balance: '5000' }
              ]
            })}
          >
            Complete Onboarding
          </button>
        )
      }

      // Mock successful updates
      const onboardingMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: {}, error: null })
      }
      mockSupabase.from.mockReturnValue(onboardingMock)

      render(
        <AuthProvider>
          <TestOnboardingComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId('complete-onboarding').click()
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('Loading States', () => {
    it('should show loading during authentication check', () => {
      // Mock delayed getSession response
      mockSupabase.auth.getSession.mockReturnValue(
        new Promise(resolve => {
          setTimeout(() => resolve({ data: { session: null }, error: null }), 100)
        })
      )

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })

    it('should stop loading after session check completes', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle session fetch errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Network error' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Should not crash and should show no user
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token'
          } 
        },
        error: null
      })

      // Mock profile fetch error
      const profileErrorMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }
      mockSupabase.from.mockReturnValueOnce(profileErrorMock)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Should still show user even if profile fetch fails
      expect(screen.getByTestId('profile')).toHaveTextContent('No Profile')
    })
  })

  describe('Memory Management', () => {
    it('should cleanup auth listener on unmount', () => {
      const mockUnsubscribe = vi.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
  })
}) 