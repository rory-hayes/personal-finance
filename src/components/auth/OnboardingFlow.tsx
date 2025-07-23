import React, { useState } from 'react';
import { Users, DollarSign, CheckCircle, ArrowRight, ArrowLeft, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const OnboardingFlow: React.FC = () => {
  const { profile, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    household_size: 1,
    monthly_income: '',
    accounts: [
      { name: '', type: 'checking', balance: '' },
      { name: '', type: 'savings', balance: '' }
    ]
  });

  const steps = [
    {
      id: 1,
      title: 'Welcome to BudgetTracker',
      subtitle: 'Let\'s set up your financial profile',
    },
    {
      id: 2,
      title: 'Household Information',
      subtitle: 'Tell us about your household',
    },
    {
      id: 3,
      title: 'Income Setup',
      subtitle: 'Set up your monthly income',
    },
    {
      id: 4,
      title: 'Initial Accounts',
      subtitle: 'Add your main accounts to get started',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.map((account, i) => 
        i === index ? { ...account, [field]: value } : account
      )
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    
    const monthlyIncome = parseFloat(formData.monthly_income) || 0;
    
    const { error } = await completeOnboarding({
      household_size: formData.household_size,
      monthly_income: monthlyIncome,
      accounts: formData.accounts,
    });

    if (error) {
      console.error('Error completing onboarding:', error);
      alert('There was an error setting up your profile. Please try again.');
    }
    
    setLoading(false);
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome to BudgetTracker, {profile?.full_name}!
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Let's take a few minutes to set up your financial profile. This helps us provide 
        personalized insights and recommendations.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Household</p>
          <p className="text-xs text-gray-600">Size & members</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Income</p>
          <p className="text-xs text-gray-600">Monthly earnings</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Wallet className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Accounts</p>
          <p className="text-xs text-gray-600">Main bank accounts</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Dashboard</p>
          <p className="text-xs text-gray-600">Your command center</p>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Household Information
        </h2>
        <p className="text-gray-600">
          How many people are in your household? This helps us calculate better recommendations.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of people in your household
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, household_size: size }))}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.household_size === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">{size}</div>
                <div className="text-xs text-gray-500">
                  {size === 1 ? 'person' : 'people'}
                </div>
              </button>
            ))}
          </div>
          
          {formData.household_size >= 4 && (
            <div className="mt-3">
              <label className="block text-sm text-gray-600 mb-1">
                More than 4 people? Enter exact number:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.household_size}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  household_size: parseInt(e.target.value) || 1 
                }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Why we ask:</strong> Household size helps us calculate emergency fund 
            recommendations and provide more accurate spending benchmarks.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Monthly Income
        </h2>
        <p className="text-gray-600">
          What's your total monthly household income? Include all sources like salary, 
          freelancing, investments, etc.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="monthly_income" className="block text-sm font-medium text-gray-700 mb-2">
            Total monthly income (EUR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
            <input
              type="number"
              id="monthly_income"
              value={formData.monthly_income}
              onChange={(e) => setFormData(prev => ({ ...prev, monthly_income: e.target.value }))}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="5,000"
              min="0"
              step="100"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Don't worry, you can update this anytime in your profile
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, monthly_income: '3000' }))}
            className="p-3 border border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium">€3,000</div>
            <div className="text-xs text-gray-500">Entry level</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, monthly_income: '5000' }))}
            className="p-3 border border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium">€5,000</div>
            <div className="text-xs text-gray-500">Average</div>
          </button>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Your privacy matters:</strong> This information is encrypted and only used 
            to provide personalized financial insights. We never share your data.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading || !formData.monthly_income}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Main Accounts
        </h2>
        <p className="text-gray-600">
          Let's add your two main accounts to get started. You can add more accounts later 
          from the dashboard.
        </p>
      </div>

      <div className="space-y-6">
        {formData.accounts.map((account, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              {account.type === 'checking' ? (
                <CreditCard className="h-5 w-5 text-blue-600" />
              ) : (
                <PiggyBank className="h-5 w-5 text-green-600" />
              )}
              <h3 className="font-medium text-gray-900">
                Account {index + 1} - {account.type === 'checking' ? 'Checking' : 'Savings'}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={account.name}
                onChange={(e) => handleAccountChange(index, 'name', e.target.value)}
                placeholder={`My ${account.type === 'checking' ? 'Checking' : 'Savings'} Account`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance (EUR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  value={account.balance}
                  onChange={(e) => handleAccountChange(index, 'balance', e.target.value)}
                  placeholder="1,000"
                  min="0"
                  step="100"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>💡 Getting started:</strong> Don't worry about being perfect! You can always 
            update these balances and add more accounts later from the <strong>Accounts</strong> section.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Complete Setup
              <CheckCircle className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 safe-area-pt safe-area-pb">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm mobile-shadow p-6 lg:p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow; 