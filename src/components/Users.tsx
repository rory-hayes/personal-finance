import React, { useState, useEffect } from 'react';
import { Plus, User, DollarSign, Edit3, Users as UsersIcon, Target, CreditCard, ArrowUpRight, Wallet, TrendingUp, Trash2, X } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { User as UserType, Account } from '../types';
import { showToast } from '../utils/toast';

const Users: React.FC = () => {
  const { users, addUser, updateUserIncome, updateUser, deleteUser, totalIncome, accounts, addAccount, updateAccount, deleteAccount, totalAccountBalance, allocateToAccount } = useFinanceData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState('');
  const [editingNameUser, setEditingNameUser] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    monthlyIncome: '',
  });
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    type: 'main' as Account['type'],
    balance: '',
  });
  const [allocationData, setAllocationData] = useState({
    amount: '',
    description: '',
    cliffAmount: '',
    cliffPeriod: '6' // 6 months or 12 months
  });

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'account' | 'user', id: string, name: string} | null>(null);
  const [transferTarget, setTransferTarget] = useState<string>('');

  // Handle Esc key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAddForm) {
          setShowAddForm(false);
          setFormData({ name: '', monthlyIncome: '' });
        }
        if (showAccountForm) {
          setShowAccountForm(false);
          setAccountFormData({ name: '', type: 'main', balance: '' });
        }
        if (showAllocationModal) {
          setShowAllocationModal(false);
          setSelectedAccount(null);
          setAllocationData({ amount: '', description: '', cliffAmount: '', cliffPeriod: '6' });
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }
      }
    };

    if (showAddForm || showAccountForm || showAllocationModal || showDeleteConfirm) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showAddForm, showAccountForm, showAllocationModal, showDeleteConfirm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    } else if (formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    const income = parseFloat(formData.monthlyIncome);
    if (!formData.monthlyIncome.trim() || isNaN(income)) {
      errors.push('Please enter a valid monthly income');
    } else if (income < 0) {
      errors.push('Monthly income cannot be negative');
    } else if (income > 1000000) {
      errors.push('Monthly income seems unusually large. Please verify.');
    }
    
    if (errors.length > 0) {
      showToast.validationError(errors.join(', '));
      return;
    }

    try {
      addUser({
        name: formData.name.trim(),
        monthlyIncome: income,
        color: '#3B82F6', // Will be overridden by the hook
      });

      setFormData({ name: '', monthlyIncome: '' });
      setShowAddForm(false);
      showToast.success('Household member added successfully!');
    } catch (error) {
      showToast.error('Failed to add household member. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', monthlyIncome: '' });
    setShowAddForm(false);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const errors: string[] = [];
    
    if (!accountFormData.name.trim()) {
      errors.push('Account name is required');
    } else if (accountFormData.name.trim().length < 3) {
      errors.push('Account name must be at least 3 characters');
    }
    
    const balance = parseFloat(accountFormData.balance);
    if (!accountFormData.balance.trim() || isNaN(balance)) {
      errors.push('Please enter a valid balance');
    } else if (balance < 0) {
      errors.push('Account balance cannot be negative');
    } else if (balance > 10000000) {
      errors.push('Account balance seems unusually large. Please verify.');
    }
    
    if (errors.length > 0) {
      showToast.validationError(errors.join(', '));
      return;
    }

    try {
      await addAccount({
        name: accountFormData.name.trim(),
        type: accountFormData.type,
        balance: balance,
        userId: users[0]?.id,
        color: '#3B82F6', // Will be overridden by the hook
        lastUpdated: new Date().toISOString(),
      });

      setAccountFormData({ name: '', type: 'checking', balance: '' });
      setShowAccountForm(false);
      showToast.success('Account added successfully!');
    } catch (error) {
      console.error('Error adding account:', error);
      showToast.error('Failed to add account. Please try again.');
    }
  };

  const handleAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) return;
    
    const amount = parseFloat(allocationData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast.validationError('Please enter a valid amount');
      return;
    }

    const lumpSum = parseFloat(allocationData.cliffAmount);

    allocateToAccount(
      selectedAccount.id,
      amount,
      allocationData.description,
      isNaN(lumpSum) ? undefined : lumpSum,
    );
    
    setAllocationData({ amount: '', description: '', cliffAmount: '', cliffPeriod: '6' });
    setSelectedAccount(null);
    setShowAllocationModal(false);
  };

  const accountTypeIcons = {
    main: Wallet,
    checking: Wallet,
    savings: DollarSign,
    investment: TrendingUp,
    retirement: Target,
    shares: TrendingUp,
    other: CreditCard,
  };

  const accountTypeLabels = {
    main: 'Main Account',
    checking: 'Checking',
    savings: 'Savings',
    investment: 'Investment',
    retirement: 'Retirement',
    shares: 'Share Vesting',
    other: 'Other',
  };

  const handleEditIncome = (userId: string, currentIncome: number) => {
    setEditingUser(userId);
    setEditingIncome(currentIncome.toString());
  };

  const handleSaveIncome = async () => {
    if (editingUser) {
      const income = parseFloat(editingIncome);
      if (!isNaN(income) && income >= 0) {
        try {
          await updateUserIncome(editingUser, income);
          // Success feedback could be added here
          console.log('✅ Income updated successfully');
        } catch (error) {
          console.error('❌ Failed to update income:', error);
          showToast.updateFailed('income');
          return; // Don't close the editor on error
        }
      } else {
        showToast.validationError('Please enter a valid positive number for monthly income.');
        return;
      }
      setEditingUser(null);
      setEditingIncome('');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditingIncome('');
  };

  const handleEditName = (userId: string, currentName: string) => {
    setEditingNameUser(userId);
    setNewName(currentName);
  };

  const handleSaveName = async () => {
    if (editingNameUser && newName.trim()) {
      try {
        await updateUser(editingNameUser, { name: newName.trim() });
        showToast.success('Member name updated successfully!');
      } catch (e) {
        console.error('Failed to update name', e);
        showToast.error('Failed to update member name. Please try again.');
        return;
      }
    }
    setEditingNameUser(null);
    setNewName('');
  };

  const handleDeleteUserClick = (id: string, name: string) => {
    setItemToDelete({ type: 'user', id, name });
    setTransferTarget(users.find(u => u.id !== id)?.id || '');
    setShowDeleteConfirm(true);
  };

  // Delete confirmation handlers
  const handleDeleteAccount = (accountId: string, accountName: string) => {
    setItemToDelete({ type: 'account', id: accountId, name: accountName });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'account') {
        await deleteAccount(itemToDelete.id);
        console.log('✅ Account deleted successfully');
      } else {
        await deleteUser(itemToDelete.id, transferTarget || undefined);
        console.log('✅ User deleted successfully');
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setTransferTarget('');
    } catch (error) {
      console.error('❌ Failed to delete:', error);
      showToast.deleteFailed(itemToDelete.type);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setTransferTarget('');
  };

  // Filter out duplicate users and ensure only one primary user
  const uniqueUsers = users.reduce((acc, user, index) => {
    const existingUser = acc.find(u => u.name.toLowerCase() === user.name.toLowerCase());
    if (!existingUser) {
      acc.push({ ...user, isPrimary: index === 0 });
    }
    return acc;
  }, [] as (UserType & { isPrimary: boolean })[]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Household Members</h2>
          <p className="text-gray-600">
            Manage household members and their financial information
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAccountForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Household Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">Total Household Income</p>
            <p className="text-3xl font-bold">€{totalIncome.toLocaleString()}</p>
            <p className="text-blue-100 mt-1">Per month across {uniqueUsers.length} member{uniqueUsers.length === 1 ? '' : 's'}</p>
          </div>
          <div className="p-3 bg-blue-500 rounded-lg">
            <UsersIcon className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Household Member</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Partner, Spouse, Alex"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
                                        Monthly Income (€)
                </label>
                <input
                  type="number"
                  id="monthlyIncome"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Household Accounts</h3>
            <p className="text-sm text-gray-600">Manage and allocate funds to different accounts</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">€{totalAccountBalance.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Balance</p>
          </div>
        </div>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const IconComponent = accountTypeIcons[account.type] || Wallet; // Fallback to Wallet icon
              return (
                <div key={account.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${account.color}20`, color: account.color }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-500">{accountTypeLabels[account.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowAllocationModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Allocate funds"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id, account.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900">
                      €{account.balance.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={account.balance}
                        onChange={(e) => {
                          const newBalance = parseFloat(e.target.value) || 0;
                          updateAccount(account.id, { balance: newBalance });
                        }}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {new Date(account.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No accounts added yet</p>
            <p className="text-sm text-gray-400">Add accounts to track and allocate your funds</p>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showAccountForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
        >
          <div className="bg-white rounded-xl max-w-md w-full" role="document">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 id="account-modal-title" className="text-xl font-bold text-gray-900">Add New Account</h2>
                <button
                  onClick={() => {
                    setShowAccountForm(false);
                    setAccountFormData({ name: '', type: 'main', balance: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAccountSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountFormData.name}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Checking, Emergency Fund"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  value={accountFormData.type}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="main">Main Account</option>
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                  <option value="retirement">Retirement</option>
                  <option value="shares">Share Vesting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance (€)
                </label>
                <input
                  type="number"
                  value={accountFormData.balance}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, balance: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountForm(false);
                    setAccountFormData({ name: '', type: 'checking', balance: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && selectedAccount && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="allocation-modal-title"
        >
          <div className="bg-white rounded-xl max-w-md w-full" role="document">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="allocation-modal-title" className="text-xl font-bold text-gray-900">Allocate Funds</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add funds to {selectedAccount.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAllocationModal(false);
                    setSelectedAccount(null);
                    setAllocationData({ amount: '', description: '', cliffAmount: '', cliffPeriod: '6' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAllocationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (€)
                </label>
                <input
                  type="number"
                  value={allocationData.amount}
                  onChange={(e) => setAllocationData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliff Lump Sum (€) - Optional
                </label>
                <input
                  type="number"
                  value={allocationData.cliffAmount}
                  onChange={(e) => setAllocationData(prev => ({ ...prev, cliffAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One-time payment after cliff period
                </p>
              </div>
              
              {allocationData.cliffAmount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliff Period
                  </label>
                  <select
                    value={allocationData.cliffPeriod}
                    onChange={(e) => setAllocationData(prev => ({ ...prev, cliffPeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="6">6 months</option>
                    <option value="12">1 year</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Time before cliff payment is made
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={allocationData.description}
                  onChange={(e) => setAllocationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Monthly salary allocation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance:</p>
                <p className="text-lg font-semibold text-gray-900">
                  €{selectedAccount.balance.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Allocate Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllocationModal(false);
                    setSelectedAccount(null);
                    setAllocationData({ amount: '', description: '', cliffAmount: '', cliffPeriod: '6' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {uniqueUsers.map((user) => {
          const incomePercentage = totalIncome > 0 ? (user.monthlyIncome / totalIncome) * 100 : 0;
          
          return (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: user.color }}
                  >
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    {editingNameUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                        <button onClick={handleSaveName} className="text-green-600">✓</button>
                        <button onClick={() => {setEditingNameUser(null);setNewName('');}} className="text-red-600">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                          {user.isPrimary && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Primary</span>
                          )}
                        </h3>
                        {editingNameUser !== user.id && (
                          <button
                            onClick={() => handleEditName(user.id, user.name)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            aria-label={`Edit name for ${user.name}`}
                            title="Edit name"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {incomePercentage.toFixed(1)}% of household income
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingIncome}
                          onChange={(e) => setEditingIncome(e.target.value)}
                          className="text-xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 w-32"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={handleSaveIncome}
                          className="text-green-600 hover:text-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            €{user.monthlyIncome.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">per month</p>
                        </div>
                        {editingUser !== user.id && (
                          <button
                            onClick={() => handleEditIncome(user.id, user.monthlyIncome)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            aria-label={`Edit monthly income for ${user.name}`}
                            title="Edit monthly income"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteUserClick(user.id, user.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label={`Delete ${user.name} from household`}
                    title="Remove from household"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Income Visualization */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${incomePercentage}%`,
                      backgroundColor: user.color
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Recommendations */}
      {totalIncome > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Financial Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">
                €{Math.round(totalIncome * 0.2).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-green-800 mb-1">Emergency Fund</div>
              <div className="text-xs text-green-600">20% of monthly income</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                €{Math.round(totalIncome * 0.15).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-blue-800 mb-1">Investments</div>
              <div className="text-xs text-blue-600">15% of monthly income</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                €{Math.round(totalIncome * 0.65).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-purple-800 mb-1">Living Expenses</div>
              <div className="text-xs text-purple-600">65% of monthly income</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Personalized Recommendations:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Build an emergency fund of €{Math.round(totalIncome * 6).toLocaleString()} (6 months of expenses)</li>
              <li>• Invest €{Math.round(totalIncome * 0.15).toLocaleString()} monthly for long-term growth</li>
              <li>• Keep living expenses under €{Math.round(totalIncome * 0.65).toLocaleString()} per month</li>
              <li>• Consider increasing income through side projects or skill development</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Household Financial Management Tips</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Transparency:</strong> All household members can see the complete financial picture</p>
          <p>• <strong>Goal Setting:</strong> Work together on shared financial goals like house purchases or vacations</p>
          <p>• <strong>Contribution Tracking:</strong> Each member's income is tracked separately for fair planning</p>
          <p>• <strong>Joint Analysis:</strong> The AI considers all household income and expenses for better insights</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete {itemToDelete.type === 'account' ? 'Account' : 'Member'}
                </h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>?
                {itemToDelete.type === 'account'
                  ? ' This will permanently remove the account and all associated data.'
                  : ' This will permanently remove the household member and all associated data.'
                }
              </p>

              {itemToDelete.type === 'user' && users.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer accounts to
                  </label>
                  <select
                    value={transferTarget}
                    onChange={e => setTransferTarget(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {users.filter(u => u.id !== itemToDelete.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete {itemToDelete.type === 'account' ? 'Account' : 'Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;