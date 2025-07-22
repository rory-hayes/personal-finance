import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Assets from './components/Assets';
import Goals from './components/Goals';
import Users from './components/Users';
import Budget from './components/Budget';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Listen for custom events from Dashboard
  React.useEffect(() => {
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
  }, []);

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
}

export default App;