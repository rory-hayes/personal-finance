import React from 'react';
import { isSupabaseMock } from '../lib/supabase';

const Debug: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-yellow-800 mb-2">🔍 Debug Info</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <div>
          <strong>Supabase URL:</strong> {supabaseUrl ? '✅ Set' : '❌ Missing'}
          <br />
          <code className="text-xs bg-yellow-200 px-1 rounded">
            {supabaseUrl || 'undefined'}
          </code>
        </div>
        <div>
          <strong>Supabase Key:</strong> {supabaseAnonKey ? '✅ Set' : '❌ Missing'}
          <br />
          <code className="text-xs bg-yellow-200 px-1 rounded">
            {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'}
          </code>
        </div>
        <div>
          <strong>Is Mock:</strong> {isSupabaseMock ? '❌ Yes (using fallback)' : '✅ No (real connection)'}
        </div>
        <div>
          <strong>Environment:</strong> {import.meta.env.MODE}
        </div>
      </div>
    </div>
  );
};

export default Debug; 