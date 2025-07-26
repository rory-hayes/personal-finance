import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceData } from '../hooks/useFinanceData';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { profile, user, updateProfile } = useAuth();
  const { users, updateUserIncome, initializeData } = useFinanceData();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    monthly_income: '',
    household_size: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Only update form data if we're not currently saving to prevent reverting changes
    if (profile && !isSaving) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email,
        monthly_income: profile.monthly_income.toString(),
        household_size: profile.household_size.toString(),
      });
    }
  }, [profile, isSaving]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setIsSaving(true);
    
    try {
      const monthlyIncome = parseFloat(formData.monthly_income) || 0;
      const householdSize = parseInt(formData.household_size) || 1;
      
      console.log('💾 Saving settings changes...');
      
      // Update profile first
      const { error: profileError } = await updateProfile({
        full_name: formData.full_name,
        monthly_income: monthlyIncome,
        household_size: householdSize,
      });

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error('Failed to update profile: ' + (profileError.message || 'Unknown error'));
      }

      console.log('✅ Profile updated successfully');

      // Update user income in finance system
      const mainUser = users.find(u => u.id === user.id);
      if (mainUser) {
        try { 
          await updateUserIncome(mainUser.id, monthlyIncome);
          console.log('✅ User income updated successfully'); 
        } catch (error) {
          console.error('Error updating user income:', error);
          // Don't fail the entire operation for this
        }
      }

      // Reload all finance data to ensure consistency
      await initializeData();
      console.log('✅ Data reloaded successfully');
      
      alert('✅ Changes saved successfully! Your settings have been updated.');
    } catch (error) {
      console.error('Error saving changes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to save changes: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setLoading(false);
      // Delay clearing isSaving to ensure form doesn't revert
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) return;
    
    const confirmReset = confirm(
      `Are you sure you want to reset your password?\n\nA password reset link will be sent to:\n${formData.email}\n\nYou will need to use this link to set a new password.`
    );
    
    if (!confirmReset) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      
      if (error) {
        alert(`Failed to send password reset email: ${error.message}`);
      } else {
        alert(`✅ Password reset email sent!\n\nPlease check your inbox at ${formData.email} for instructions to reset your password.`);
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('An error occurred while sending the password reset email. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (€)</label>
          <input
            type="number"
            name="monthly_income"
            value={formData.monthly_income}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Household Size</label>
          <input
            type="number"
            name="household_size"
            value={formData.household_size}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 text-white rounded transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <button
        onClick={handleResetPassword}
        className="text-sm text-blue-600 underline"
      >
        Reset Password
      </button>
    </div>
  );
};

export default Settings;
