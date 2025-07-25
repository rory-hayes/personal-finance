import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../../../types';
import { showToast } from '../../../utils/toast';

interface VestingScheduleData {
  userId: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
  cliffAmount?: number;
  cliffPeriod?: number;
}

interface VestingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VestingScheduleData) => Promise<void>;
  currentUser: User;
}

const VestingScheduleModal: React.FC<VestingScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    monthlyAmount: '',
    startDate: '',
    endDate: '',
    description: '',
    cliffAmount: '',
    cliffPeriod: '6'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Esc key to close modal
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const monthlyAmount = parseFloat(formData.monthlyAmount);
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      showToast.validationError('Please enter a valid monthly amount');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      showToast.validationError('Please enter both start and end dates');
      return;
    }
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      showToast.validationError('End date must be after start date');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const vestingData = {
        userId: currentUser.id,
        monthlyAmount: monthlyAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim() || undefined,
        cliffAmount: formData.cliffAmount ? parseFloat(formData.cliffAmount) : undefined,
        cliffPeriod: formData.cliffAmount ? parseInt(formData.cliffPeriod) : undefined
      };

      await onSubmit(vestingData);
      
      // Reset form
      setFormData({
        monthlyAmount: '',
        startDate: '',
        endDate: '',
        description: '',
        cliffAmount: '',
        cliffPeriod: '6'
      });
      onClose();
      
    } catch (error) {
      console.error('Error adding vesting schedule:', error);
      showToast.error('Error adding vesting schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vesting-modal-title"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" role="document">
        <div className="flex items-center justify-between mb-6">
          <h2 id="vesting-modal-title" className="text-xl font-bold text-gray-900">Add Vesting Schedule</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Amount (€) *
            </label>
            <input
              type="number"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyAmount: e.target.value }))}
              placeholder="1000.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Stock options, Performance shares"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliff Lump Sum (€) - Optional
            </label>
            <input
              type="number"
              value={formData.cliffAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, cliffAmount: e.target.value }))}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              One-time payment after cliff period
            </p>
          </div>
          
          {formData.cliffAmount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliff Period
              </label>
              <select
                value={formData.cliffPeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, cliffPeriod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Time before cliff payment is made
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VestingScheduleModal; 