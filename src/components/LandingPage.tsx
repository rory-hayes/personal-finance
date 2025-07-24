import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Shield, 
  Smartphone,
  PieChart,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Wallet,
  CreditCard,
  TrendingDown
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: BarChart3,
      title: 'Smart Dashboard',
      description: 'Get a complete overview of your finances with customizable cards and real-time insights.'
    },
    {
      icon: Users,
      title: 'Household Management',
      description: 'Track multiple family members, their contributions, and individual financial goals.'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set and monitor financial goals with automated progress tracking and milestone alerts.'
    },
    {
      icon: PieChart,
      title: 'Expense Analytics',
      description: 'Understand your spending patterns with detailed categorization and trend analysis.'
    },
    {
      icon: Wallet,
      title: 'Account Integration',
      description: 'Connect all your accounts in one place for a unified view of your financial health.'
    },
    {
      icon: TrendingUp,
      title: 'Investment Tracking',
      description: 'Monitor your portfolio performance and track vesting schedules automatically.'
    }
  ];

  const benefits = [
    'Complete financial visibility in one dashboard',
    'Automated expense categorization and insights',
    'Multi-user household budget management',
    'Real-time goal tracking and progress alerts',
    'Secure bank-level encryption for all data',
    'Mobile-responsive design for on-the-go access'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">BudgetTracker</span>
            </div>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Take Control of Your
            <span className="text-blue-600 block">Financial Future</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete personal finance platform that helps you track expenses, 
            manage budgets, monitor investments, and achieve your financial goals—all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              Start Your Financial Journey
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Watch Demo
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-gray-600">Secure & Private</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Real-time</div>
              <div className="text-gray-600">Updates & Insights</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">Multi-user</div>
              <div className="text-gray-600">Household Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From daily expenses to long-term investments, BudgetTracker provides 
              comprehensive tools for every aspect of your financial life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Your Financial Command Center
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            See everything that matters at a glance with our intuitive dashboard design.
          </p>

          {/* Mock Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Monthly Income</h3>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">€5,420</div>
              <div className="text-sm text-green-600 flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8% from last month
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Expenses</h3>
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">€3,240</div>
              <div className="text-sm text-red-600 flex items-center mt-2">
                <TrendingDown className="h-4 w-4 mr-1" />
                -3% from last month
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Savings Goal</h3>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">72%</div>
              <div className="text-sm text-gray-600 mt-2">
                €7,200 of €10,000
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Net Worth</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">€47,830</div>
              <div className="text-sm text-green-600 flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% this year
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose BudgetTracker?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built by financial experts for real people, BudgetTracker combines 
                powerful analytics with simple, intuitive design.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-blue-100 mb-6">
                  Join thousands of users who have taken control of their financial future.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-200" />
                    <span className="text-sm">Bank-level security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-blue-200" />
                    <span className="text-sm">Works on all devices</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-200" />
                    <span className="text-sm">Multi-user support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Your Financial Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            No credit card required. Set up your account in under 2 minutes.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">BudgetTracker</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 BudgetTracker. Take control of your financial future.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 