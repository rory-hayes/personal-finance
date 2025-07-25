import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceData } from '../hooks/useFinanceData';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { profile, user, updateProfile } = useAuth();
  const { users, updateUserIncome } = useFinanceData();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    monthly_income: '',
    household_size: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email,
        monthly_income: profile.monthly_income.toString(),
        household_size: profile.household_size.toString(),
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const monthlyIncome = parseFloat(formData.monthly_income) || 0;
    const householdSize = parseInt(formData.household_size) || 1;
    await updateProfile({
      full_name: formData.full_name,
      monthly_income: monthlyIncome,
      household_size: householdSize,
    });
    const mainUser = users.find(u => u.id === user.id);
    if (mainUser) {
      try { await updateUserIncome(mainUser.id, monthlyIncome); } catch {}
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!formData.email) return;
    await supabase.auth.resetPasswordForEmail(formData.email);
    alert('Password reset email sent if the address exists.');
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
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save Changes
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
