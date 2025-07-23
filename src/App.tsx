import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import AuthPage from './components/auth/AuthPage';
import OnboardingFlow from './components/auth/OnboardingFlow';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Assets from './components/Assets';
import Goals from './components/Goals';
import Users from './components/Users';
import Budget from './components/Budget';

// Main app content component (after authentication)
const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  // Listen for custom events from Dashboard - ALWAYS call this hook
  React.useEffect(() => {
    // Only set up event listeners if user is authenticated and onboarded
    if (!user || !profile?.onboarding_completed) {
      return;
    }

    const handleSwitchToExpenses = () => setActiveTab('expenses');
    const handleSwitchToAssets = () => setActiveTab('assets');
    const handleSwitchToGoals = () => setActiveTab('goals');
    const handleSwitchToBudget = () => setActiveTab('budget');
    const handleSwitchToUsers = () => setActiveTab('users');

    window.addEventListener('switchToExpenses', handleSwitchToExpenses);
    window.addEventListener('switchToAssets', handleSwitchToAssets);
    window.addEventListener('switchToGoals', handleSwitchToGoals);
    window.addEventListener('switchToBudget', handleSwitchToBudget);
    window.addEventListener('switchToUsers', handleSwitchToUsers);

    return () => {
      window.removeEventListener('switchToExpenses', handleSwitchToExpenses);
      window.removeEventListener('switchToAssets', handleSwitchToAssets);
      window.removeEventListener('switchToGoals', handleSwitchToGoals);
      window.removeEventListener('switchToBudget', handleSwitchToBudget);
      window.removeEventListener('switchToUsers', handleSwitchToUsers);
    };
  }, [user, profile?.onboarding_completed]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  // Show landing page or auth page if user is not logged in
  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  // Show onboarding if user hasn't completed it
  if (!profile?.onboarding_completed) {
    return <OnboardingFlow />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <Expenses />;
      case 'assets':
        return <Assets />;
      case 'goals':
        return <Goals />;
      case 'users':
        return <Users />;
      case 'budget':
        return <Budget />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

// Main App component with authentication provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;