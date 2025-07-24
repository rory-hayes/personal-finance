import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  household_size: number;
  monthly_income: number;
  currency: string;
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface HouseholdMember {
  name: string;
  isMain: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: any }>;
  completeOnboarding: (data: { 
    household_size: number; 
    household_members: HouseholdMember[];
    monthly_income: number;
    accounts?: Array<{ name: string; type: string; balance: string }>;
  }) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in mock mode immediately
    if (isSupabaseMock) {
      console.log('Running in Supabase mock mode - no authentication available');
      setLoading(false);
      return;
    }

    // Set a maximum loading timeout of 5 seconds
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000);

    // Set a shorter timeout for initial session loading
    const initialLoadTimeout = setTimeout(() => {
      console.warn('Initial session load timeout - ensuring loading resolves');
      setLoading(false);
    }, 3000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(initialLoadTimeout);
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session:', session);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id, session.user);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
        clearTimeout(initialLoadTimeout);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
      clearTimeout(initialLoadTimeout);
    };
  }, []);

  const loadUserProfile = async (userId: string, currentUser?: User) => {
    try {
      console.log('Loading user profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If user profile doesn't exist, create a default one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('No user profile found, creating default profile...');
          const userToUse = currentUser || user;
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: userToUse?.email || '',
              full_name: userToUse?.user_metadata?.full_name || userToUse?.email || 'User',
              household_size: 1,
              monthly_income: 0,
              currency: 'EUR',
              timezone: 'UTC',
              onboarding_completed: false,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            return;
          }

          if (newProfile) {
            setProfile(newProfile);
            console.log('Created new user profile:', newProfile);
          }
        }
        return;
      }

      if (data) {
        setProfile(data);
        console.log('Loaded user profile:', data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      return { user: data.user };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Reload profile after update
      await loadUserProfile(user.id);
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const completeOnboarding = async (data: { 
    household_size: number; 
    household_members: HouseholdMember[];
    monthly_income: number;
    accounts?: Array<{ name: string; type: string; balance: string }>;
  }) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      console.log('Starting onboarding completion for user:', user.id);

      // Step 1: Update user profile
      console.log('Updating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          household_size: data.household_size,
          monthly_income: data.monthly_income,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return { error: profileError };
      }
      console.log('✅ Profile updated successfully');

      // Step 2: Create household member records
      if (data.household_members && data.household_members.length > 0) {
        console.log('Creating household member records...');
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];
        
        const usersToInsert = data.household_members.map((member, index) => ({
          id: index === 0 ? user.id : `${user.id}-member-${index}`,
          name: member.name.trim() || `Household Member ${index + 1}`,
          monthly_income: index === 0 ? data.monthly_income : 0,
          color: colors[index % colors.length],
          auth_user_id: user.id,
        }));

        const { error: usersError } = await supabase
          .from('users')
          .upsert(usersToInsert, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (usersError) {
          console.error('Users creation error:', usersError);
          // Don't fail onboarding, but log the error
        } else {
          console.log('✅ Household members created successfully');
        }
      }

      // Step 3: Create initial accounts
      if (data.accounts && data.accounts.length > 0) {
        console.log('Creating initial accounts...');
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        
        const accountsToInsert = data.accounts
          .filter(account => account.name.trim() && account.balance.trim())
          .map((account, index) => ({
            user_id: user.id,
            name: account.name.trim(),
            type: account.type,
            balance: parseFloat(account.balance) || 0,
            color: colors[index % colors.length],
            last_updated: new Date().toISOString()
          }));

        if (accountsToInsert.length > 0) {
          const { error: accountsError } = await supabase
            .from('accounts')
            .insert(accountsToInsert);

          if (accountsError) {
            console.error('Accounts creation error:', accountsError);
            // Don't fail onboarding, but log the error
          } else {
            console.log('✅ Accounts created successfully');
          }
        }
      }

      // Step 4: Create default dashboard configuration with starter cards
      console.log('Creating default dashboard configuration...');
      try {
        const defaultDashboardConfig = {
          user_id: user.id,
          name: 'My Dashboard',
          is_default: true,
          layout_config: {
            cards: [
              {
                id: `card-monthly-income-${Date.now()}`,
                type: 'monthly-income',
                size: 'quarter',
                position: { x: 0, y: 0, w: 1, h: 1 },
                config: {
                  title: 'Monthly Income',
                  chartType: 'number',
                  timeRange: 'current',
                  visible: true
                }
              },
              {
                id: `card-monthly-spending-${Date.now() + 1}`,
                type: 'monthly-spending',
                size: 'quarter',
                position: { x: 1, y: 0, w: 1, h: 1 },
                config: {
                  title: 'Monthly Spending',
                  chartType: 'number',
                  timeRange: 'current',
                  visible: true
                }
              },
              {
                id: `card-net-worth-${Date.now() + 2}`,
                type: 'net-worth',
                size: 'quarter',
                position: { x: 2, y: 0, w: 1, h: 1 },
                config: {
                  title: 'Net Worth',
                  chartType: 'number',
                  timeRange: 'current',
                  visible: true
                }
              },
              {
                id: `card-account-list-${Date.now() + 3}`,
                type: 'account-list',
                size: 'quarter',
                position: { x: 3, y: 0, w: 1, h: 1 },
                config: {
                  title: 'Accounts',
                  visible: true
                }
              }
            ],
            settings: {
              gridColumns: 4,
              cardSpacing: 24,
              theme: 'light'
            }
          }
        };

        const { error: dashboardError } = await supabase
          .from('dashboard_configurations')
          .insert([defaultDashboardConfig]);

        if (dashboardError) {
          console.error('Dashboard configuration creation error:', dashboardError);
          // Don't fail onboarding, but log the error
        } else {
          console.log('✅ Default dashboard configuration created successfully');
        }
      } catch (dashboardCreationError) {
        console.error('Error creating dashboard configuration:', dashboardCreationError);
        // Don't fail onboarding for dashboard creation issues
      }

      // Step 5: Reload profile to reflect changes
      console.log('Reloading user profile...');
      await loadUserProfile(user.id);
      
      console.log('🎉 Onboarding completed successfully!');
      return { error: null };

    } catch (error) {
      console.error('Critical error in completeOnboarding:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    completeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 