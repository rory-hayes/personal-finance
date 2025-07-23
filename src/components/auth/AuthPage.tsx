import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-center px-12">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="h-10 w-10" />
            <h1 className="text-3xl font-bold">BudgetTracker</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Your Personal Financial Command Center
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Make smarter money decisions with AI-powered insights that typically cost 
            $300/hour from a financial advisor.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Professional-grade financial analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Automated bank account integration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">AI-powered financial recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Real-time wealth tracking & projections</span>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-700 rounded-lg">
            <p className="text-sm text-blue-200 mb-2">Trusted by finance professionals at</p>
            <p className="text-lg font-semibold text-white">Google • Apple • Microsoft</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms (Mobile-first responsive) */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 lg:px-6 lg:py-12 safe-area-pt safe-area-pb">
        <div className="w-full max-w-md">
          {/* Mobile logo and branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">BudgetTracker</h1>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 text-sm font-medium">
                Your Personal Financial Command Center
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Professional-grade analytics • AI insights • Real-time tracking
              </p>
            </div>
          </div>

          {/* Auth Forms */}
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}

          {/* Trust indicators - Mobile optimized */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Bank-level security • 256-bit encryption • SOC 2 compliant
            </p>
            <div className="flex items-center justify-center gap-2 lg:gap-4 text-xs text-gray-400 flex-wrap">
              <span>🔒 Secure</span>
              <span>🏦 Read-only</span>
              <span>🔐 Private</span>
            </div>
          </div>

          {/* Mobile-specific features callout */}
          <div className="lg:hidden mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              ✨ What makes us special:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Mobile-optimized dashboard</li>
              <li>• Touch-friendly interface</li>
              <li>• Works offline</li>
              <li>• Real-time insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 