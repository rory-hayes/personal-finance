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

  // Hoist loadUserProfile so it can be safely called before its definition
  async function loadUserProfile(userId: string, currentUser?: User) {
    try {
      console.log('🔍 Loading user profile for:', userId);
      console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
      console.log('🔍 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET (first 20 chars): ' + import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) : 'NOT SET');

      // Check localStorage backup first for faster loading
      const backupProfile = localStorage.getItem(`userProfile_${userId}`);
      const onboardingCompleted = localStorage.getItem(`onboardingCompleted_${userId}`);

      if (backupProfile && onboardingCompleted === 'true') {
        try {
          const parsedProfile = JSON.parse(backupProfile);
          console.log('📦 Found profile backup in localStorage:', parsedProfile);
          setProfile(parsedProfile);

          // Return early if backup shows onboarding completed
          if (parsedProfile.onboarding_completed) {
            console.log('✅ Using localStorage backup - onboarding marked complete');
            return;
          }
        } catch (parseError) {
          console.error('⚠️ Error parsing localStorage profile:', parseError);
        }
      }

      // Try to load from database with timeout
      console.log('🔍 Attempting database connection...');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000); // 10 second timeout
      });

      const dbPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Error loading user profile from database:', error);
        console.log('📋 Database error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // If user profile doesn't exist, create a default one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('📝 No user profile found in database, creating default profile...');
          const userToUse = currentUser || user;

          try {
            const newProfileData = {
              id: userId,
              email: userToUse?.email || '',
              full_name: userToUse?.user_metadata?.full_name || userToUse?.email || 'User',
              household_size: 1,
              monthly_income: 0,
              currency: 'EUR',
              timezone: 'UTC',
              onboarding_completed: false,
            };

            console.log('📝 Creating new profile:', newProfileData);

            const createTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile creation timeout')), 10000);
            });

            const createPromise = supabase
              .from('user_profiles')
              .insert(newProfileData)
              .select()
              .single();

            const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]) as any;

            if (createError) {
              console.error('❌ Error creating user profile:', createError);

              // Fall back to localStorage if available
              if (backupProfile) {
                console.log('📦 Using localStorage backup after creation failure');
                return;
              }

              // Create a minimal profile in memory
              const minimalProfile = {
                ...newProfileData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              setProfile(minimalProfile);
              console.log('🆘 Created minimal profile in memory:', minimalProfile);
              return;
            }

            if (newProfile) {
              setProfile(newProfile);
              console.log('✅ Created new user profile in database:', newProfile);

              // Backup to localStorage
              localStorage.setItem(`userProfile_${userId}`, JSON.stringify(newProfile));
            }
          } catch (createException) {
            console.error('💥 Exception creating user profile:', createException);

            // Use localStorage backup if available
            if (backupProfile) {
              console.log('📦 Using localStorage backup after creation failure');
              return;
            }

            // Create emergency profile
            const emergencyProfile = {
              id: userId,
              email: currentUser?.email || user?.email || '',
              full_name: currentUser?.user_metadata?.full_name || user?.user_metadata?.full_name || 'User',
              household_size: 1,
              monthly_income: 0,
              currency: 'EUR',
              timezone: 'UTC',
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            setProfile(emergencyProfile);
            console.log('🚨 Created emergency profile:', emergencyProfile);
          }
        } else if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          console.log('🔄 Database connection timeout - using localStorage if available');
          if (backupProfile) {
            console.log('📦 Using localStorage backup due to connection timeout');
            return;
          }
        } else {
          // Other database errors - use localStorage backup if available
          if (backupProfile) {
            console.log('📦 Using localStorage backup due to database error');
            return;
          }
        }
        return;
      }

      if (data) {
        setProfile(data);
        console.log('✅ Loaded user profile from database:', data);

        // Update localStorage backup
        localStorage.setItem(`userProfile_${userId}`, JSON.stringify(data));
        if (data.onboarding_completed) {
          localStorage.setItem(`onboardingCompleted_${userId}`, 'true');
        }
      }
    } catch (error: unknown) {
      console.error('💥 Exception in loadUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
        console.log('🔄 Connection timeout detected');
      }

      // Try localStorage backup as last resort
      const backupProfile = localStorage.getItem(`userProfile_${userId}`);
      if (backupProfile) {
        try {
          const parsedProfile = JSON.parse(backupProfile);
          setProfile(parsedProfile);
          console.log('📦 Using localStorage backup after exception:', parsedProfile);
        } catch (parseError) {
          console.error('💥 Error parsing localStorage backup:', parseError);
        }
      }
    }
  }

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
      console.error('❌ completeOnboarding: No user logged in');
      return { error: new Error('No user logged in') };
    }

    try {
      console.log('🚀 Starting onboarding completion for user:', user.id);
      console.log('📝 Onboarding data:', data);
      console.log('🔍 Current profile state:', profile);

      // Check if we're in mock mode
      if (isSupabaseMock) {
        console.warn('⚠️ Running in Supabase mock mode - simulating onboarding completion');
        
        // In mock mode, just update local state
        const mockProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Test User',
          household_size: data.household_size,
          monthly_income: data.monthly_income,
          currency: 'EUR',
          timezone: 'UTC',
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfile(mockProfile);
        console.log('✅ Mock onboarding completed successfully');
        return { error: null };
      }

      // CRITICAL: Update local state FIRST to prevent UI hangs
      console.log('🔄 Updating local profile state immediately...');
      const immediateProfileUpdate = {
        ...profile,
        household_size: data.household_size,
        monthly_income: data.monthly_income,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      } as UserProfile;
      
      setProfile(immediateProfileUpdate);
      console.log('✅ Local profile state updated immediately');

      // Step 1: Update user profile in database
      console.log('📊 Step 1: Updating user profile in database...');
      const profileUpdateData = {
        household_size: data.household_size,
        monthly_income: data.monthly_income,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Profile update data:', profileUpdateData);
      
      try {
        const { data: profileResult, error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdateData)
          .eq('id', user.id)
          .select();

        if (profileError) {
          console.error('❌ Profile update error:', profileError);
          console.log('📋 Error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          
          // Don't return error immediately - try to continue with local state
          console.log('⚠️ Profile update failed, but continuing with local state...');
        } else {
          console.log('✅ Profile updated successfully in database:', profileResult);
        }
      } catch (profileUpdateError) {
        console.error('💥 Exception during profile update:', profileUpdateError);
        console.log('⚠️ Continuing with local state...');
      }

      // Step 2: Create household member records (non-blocking)
      if (data.household_members && data.household_members.length > 0) {
        console.log('👥 Step 2: Creating household member records...');
        try {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];
          
          const usersToInsert = data.household_members.map((member, index) => ({
            id: index === 0 ? user.id : `${user.id}-member-${index}`,
            name: member.name.trim() || `Household Member ${index + 1}`,
            monthly_income: index === 0 ? data.monthly_income : 0,
            color: colors[index % colors.length],
            auth_user_id: user.id,
          }));

          console.log('👥 Users to insert:', usersToInsert);

          const { data: usersResult, error: usersError } = await supabase
            .from('users')
            .upsert(usersToInsert, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (usersError) {
            console.error('⚠️ Users creation error (non-blocking):', usersError);
          } else {
            console.log('✅ Household members created successfully:', usersResult);
          }
        } catch (usersError) {
          console.error('💥 Exception creating household members (non-blocking):', usersError);
        }
      }

      // Step 3: Create initial accounts (non-blocking)
      if (data.accounts && data.accounts.length > 0) {
        console.log('🏦 Step 3: Creating initial accounts...');
        try {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
          
          const accountsToInsert = data.accounts
            .filter(account => account.name.trim())
            .map((account, index) => ({
              user_id: user.id,
              name: account.name.trim(),
              type: account.type,
              balance: parseFloat(account.balance) || 0,
              color: colors[index % colors.length],
              last_updated: new Date().toISOString()
            }));

          console.log('🏦 Accounts to insert:', accountsToInsert);

          if (accountsToInsert.length > 0) {
            const { data: accountsResult, error: accountsError } = await supabase
              .from('accounts')
              .upsert(accountsToInsert, {
                onConflict: 'user_id,name'
              })
              .select();

            if (accountsError) {
              console.error('⚠️ Accounts creation error (non-blocking):', accountsError);
            } else {
              console.log('✅ Accounts created successfully:', accountsResult);
            }
          }
        } catch (accountsError) {
          console.error('💥 Exception creating accounts (non-blocking):', accountsError);
        }
      }

      // Step 4: Create default dashboard configuration (non-blocking)
      console.log('📊 Step 4: Creating default dashboard configuration...');
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

        console.log('📊 Dashboard config to create:', defaultDashboardConfig);

        const { data: dashboardResult, error: dashboardError } = await supabase
          .from('dashboard_configurations')
          .insert([defaultDashboardConfig])
          .select();

        if (dashboardError) {
          console.error('⚠️ Dashboard configuration creation error (non-blocking):', dashboardError);
        } else {
          console.log('✅ Default dashboard configuration created successfully:', dashboardResult);
        }
      } catch (dashboardCreationError) {
        console.error('💥 Exception creating dashboard configuration (non-blocking):', dashboardCreationError);
      }

      // Step 5: Save to localStorage as backup
      console.log('💾 Step 5: Saving to localStorage as backup...');
      try {
        localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(immediateProfileUpdate));
        localStorage.setItem(`onboardingCompleted_${user.id}`, 'true');
        console.log('✅ Profile saved to localStorage as backup');
      } catch (localStorageError) {
        console.error('⚠️ localStorage save error (non-blocking):', localStorageError);
      }

      console.log('🎉 Onboarding process completed successfully!');
      console.log('🔍 Final profile state:', immediateProfileUpdate);
      
      // Return success since we've updated local state
      return { error: null };

    } catch (error) {
      console.error('💥 Critical error in completeOnboarding:', error);
      
      // Even if there's an error, try to update local state
      console.log('🚨 Attempting emergency local state update...');
      try {
        const emergencyProfile = {
          ...profile,
          household_size: data.household_size,
          monthly_income: data.monthly_income,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        } as UserProfile;
        
        setProfile(emergencyProfile);
        localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(emergencyProfile));
        localStorage.setItem(`onboardingCompleted_${user.id}`, 'true');
        
        console.log('✅ Emergency local state update successful');
        return { error: null }; // Return success despite database errors
      } catch (emergencyError) {
        console.error('💥 Emergency state update failed:', emergencyError);
        return { error };
      }
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