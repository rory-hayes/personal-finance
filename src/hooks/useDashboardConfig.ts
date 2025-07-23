import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseMock } from '../lib/supabase';
import { DashboardConfiguration, DashboardLayout, DashboardCard, CardSize, DEFAULT_CARDS } from '../types/dashboard';

export const useDashboardConfig = (userId: string) => {
  const [configurations, setConfigurations] = useState<DashboardConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<DashboardConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Load dashboard configurations
  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);

      if (isSupabaseMock) {
        // Use localStorage fallback
        const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
        const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
        
        if (configs.length === 0) {
          // Create default configuration
          const defaultConfig = createDefaultConfiguration(userId);
          configs.push(defaultConfig);
          localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        }
        
        setConfigurations(configs);
        setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
        setLoading(false);
        return;
      }

      // Try to load from database first
      const { data, error } = await supabase
        .from('dashboard_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error loading configurations:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No configurations found, creating default');
        // Create default configuration
        const defaultConfig = createDefaultConfiguration(userId);
        await saveConfiguration(defaultConfig);
        return;
      }

      const configs = data.map(mapDatabaseToConfig);
      setConfigurations(configs);
      setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);

    } catch (error) {
      console.error('Error loading dashboard configurations:', error);
      console.warn('Falling back to localStorage');
      
      // Fallback to localStorage
      const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
      let configs = [];
      
      try {
        configs = savedConfigs ? JSON.parse(savedConfigs) : [];
      } catch (parseError) {
        console.error('Error parsing localStorage configs:', parseError);
        configs = [];
      }
      
      if (configs.length === 0) {
        const defaultConfig = createDefaultConfiguration(userId);
        configs = [defaultConfig];
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
      }
      
      setConfigurations(configs);
      setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save configuration
  const saveConfiguration = useCallback(async (config: Partial<DashboardConfiguration>) => {
    try {
      if (isSupabaseMock) {
        // Use localStorage fallback
        const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
        const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
        
        if (config.id) {
          // Update existing
          const index = configs.findIndex((c: any) => c.id === config.id);
          if (index !== -1) {
            configs[index] = { ...configs[index], ...config, updatedAt: new Date().toISOString() };
          }
        } else {
          // Create new
          const newConfig = {
            ...config,
            id: `config-${Date.now()}`,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          configs.push(newConfig);
        }
        
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        setConfigurations(configs);
        return;
      }

      // Ensure we have a valid user ID
      if (!userId || userId === 'anonymous') {
        console.warn('No valid user ID for saving dashboard configuration, using localStorage fallback');
        // Fallback to localStorage for anonymous users
        const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
        const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
        
        if (config.id) {
          const index = configs.findIndex((c: any) => c.id === config.id);
          if (index !== -1) {
            configs[index] = { ...configs[index], ...config, updatedAt: new Date().toISOString() };
          }
        } else {
          const newConfig = {
            ...config,
            id: `config-${Date.now()}`,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          configs.push(newConfig);
        }
        
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        setConfigurations(configs);
        setCurrentConfig(configs[configs.length - 1]);
        return;
      }

      if (config.id) {
        // Update existing configuration
        const updateData = {
          name: config.name,
          is_default: config.isDefault || false,
          layout_config: config.layoutConfig,
          updated_at: new Date().toISOString()
        };

        console.log('Updating dashboard configuration:', config.id, updateData);

        const { error } = await supabase
          .from('dashboard_configurations')
          .update(updateData)
          .eq('id', config.id);

        if (error) {
          console.error('Error updating dashboard configuration:', error);
          throw error;
        }
      } else {
        // Create new configuration
        const insertData = {
          user_id: userId,
          name: config.name || 'New Dashboard',
          is_default: config.isDefault || false,
          layout_config: config.layoutConfig || { cards: [], settings: { gridColumns: 4, cardSpacing: 24, theme: 'light' } }
        };

        console.log('Creating new dashboard configuration:', insertData);

        const { data, error } = await supabase
          .from('dashboard_configurations')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          console.error('Error creating dashboard configuration:', error);
          throw error;
        }

        if (data) {
          const newConfig = mapDatabaseToConfig(data);
          setConfigurations(prev => [...prev, newConfig]);
          if (config.isDefault) {
            setCurrentConfig(newConfig);
          }
        }
      }

      // Reload configurations after save
      await loadConfigurations();
    } catch (error) {
      console.error('Error saving dashboard configuration:', error);
      
      // Fallback to localStorage on error
      console.warn('Falling back to localStorage due to database error');
      const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
      const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
      
      if (config.id) {
        const index = configs.findIndex((c: any) => c.id === config.id);
        if (index !== -1) {
          configs[index] = { ...configs[index], ...config, updatedAt: new Date().toISOString() };
        }
      } else {
        const newConfig = {
          ...config,
          id: `config-${Date.now()}`,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        configs.push(newConfig);
      }
      
      localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
      setConfigurations(configs);
      setCurrentConfig(configs[configs.length - 1]);
    }
  }, [userId, loadConfigurations]);

  // Update card in current configuration
  const updateCard = useCallback(async (cardId: string, updates: Partial<DashboardCard>) => {
    if (!currentConfig) return;

    const updatedCards = currentConfig.layoutConfig.cards.map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    );

    const updatedConfig = {
      ...currentConfig,
      layoutConfig: {
        ...currentConfig.layoutConfig,
        cards: updatedCards
      }
    };

    setCurrentConfig(updatedConfig);
    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Add card to current configuration
  const addCard = useCallback(async (cardType: string, size: CardSize = 'half') => {
    let configToUpdate = currentConfig;
    
    // If no current config exists, create a default one
    if (!configToUpdate) {
      console.log('No current config found, creating default configuration');
      const defaultConfig = createDefaultConfiguration(userId);
      setCurrentConfig(defaultConfig);
      configToUpdate = defaultConfig;
    }

    const newCard: DashboardCard = {
      id: `card-${Date.now()}`,
      type: cardType as any,
      size,
      position: { x: 0, y: 0, w: 2, h: 1 }, // Will be auto-positioned
      config: {
        title: getCardTitle(cardType),
        chartType: 'bar',
        timeRange: '6months',
        visible: true
      }
    };

    const updatedConfig = {
      ...configToUpdate,
      layoutConfig: {
        ...configToUpdate.layoutConfig,
        cards: [...(configToUpdate.layoutConfig.cards || []), newCard]
      }
    };

    console.log('Adding card to dashboard:', cardType, 'Updated config:', updatedConfig);
    
    setCurrentConfig(updatedConfig);
    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration, userId]);

  // Remove card from current configuration
  const removeCard = useCallback(async (cardId: string) => {
    if (!currentConfig) return;

    const updatedCards = currentConfig.layoutConfig.cards.filter(card => card.id !== cardId);

    const updatedConfig = {
      ...currentConfig,
      layoutConfig: {
        ...currentConfig.layoutConfig,
        cards: updatedCards
      }
    };

    setCurrentConfig(updatedConfig);
    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Resize card
  const resizeCard = useCallback(async (cardId: string, newSize: CardSize) => {
    await updateCard(cardId, { size: newSize });
  }, [updateCard]);

  // Switch configuration
  const switchConfiguration = useCallback(async (configId: string) => {
    const config = configurations.find(c => c.id === configId);
    if (config) {
      setCurrentConfig(config);
    }
  }, [configurations]);

  // Load configurations on mount
  useEffect(() => {
    if (userId) {
      loadConfigurations();
    }
  }, [userId, loadConfigurations]);

  return {
    configurations,
    currentConfig,
    loading,
    editMode,
    setEditMode,
    saveConfiguration,
    updateCard,
    addCard,
    removeCard,
    resizeCard,
    switchConfiguration,
    loadConfigurations
  };
};

// Helper functions
const createDefaultConfiguration = (userId: string): DashboardConfiguration => ({
  id: `default-${Date.now()}`,
  userId,
  name: 'Main Dashboard',
  isDefault: true,
  layoutConfig: {
    cards: DEFAULT_CARDS.map((card, index) => ({
      ...card,
      id: `default-card-${index}`,
      position: { x: index % 4, y: Math.floor(index / 4), w: 2, h: 1 }
    })) as DashboardCard[],
    settings: {
      gridColumns: 4,
      cardSpacing: 24,
      theme: 'light'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const mapDatabaseToConfig = (data: any): DashboardConfiguration => ({
  id: data.id,
  userId: data.user_id,
  name: data.name,
  isDefault: data.is_default,
  layoutConfig: data.layout_config,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

const getCardTitle = (cardType: string): string => {
  const titles: Record<string, string> = {
    'emergency-fund': 'Emergency Fund',
    'cash-flow': 'Cash Flow Forecast',
    'health-score': 'Financial Health Score',
    'subscriptions': 'Subscription Tracker',
    'asset-allocation': 'Asset Allocation',
    'goal-timeline': 'Goal Timeline',
    'bonus-tracker': 'Bonus Tracker',
    'peer-benchmarking': 'Peer Benchmarking'
  };
  return titles[cardType] || 'New Card';
}; 