import React, { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Users, Euro, Wallet, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HouseholdMember } from '../../types';
import { isSupabaseMock } from '../../lib/supabase';

const OnboardingFlow: React.FC = () => {
  const { profile, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [formData, setFormData] = useState({
    household_size: 1,
    household_members: [{ name: '', isMain: true }] as HouseholdMember[], // Array of household member names
    monthly_income: '',
    accounts: [
      { name: '', type: 'checking', balance: '' },
      { name: '', type: 'savings', balance: '' }
    ]
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    household_members?: string[];
    monthly_income?: string;
    accounts?: { name?: string; balance?: string }[];
  }>({});

  const [showValidation, setShowValidation] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Welcome to BudgetTracker',
      subtitle: 'Let\'s set up your financial profile',
    },
    {
      id: 2,
      title: 'Household Size',
      subtitle: 'How many people are in your household?',
    },
    {
      id: 3,
      title: 'Household Members',
      subtitle: 'Tell us about the people in your household',
    },
    {
      id: 4,
      title: 'Income Setup',
      subtitle: 'Set up your monthly income',
    },
    {
      id: 5,
      title: 'Initial Accounts',
      subtitle: 'Add your main accounts to get started',
    },
  ];

  // Validation functions
  const validateStep3 = () => {
    const errors: string[] = [];
    formData.household_members.forEach((member, index) => {
      if (!member.name.trim()) {
        errors[index] = index === 0 ? 'Your name is required' : 'Member name is required';
      }
    });
    
    setValidationErrors(prev => ({ ...prev, household_members: errors }));
    return errors.length === 0;
  };

  const validateStep4 = () => {
    const monthlyIncome = parseFloat(formData.monthly_income);
    let error = '';
    
    if (!formData.monthly_income.trim()) {
      error = 'Monthly income is required';
    } else if (isNaN(monthlyIncome) || monthlyIncome < 0) {
      error = 'Please enter a valid positive number';
    } else if (monthlyIncome === 0) {
      error = 'Monthly income must be greater than 0';
    }
    
    setValidationErrors(prev => ({ ...prev, monthly_income: error }));
    return !error;
  };

  const validateStep5 = () => {
    const accountErrors: { name?: string; balance?: string }[] = [];
    let hasErrors = false;
    
    formData.accounts.forEach((account, index) => {
      const errors: { name?: string; balance?: string } = {};
      
      if (!account.name.trim()) {
        errors.name = 'Account name is required';
        hasErrors = true;
      }
      
      if (!account.balance.trim()) {
        errors.balance = 'Balance is required';
        hasErrors = true;
      } else {
        const balance = parseFloat(account.balance);
        if (isNaN(balance) || balance < 0) {
          errors.balance = 'Please enter a valid positive number';
          hasErrors = true;
        }
      }
      
      accountErrors[index] = errors;
    });
    
    setValidationErrors(prev => ({ ...prev, accounts: accountErrors }));
    return !hasErrors;
  };

  const handleNext = () => {
    setShowValidation(true);
    
    // Validate current step before proceeding
    let isValid = true;
    
    if (currentStep === 3) {
      isValid = validateStep3();
    } else if (currentStep === 4) {
      isValid = validateStep4();
    } else if (currentStep === 5) {
      isValid = validateStep5();
    }
    
    if (isValid && currentStep < steps.length) {
      setShowValidation(false);
      setValidationErrors({});
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateHouseholdSize = (size: number) => {
    const currentMembers = formData.household_members;
    const newMembers: HouseholdMember[] = [];
    
    // Keep existing members up to the new size
    for (let i = 0; i < size; i++) {
      if (i < currentMembers.length) {
        newMembers.push(currentMembers[i]);
      } else {
        newMembers.push({ 
          name: i === 0 ? profile?.full_name || '' : '', 
          isMain: i === 0 
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      household_size: size,
      household_members: newMembers
    }));
  };

  const updateMemberName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      household_members: prev.household_members.map((member, i) => 
        i === index ? { ...member, name } : member
      )
    }));

    // Clear validation error for this field when user starts typing
    if (name.trim() && validationErrors.household_members?.[index]) {
      const updatedErrors = [...(validationErrors.household_members || [])];
      delete updatedErrors[index];
      setValidationErrors(prev => ({
        ...prev,
        household_members: updatedErrors
      }));
    }
  };

  const updateMonthlyIncome = (value: string) => {
    setFormData(prev => ({ ...prev, monthly_income: value }));
    
    // Clear validation error when user starts typing
    if (value.trim() && validationErrors.monthly_income) {
      setValidationErrors(prev => ({
        ...prev,
        monthly_income: undefined
      }));
    }
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.map((account, i) => 
        i === index ? { ...account, [field]: value } : account
      )
    }));

    // Clear validation error for this field when user starts typing
    if (value.trim() && validationErrors.accounts?.[index]?.[field as keyof { name?: string; balance?: string }]) {
      const updatedAccountErrors = [...(validationErrors.accounts || [])];
      if (updatedAccountErrors[index]) {
        updatedAccountErrors[index] = {
          ...updatedAccountErrors[index],
          [field]: undefined
        };
      }
      setValidationErrors(prev => ({
        ...prev,
        accounts: updatedAccountErrors
      }));
    }
  };

  const handleComplete = async () => {
    // Final validation before submission
    setShowValidation(true);
    
    const step3Valid = validateStep3();
    const step4Valid = validateStep4();
    const step5Valid = validateStep5();
    
    if (!step3Valid || !step4Valid || !step5Valid) {
      // Scroll to top to show validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🚀 Starting onboarding completion...');
      console.log('📝 Form data:', formData);
      console.log('🔍 Supabase mock mode:', isSupabaseMock);
      console.log('🔍 Environment variables:', {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
      });
      
       // Increase timeout to 30 seconds to prevent premature timeouts on slow connections.
       const timeoutPromise = new Promise((_, reject) => {
         setTimeout(() => reject(new Error('Onboarding timeout - please try again')), 30000);
       });
      
      const monthlyIncome = parseFloat(formData.monthly_income) || 0;
      
      const onboardingPromise = completeOnboarding({
        household_size: formData.household_size,
        household_members: formData.household_members,
        monthly_income: monthlyIncome,
        accounts: formData.accounts,
      });

      // Race between onboarding and timeout
      const result = await Promise.race([onboardingPromise, timeoutPromise]) as { error?: any } | undefined;

      if (result && result.error) {
        console.error('❌ Error completing onboarding:', result.error);
        
        // Check if it's a database connectivity issue
        if (result.error.message?.includes('connection') || result.error.message?.includes('timeout') || result.error.message?.includes('fetch')) {
          alert(`Database Connection Issue:\n\n${result.error.message || 'Database connection failed'}\n\nPossible causes:\n1. Incorrect Supabase URL\n2. Invalid API key\n3. Network connectivity issues\n4. Database schema not set up\n\nPlease check your Supabase configuration.`);
        } else {
          alert(`Setup failed: ${result.error.message || 'Please try again'}\n\nDEBUG INFO:\n- Supabase Mock Mode: ${isSupabaseMock}\n- Check browser console for more details`);
        }
      } else {
        console.log('✅ Onboarding completed successfully');
        alert('Setup completed successfully! Redirecting to dashboard...');
        // Success - the AuthContext will handle navigation via profile update
        // Force a small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: unknown) {
      console.error('💥 Error in handleComplete:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('timeout')) {
        alert(`Setup timeout: The setup process is taking longer than expected.\n\nDEBUG INFO:\n- Supabase Mock Mode: ${isSupabaseMock}\n- This usually means database connection issues\n- Check the Setup Guide below`);
      } else {
        alert(`Setup failed: ${errorMessage}\n\nDEBUG INFO:\n- Supabase Mock Mode: ${isSupabaseMock}\n- Check browser console for details`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Emergency bypass for testing - works with localStorage
  const handleEmergencyBypass = () => {
    console.log('🚨 Emergency bypass activated');
    if (confirm('TESTING ONLY: Skip onboarding and go directly to dashboard?\n\nThis will use localStorage and mark onboarding as complete locally.')) {
      setLoading(true);
      
      // Create mock profile and save to localStorage
      const mockProfile = {
        id: 'mock-user-id',
        email: profile?.email || 'test@example.com',
        full_name: profile?.full_name || 'Test User',
        household_size: 1,
        monthly_income: 0,
        currency: 'EUR',
        timezone: 'UTC',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('userProfile_mock-user-id', JSON.stringify(mockProfile));
      localStorage.setItem('onboardingCompleted_mock-user-id', 'true');
      
      // Force page reload to trigger auth state change
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      alert('Emergency bypass activated - page will reload in 1 second');
    }
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-3xl mx-auto mb-8">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Household</p>
          <p className="text-xs text-gray-600">Size & members</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <User className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Names</p>
          <p className="text-xs text-gray-600">Member details</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Euro className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Income</p>
          <p className="text-xs text-gray-600">Monthly earnings</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Wallet className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Accounts</p>
          <p className="text-xs text-gray-600">Main bank accounts</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Complete</p>
          <p className="text-xs text-gray-600">Start tracking</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
        >
          Let's Get Started
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Household Size
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        How many people will be using this budget tracker?
      </p>

      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((size) => (
            <button
              key={size}
              onClick={() => updateHouseholdSize(size)}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.household_size === size
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <span className="font-medium">{size} {size === 1 ? 'Person' : 'People'}</span>
              </div>
            </button>
          ))}
        </div>
        
        {formData.household_size > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Next:</strong> You'll be able to add names and details for each household member.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!formData.household_size}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Household Members
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Tell us about each person in your household
      </p>

      <div className="max-w-md mx-auto space-y-4">
        {formData.household_members.map((member, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {index === 0 ? 'Primary Account Holder (You)' : `Household Member ${index + 1}`}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateMemberName(index, e.target.value)}
                placeholder={index === 0 ? "Your full name" : "Member's name"}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  showValidation && validationErrors.household_members?.[index]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
            </div>
            {showValidation && validationErrors.household_members?.[index] && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                ⚠️ {validationErrors.household_members[index]}
              </p>
            )}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Why we need this:</strong> Individual names help with tracking contributions, 
            vesting schedules, and personalized financial goals for each household member.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Monthly Income
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        What's your total monthly household income?
      </p>

      <div className="max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Income (€) <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Euro className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={formData.monthly_income}
              onChange={(e) => updateMonthlyIncome(e.target.value)}
              placeholder="5000"
              min="0"
              step="0.01"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg ${
                showValidation && validationErrors.monthly_income
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
          </div>
          {showValidation && validationErrors.monthly_income && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              ⚠️ {validationErrors.monthly_income}
            </p>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Include:</strong> Salaries, freelance income, investments, and any other regular monthly income.
            Don't worry - you can always adjust this later.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Initial Accounts
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Add your main checking and savings accounts to get started
      </p>

      <div className="max-w-md mx-auto space-y-6">
        {formData.accounts.map((account, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {account.type === 'checking' ? 'Checking Account' : 'Savings Account'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => handleAccountChange(index, 'name', e.target.value)}
                  placeholder={`My ${account.type === 'checking' ? 'Checking' : 'Savings'} Account`}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    showValidation && validationErrors.accounts?.[index]?.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {showValidation && validationErrors.accounts?.[index]?.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {validationErrors.accounts[index]?.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance (€) <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={account.balance}
                    onChange={(e) => handleAccountChange(index, 'balance', e.target.value)}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      showValidation && validationErrors.accounts?.[index]?.balance
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                </div>
                {showValidation && validationErrors.accounts?.[index]?.balance && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {validationErrors.accounts[index]?.balance}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Required:</strong> Please add at least your main checking and savings accounts.
            This helps us provide accurate financial tracking and budgeting features.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
          {!loading && <CheckCircle className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 safe-area-pt safe-area-pb">
      <div className="w-full max-w-2xl">
        {/* Setup Issue Alert */}
        {isSupabaseMock && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">⚠️ Database Configuration Issue</h3>
            <p className="text-red-700 text-sm mb-3">
              The application is running without a proper database connection. 
              Onboarding will fail unless this is fixed.
            </p>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-red-600 underline text-sm mb-2"
            >
              {showDebugInfo ? 'Hide' : 'Show'} Setup Instructions
            </button>
            {showDebugInfo && (
              <div className="mt-3 p-3 bg-red-50 rounded text-xs text-red-800">
                <strong>For Developers:</strong><br/>
                1. Create a Supabase project at https://supabase.com<br/>
                2. Set environment variables:<br/>
                   - VITE_SUPABASE_URL=your_project_url<br/>
                   - VITE_SUPABASE_ANON_KEY=your_anon_key<br/>
                3. For Netlify: Set these in Site Settings → Environment Variables
              </div>
            )}
            <div className="mt-3">
              <button
                onClick={handleEmergencyBypass}
                className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
              >
                🚨 Temporary Bypass (Testing Only)
              </button>
            </div>
          </div>
        )}
        
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
          {currentStep === 5 && renderStep5()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow; 