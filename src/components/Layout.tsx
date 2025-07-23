import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  PieChart, 
  Target, 
  Users, 
  Wallet, 
  Menu, 
  X,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'assets', label: 'Assets', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'users', label: 'Household', icon: Users },
    { id: 'budget', label: 'Budget', icon: Wallet },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const NavItem = ({ item, isMobile = false }: { item: typeof navItems[0], isMobile?: boolean }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    
    return (
      <button
        onClick={() => {
          onTabChange(item.id);
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={`
          ${isMobile 
            ? 'flex flex-col items-center justify-center p-3 rounded-lg transition-colors min-h-[64px]' 
            : 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full'
          }
          ${isActive 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
        `}
      >
        <Icon className={`${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
        <span className={`${isMobile ? 'text-xs font-medium mt-1' : 'font-medium'}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">BudgetTracker</span>
            </div>
            
            {/* User Profile */}
            <div className="mt-6 px-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.household_size || 1} member{(profile?.household_size || 1) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            <span className="ml-2 text-lg font-bold text-gray-900">BudgetTracker</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Profile Avatar */}
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            
            {/* Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {profile?.household_size || 1} member{(profile?.household_size || 1) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                  {navItems.map((item) => (
                    <NavItem key={item.id} item={item} isMobile />
                  ))}
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-full p-3 rounded-lg hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          <div className="py-4 lg:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="grid grid-cols-6 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-h-[56px]
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium mt-1 leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="lg:hidden h-20" />
    </div>
  );
};

export default Layout;