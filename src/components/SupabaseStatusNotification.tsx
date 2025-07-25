import React, { useState } from 'react';
import { AlertTriangle, X, ExternalLink, Database } from 'lucide-react';
import { isSupabaseMock } from '../lib/supabase';

const SupabaseStatusNotification: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('supabase-notification-dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('supabase-notification-dismissed', 'true');
  };

  // Only show if Supabase is not configured and user hasn't dismissed
  if (!isSupabaseMock || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-amber-900">
                Demo Mode Active
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <p className="mb-2">
                  You're currently using Nudge in demo mode. Your data won't be saved permanently.
                </p>
                <div className="space-y-1">
                  <p className="font-medium">To enable full functionality:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Create a Supabase project</li>
                    <li>Set up your database using the provided SQL files</li>
                    <li>Add your Supabase URL and key to your .env file</li>
                  </ol>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-amber-800 hover:text-amber-900 underline"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Get Supabase
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  <span className="text-amber-600">•</span>
                  <a
                    href="https://github.com/your-repo/setup-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-amber-800 hover:text-amber-900 underline"
                  >
                    Setup Guide
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-amber-400 hover:text-amber-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseStatusNotification; 