import React, { useState } from 'react';
import { Plus, Edit3, Trash2, TrendingUp, Home, Car, PieChart, DollarSign } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { showToast } from '../utils/toast';
import { Asset } from '../types';

const Assets: React.FC = () => {
  const { assets, addAsset, updateAsset, deleteAsset, totalAssetValue } = useFinanceData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    value: '',
  });
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    value?: string;
  }>({});
  const [showValidation, setShowValidation] = useState(false);

  const assetCategories = [
    { value: 'Real Estate', icon: Home, color: 'bg-blue-100 text-blue-600' },
    { value: 'Vehicles', icon: Car, color: 'bg-green-100 text-green-600' },
    { value: 'Investments', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { value: 'Cash', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600' },
    { value: 'Other', icon: PieChart, color: 'bg-gray-100 text-gray-600' },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = assetCategories.find(c => c.value === category);
    return cat || assetCategories[assetCategories.length - 1];
  };

  // Validation functions
  const validateForm = () => {
    const errors: { name?: string; value?: string } = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Asset name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Asset name must be at least 2 characters';
    }
    
    // Validate value
    if (!formData.value.trim()) {
      errors.value = 'Asset value is required';
    } else {
      const value = parseFloat(formData.value);
      if (isNaN(value)) {
        errors.value = 'Please enter a valid number';
      } else if (value < 0) {
        errors.value = 'Asset value must be positive';
      } else if (value === 0) {
        errors.value = 'Asset value must be greater than 0';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationError = (field: string) => {
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      return;
    }

    const value = parseFloat(formData.value);
    const assetData = {
      name: formData.name.trim(),
      category: formData.category,
      value: value,
    };

    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, assetData);
        showToast.updated('Asset');
        setEditingAsset(null);
      } else {
        await addAsset(assetData);
        showToast.saved('Asset');
      }

      setFormData({ name: '', category: 'Other', value: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      showToast.error('Failed to save asset. Please try again.');
    }
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      category: asset.category,
      value: asset.value.toString(),
    });
    setEditingAsset(asset);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', category: 'Other', value: '' });
    setEditingAsset(null);
    setShowAddForm(false);
    setValidationErrors({});
    setShowValidation(false);
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (value.trim()) clearValidationError('name');
  };

  const handleValueChange = (value: string) => {
    setFormData(prev => ({ ...prev, value }));
    if (value.trim()) clearValidationError('value');
  };

  // Delete confirmation handlers
  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      await deleteAsset(assetToDelete.id);
      console.log('✅ Asset deleted successfully');
      setShowDeleteConfirm(false);
      setAssetToDelete(null);
    } catch (error) {
      console.error('❌ Failed to delete asset:', error);
      showToast.error('Failed to delete asset. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAssetToDelete(null);
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const categoryTotals = Object.entries(groupedAssets).map(([category, assets]) => ({
    category,
    total: assets.reduce((sum, asset) => sum + asset.value, 0),
    count: assets.length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assets & Net Worth</h2>
          <p className="text-gray-600">
            Track your assets to calculate your total net worth
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      {/* Net Worth Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">Total Net Worth</p>
            <p className="text-3xl font-bold">€{totalAssetValue.toLocaleString()}</p>
            <p className="text-blue-100 mt-1">Across {assets.length} asset{assets.length === 1 ? '' : 's'}</p>
          </div>
          <div className="p-3 bg-blue-500 rounded-lg">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Category Overview */}
      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTotals.map(({ category, total, count }) => {
            const categoryInfo = getCategoryIcon(category);
            const percentage = totalAssetValue > 0 ? (total / totalAssetValue) * 100 : 0;
            
            return (
              <div key={category} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                      <categoryInfo.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-500">{count} item{count === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-gray-900">€{total.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-500">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Primary Home, 2020 Honda Civic"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    showValidation && validationErrors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {showValidation && validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {validationErrors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assetCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.value}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Current Value (€) <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                id="value"
                value={formData.value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  showValidation && validationErrors.value
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {showValidation && validationErrors.value && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  ⚠️ {validationErrors.value}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editingAsset ? 'Update Asset' : 'Add Asset'}
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

      {/* Assets List */}
      {assets.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedAssets).map(([category, categoryAssets]) => {
            const categoryInfo = getCategoryIcon(category);
            const categoryTotal = categoryAssets.reduce((sum, asset) => sum + asset.value, 0);
            
            return (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                        <categoryInfo.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        <p className="text-sm text-gray-500">
                          {categoryAssets.length} asset{categoryAssets.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      €{categoryTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {categoryAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{asset.name}</h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold text-gray-900">
                            €{asset.value.toLocaleString()}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(asset)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete asset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Added Yet</h3>
          <p className="text-gray-500 mb-6">
            Start tracking your assets to calculate your net worth and get better financial insights.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Your First Asset
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && assetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Asset</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this asset?
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <p className="font-medium text-gray-900">{assetToDelete.name}</p>
                <p className="text-sm text-gray-600">
                  €{assetToDelete.value.toLocaleString()} • {assetToDelete.category}
                </p>
              </div>
              
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
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;