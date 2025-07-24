import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseMock } from '../lib/supabase';
import { DashboardConfiguration, DashboardLayout, DashboardCard, CardSize, DEFAULT_CARDS } from '../types/dashboard';

// Helper function to generate proper UUIDs
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useDashboardConfig = (userId: string) => {
  const [configurations, setConfigurations] = useState<DashboardConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<DashboardConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Create default configuration with proper UUID
  const createDefaultConfiguration = (userId: string): DashboardConfiguration => ({
    id: generateUUID(), // Use proper UUID instead of "default-timestamp"
    userId,
    name: 'Main Dashboard',
    isDefault: true,
    layoutConfig: {
      cards: [],
      settings: {
        gridColumns: 4,
        cardSpacing: 24,
        theme: 'light'
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Map database configuration to our interface
  const mapDatabaseToConfig = (dbConfig: any): DashboardConfiguration => ({
    id: dbConfig.id,
    userId: dbConfig.user_id,
    name: dbConfig.name,
    isDefault: dbConfig.is_default || false,
    layoutConfig: dbConfig.layout_config || { cards: [], settings: { gridColumns: 4, cardSpacing: 24, theme: 'light' } },
    createdAt: dbConfig.created_at,
    updatedAt: dbConfig.updated_at
  });

  // Load dashboard configurations
  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading dashboard configurations for user:', userId);

      if (isSupabaseMock) {
        console.log('⚠️ Running in mock mode, using localStorage');
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
        console.error('❌ Database error loading configurations:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('📝 No configurations found, creating default');
        // Create default configuration
        const defaultConfig = createDefaultConfiguration(userId);
        await saveConfiguration(defaultConfig);
        return;
      }

      const configs = data.map(mapDatabaseToConfig);
      setConfigurations(configs);
      setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
      console.log('✅ Loaded configurations from database:', configs);

    } catch (error) {
      console.error('💥 Error loading dashboard configurations:', error);
      console.warn('🔄 Falling back to localStorage');
      
      // Fallback to localStorage
      const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
      let configs = [];
      
      try {
        configs = savedConfigs ? JSON.parse(savedConfigs) : [];
      } catch (parseError) {
        console.error('💥 Error parsing localStorage configs:', parseError);
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

  // Save configuration to database
  const saveConfiguration = useCallback(async (config: DashboardConfiguration) => {
    try {
      console.log('💾 Updating dashboard configuration:', config.id, config);

      if (isSupabaseMock) {
        console.log('⚠️ Mock mode: Saving to localStorage only');
        const configs = configurations.map(c => c.id === config.id ? config : c);
        setConfigurations(configs);
        setCurrentConfig(config);
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        return;
      }

      // Prepare data for database (map our interface to database schema)
      const dbData = {
        name: config.name,
        is_default: config.isDefault,
        layout_config: config.layoutConfig,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Database payload:', dbData);

      // Try to update existing configuration
      const { data, error } = await supabase
        .from('dashboard_configurations')
        .update(dbData)
        .eq('id', config.id)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Error updating dashboard configuration:', error);
        
        // If update failed, try to insert as new
        if (error.code === 'PGRST116') { // No rows returned - doesn't exist
          console.log('🔄 Configuration not found, creating new one');
          
          const insertData = {
            id: config.id,
            user_id: userId,
            ...dbData
          };

          const { data: insertedData, error: insertError } = await supabase
            .from('dashboard_configurations')
            .insert([insertData])
            .select();

          if (insertError) {
            console.error('❌ Error creating dashboard configuration:', insertError);
            throw insertError;
          }
          
          console.log('✅ Created new dashboard configuration:', insertedData);
        } else {
          throw error;
        }
      } else {
        console.log('✅ Updated dashboard configuration successfully:', data);
      }

      // Update local state
      setConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
      setCurrentConfig(config);

    } catch (error) {
      console.error('💥 Error saving dashboard configuration:', error);
      console.log('🔄 Falling back to localStorage due to database error');
      
      // Fallback to localStorage
      try {
        const configs = configurations.map(c => c.id === config.id ? config : c);
        if (!configs.find(c => c.id === config.id)) {
          configs.push(config);
        }
        setConfigurations(configs);
        setCurrentConfig(config);
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        console.log('✅ Saved to localStorage as fallback');
      } catch (localError) {
        console.error('💥 Even localStorage fallback failed:', localError);
      }
    }
  }, [configurations, userId]);

  // Add a card to the current configuration
  const addCard = useCallback(async (cardType: string, size: CardSize = 'half') => {
    console.log('🔄 useDashboardConfig.addCard called with:', cardType, 'size:', size);
    
    let configToUpdate = currentConfig;
    
    // If no current configuration exists, create a default one
    if (!configToUpdate) {
      console.log('📝 No current config found, creating default configuration');
      configToUpdate = createDefaultConfiguration(userId);
    }

    // Create new card
    const newCard: DashboardCard = {
      id: `card-${cardType}-${Date.now()}`,
      type: cardType as any,
      size,
      position: { x: 0, y: 0, w: size === 'full' ? 4 : size === 'half' ? 2 : 1, h: 1 },
      config: {
        title: cardType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        visible: true
      }
    };

    // Add card to configuration
    const updatedConfig = {
      ...configToUpdate,
      layoutConfig: {
        ...configToUpdate.layoutConfig,
        cards: [...(configToUpdate.layoutConfig.cards || []), newCard]
      },
      updatedAt: new Date().toISOString()
    };

    console.log('📊 Adding card to dashboard:', cardType, 'Updated config:', updatedConfig);

    // Save the updated configuration
    await saveConfiguration(updatedConfig);
    
    console.log('✅ Card added successfully:', cardType);
  }, [currentConfig, saveConfiguration, userId]);

  // Remove a card from the current configuration
  const removeCard = useCallback(async (cardId: string) => {
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      layoutConfig: {
        ...currentConfig.layoutConfig,
        cards: currentConfig.layoutConfig.cards.filter(card => card.id !== cardId)
      },
      updatedAt: new Date().toISOString()
    };

    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Load configurations when component mounts or userId changes
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
    addCard,
    removeCard,
    saveConfiguration,
    loadConfigurations
  };
}; 