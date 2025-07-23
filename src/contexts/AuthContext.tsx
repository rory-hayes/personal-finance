import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
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
      const { error } = await supabase
        .from('user_profiles')
        .update({
          household_size: data.household_size,
          monthly_income: data.monthly_income,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Create user records for all household members in the users table
      if (data.household_members && data.household_members.length > 0) {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];
        
        const usersToInsert = data.household_members.map((member, index) => ({
          id: index === 0 ? user.id : `${user.id}-member-${index}`, // Main user gets auth ID, others get derived IDs
          name: member.name.trim() || `Household Member ${index + 1}`,
          monthly_income: index === 0 ? data.monthly_income : 0, // Only main user gets income initially
          color: colors[index % colors.length],
          auth_user_id: user.id, // All members linked to the main authenticated user
        }));

        const { error: usersError } = await supabase
          .from('users')
          .upsert(usersToInsert, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (usersError) {
          console.error('Error creating household member records:', usersError);
          // Don't fail onboarding if user creation fails, but log it
        }
      }

      // Create initial accounts if provided
      if (data.accounts && data.accounts.length > 0) {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        
        const accountsToInsert = data.accounts
          .filter(account => account.name.trim() && account.balance.trim())
          .map((account, index) => ({
            user_id: user.id, // Link accounts to the main authenticated user
            name: account.name.trim(),
            type: account.type,
            balance: parseFloat(account.balance) || 0,
            color: colors[index % colors.length],
          }));

        if (accountsToInsert.length > 0) {
          const { error: accountsError } = await supabase
            .from('accounts')
            .insert(accountsToInsert);

          if (accountsError) {
            console.error('Error creating accounts:', accountsError);
            // Don't fail onboarding if accounts creation fails
          }
        }
      }

      // Reload profile after update
      await loadUserProfile(user.id);
      
      return { error: null };
    } catch (error) {
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