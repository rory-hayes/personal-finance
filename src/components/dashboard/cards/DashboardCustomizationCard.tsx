import React, { useState } from 'react';
import { Settings, Grid, Eye, EyeOff, Palette, Layout, Save } from 'lucide-react';

interface DashboardCustomizationCardProps {
  card: any;
  financeData: any;
}

const DashboardCustomizationCard: React.FC<DashboardCustomizationCardProps> = () => {
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [gridColumns, setGridColumns] = useState(12);
  const [cardSpacing, setCardSpacing] = useState(24);
  const [showTooltips, setShowTooltips] = useState(true);
  
  // Mock dashboard settings (in real app, these would come from user preferences)
  const dashboardStats = {
    totalCards: 15,
    visibleCards: 12,
    hiddenCards: 3,
    lastModified: new Date().toLocaleDateString()
  };

  const themes = [
    { id: 'light', name: 'Light', colors: ['#ffffff', '#f8fafc', '#e2e8f0'] },
    { id: 'dark', name: 'Dark', colors: ['#1e293b', '#334155', '#475569'] },
    { id: 'blue', name: 'Blue', colors: ['#dbeafe', '#bfdbfe', '#93c5fd'] },
    { id: 'green', name: 'Green', colors: ['#dcfce7', '#bbf7d0', '#86efac'] }
  ];

  const cardCategories = [
    { name: 'Essential', count: 6, visible: 6 },
    { name: 'Spending', count: 3, visible: 2 },
    { name: 'Planning', count: 3, visible: 3 },
    { name: 'Assets', count: 2, visible: 1 },
    { name: 'Advanced', count: 1, visible: 0 }
  ];

  const recentChanges = [
    { action: 'Added', item: 'Subscription Tracker', time: '2 hours ago' },
    { action: 'Moved', item: 'Net Worth Growth', time: '1 day ago' },
    { action: 'Resized', item: 'Monthly Spending', time: '3 days ago' }
  ];

  const handleSaveSettings = () => {
    // In real app, this would save to backend/localStorage
    console.log('Saving dashboard settings:', {
      theme: selectedTheme,
      gridColumns,
      cardSpacing,
      showTooltips
    });
    alert('Dashboard settings saved!');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Dashboard Layout</h3>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Grid className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Cards</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {dashboardStats.totalCards}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Visible</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {dashboardStats.visibleCards}
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Theme</h4>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                selectedTheme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{theme.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout Settings */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Layout Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 mb-2 block">Grid Columns</label>
            <input
              type="range"
              min="8"
              max="16"
              value={gridColumns}
              onChange={(e) => setGridColumns(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>8</span>
              <span className="font-medium">{gridColumns}</span>
              <span>16</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-700 mb-2 block">Card Spacing (px)</label>
            <input
              type="range"
              min="12"
              max="48"
              value={cardSpacing}
              onChange={(e) => setCardSpacing(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>12</span>
              <span className="font-medium">{cardSpacing}</span>
              <span>48</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Show Tooltips</span>
            <button
              onClick={() => setShowTooltips(!showTooltips)}
              className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${
                showTooltips ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform top-1 ${
                  showTooltips ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Card Categories</h4>
        <div className="space-y-2">
          {cardCategories.map((category) => (
            <div key={category.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-900">{category.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  {category.visible}/{category.count} visible
                </span>
                <div className="w-12 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(category.visible / category.count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="flex-1 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Changes</h4>
        <div className="space-y-2">
          {recentChanges.map((change, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  change.action === 'Added' ? 'bg-green-500' :
                  change.action === 'Moved' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
                <span className="text-gray-700">
                  {change.action} <span className="font-medium">{change.item}</span>
                </span>
              </div>
              <span className="text-xs text-gray-500">{change.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            <Layout className="h-4 w-4" />
            Reset Layout
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            <Eye className="h-4 w-4" />
            Show All
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizationCard; 