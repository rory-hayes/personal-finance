import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseMock = (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here');

// Create either a real Supabase client or a mock client based on environment variables
export const supabase = isSupabaseMock
  ? (() => {
      console.error('Supabase environment variables are not properly configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      // Return a mock client that won't crash the app
      return {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
          update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
          delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
          upsert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        }),
      } as any;
    })()
  : createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          monthly_income: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          monthly_income?: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_income?: number;
          color?: string;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          description?: string;
          amount?: number;
          category?: string;
          created_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          value: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          value?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_income: number;
          total_spending: number;
          total_savings: number;
          net_worth: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_income?: number;
          total_spending?: number;
          total_savings?: number;
          net_worth?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month?: string;
          total_income?: number;
          total_spending?: number;
          total_savings?: number;
          net_worth?: number;
          created_at?: string;
        };
      };
    };
  };
};