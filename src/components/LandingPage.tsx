import React, { useState } from 'react';
import { 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Users, 
  Target, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Zap,
  DollarSign,
  PieChart,
  Brain,
  Lock,
  Globe,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get recommendations that typically cost €300/hour from financial advisors",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: PieChart,
      title: "Professional Analytics", 
      description: "Advanced financial modeling and portfolio analysis tools",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized for on-the-go financial management with touch-friendly interface",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "256-bit encryption, SOC 2 compliance, and read-only access to your accounts",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Smart goal setting with predictive timelines and achievement strategies",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: TrendingUp,
      title: "Wealth Projections",
      description: "See your financial future with detailed projections and scenario modeling",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  const stats = [
    { value: "15+", label: "Account Types Supported" },
    { value: "€2.5M+", label: "Assets Under Management" },
    { value: "50k+", label: "Active Users" },
    { value: "4.9★", label: "User Rating" }
  ];

  const comparisons = [
    { feature: "Professional-grade analytics", us: true, others: false },
    { feature: "AI-powered recommendations", us: true, others: false },
    { feature: "Mobile-optimized interface", us: true, others: true },
    { feature: "Multi-account aggregation", us: true, others: true },
    { feature: "Advanced goal modeling", us: true, others: false },
    { feature: "Lifetime access (no subscriptions)", us: true, others: false },
    { feature: "Personal financial advisor", us: "AI-powered", others: "€300+/hour" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">BudgetTracker</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
            </div>

            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="mb-12 lg:mb-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Limited Time: Lifetime Access for €50
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Personal
                <span className="text-blue-600 block">Financial Command Center</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Make smarter money decisions with AI-powered insights that typically cost 
                <strong className="text-gray-900"> €300/hour from a financial advisor</strong>. 
                Get professional-grade analytics for a one-time payment.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={onGetStarted}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-medium text-lg"
                >
                  See Demo
                </button>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>No monthly fees • Lifetime access • Cancel anytime during trial</span>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Net Worth Growth</h3>
                    <span className="text-green-600 text-sm font-medium">+12.4% this year</span>
                  </div>
                  
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-white text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm opacity-90">Interactive Dashboard Preview</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">€127k</div>
                      <div className="text-sm text-gray-600">Total Assets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">€2,400</div>
                      <div className="text-sm text-gray-600">Monthly Savings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">8.2%</div>
                      <div className="text-sm text-gray-600">Portfolio Return</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full animate-pulse">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white p-3 rounded-full animate-pulse">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Professional-Grade Financial Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to take control of your finances, all in one beautifully designed platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`
                    relative p-6 lg:p-8 rounded-2xl border border-gray-200 
                    hover:border-blue-300 transition-all duration-300 cursor-pointer
                    ${hoveredFeature === index ? 'transform -translate-y-1 shadow-lg' : 'shadow-sm'}
                  `}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`${feature.bgColor} p-3 rounded-lg w-fit mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              One payment. Lifetime access. No monthly fees ever.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium">
                🎯 Limited Time Offer
              </div>
              
              <div className="p-8 pt-16 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  BudgetTracker Pro
                </h3>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">€50</span>
                  <span className="text-gray-600 ml-2">lifetime</span>
                </div>
                
                <div className="text-gray-600 mb-8">
                  <span className="line-through">€300/hour financial advisor</span>
                  <br />
                  <span className="text-green-600 font-medium">Save thousands vs. traditional advice</span>
                </div>

                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Professional-grade financial analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>AI-powered investment recommendations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited bank account connections</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Advanced goal tracking & projections</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Mobile app with offline access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Bank-level security & encryption</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Lifetime updates & new features</span>
                  </li>
                </ul>

                <button
                  onClick={onGetStarted}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Start Free Trial → Pay Later
                </button>
                
                <p className="text-sm text-gray-600 mt-4">
                  30-day free trial • No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BudgetTracker?
            </h2>
            <p className="text-xl text-gray-600">
              See how we compare to traditional financial advisors and other apps.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 p-4 font-semibold text-gray-900">
              <div></div>
              <div className="text-center">BudgetTracker</div>
              <div className="text-center">Others</div>
            </div>
            
            {comparisons.map((item, index) => (
              <div key={index} className="grid grid-cols-3 p-4 border-b border-gray-100 last:border-b-0">
                <div className="text-gray-900 font-medium">{item.feature}</div>
                <div className="text-center">
                  {typeof item.us === 'boolean' ? (
                    item.us ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <div className="h-5 w-5 bg-gray-300 rounded-full mx-auto"></div>
                    )
                  ) : (
                    <span className="text-sm text-green-600 font-medium">{item.us}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof item.others === 'boolean' ? (
                    item.others ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <div className="h-5 w-5 bg-gray-300 rounded-full mx-auto"></div>
                    )
                  ) : (
                    <span className="text-sm text-red-600 font-medium">{item.others}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Finance Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Finally, professional-grade financial tools without the premium price tag. 
                The AI insights are remarkably accurate."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Sarah Chen</div>
                  <div className="text-sm text-gray-600">Financial Analyst, Google</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The mobile experience is outstanding. I can manage my portfolio 
                effectively even when traveling."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Marcus Johnson</div>
                  <div className="text-sm text-gray-600">Investment Manager, Apple</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Saved me thousands compared to hiring a financial advisor. 
                The lifetime pricing model is brilliant."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Elena Rodriguez</div>
                  <div className="text-sm text-gray-600">Senior Engineer, Microsoft</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who've already transformed their financial future.
          </p>
          
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg inline-flex items-center gap-2"
          >
            Start Your Free Trial Today
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <p className="text-blue-100 text-sm mt-4">
            No credit card required • 30-day free trial • Lifetime access for €50
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">BudgetTracker</span>
              </div>
              <p className="text-gray-400">
                Your personal financial command center.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BudgetTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 