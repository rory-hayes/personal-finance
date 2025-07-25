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

      // Helper function to load from localStorage
      const loadFromLocalStorage = () => {
        console.log('🔄 Loading from localStorage');
        try {
          const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
          let configs = savedConfigs ? JSON.parse(savedConfigs) : [];
          
          if (configs.length === 0) {
            // Create default configuration
            const defaultConfig = createDefaultConfiguration(userId);
            configs = [defaultConfig];
            localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
          }
          
          setConfigurations(configs);
          setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
          console.log('✅ Loaded configurations from localStorage:', configs.length, 'configs');
          return configs;
        } catch (parseError) {
          console.error('💥 Error parsing localStorage configs:', parseError);
          const defaultConfig = createDefaultConfiguration(userId);
          const configs = [defaultConfig];
          localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
          setConfigurations(configs);
          setCurrentConfig(defaultConfig);
          return configs;
        }
      };

      // For mock mode or invalid/anonymous users, use localStorage only
      if (isSupabaseMock || !userId || userId === 'anonymous' || userId.length < 10) {
        console.log('⚠️ Using localStorage only (mock mode or invalid user)');
        loadFromLocalStorage();
        return;
      }

      // Try to load from database first
      try {
        const { data, error } = await supabase
          .from('dashboard_configurations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Database error loading configurations:', error);
          // Fall back to localStorage
          loadFromLocalStorage();
          return;
        }

        if (!data || data.length === 0) {
          console.log('📝 No configurations found in database');
          
          // Check localStorage first before creating new
          const localConfigs = loadFromLocalStorage();
          if (localConfigs.length > 0) {
            console.log('📂 Found configurations in localStorage, using them');
            // Note: We'll let the save operations handle database sync later
            return;
          }

          // Create default configuration if nothing exists
          console.log('📝 Creating default configuration');
          const defaultConfig = createDefaultConfiguration(userId);
          setConfigurations([defaultConfig]);
          setCurrentConfig(defaultConfig);
          localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify([defaultConfig]));
          return;
        }

        const configs = data.map(mapDatabaseToConfig);
        setConfigurations(configs);
        setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
        console.log('✅ Loaded configurations from database:', configs.length, 'configs');

        // Also save to localStorage as backup
        localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));

      } catch (dbError) {
        console.error('💥 Database connection failed:', dbError);
        loadFromLocalStorage();
      }

    } catch (error) {
      console.error('💥 Error loading dashboard configurations:', error);
      
      // Final fallback to localStorage
      try {
        const savedConfigs = localStorage.getItem(`dashboardConfigs_${userId}`);
        let configs = savedConfigs ? JSON.parse(savedConfigs) : [];
        
        if (configs.length === 0) {
          const defaultConfig = createDefaultConfiguration(userId);
          configs = [defaultConfig];
          localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
        }
        
        setConfigurations(configs);
        setCurrentConfig(configs.find((c: DashboardConfiguration) => c.isDefault) || configs[0]);
      } catch (finalError) {
        console.error('💥 Even final fallback failed:', finalError);
        // Create minimal default state
        const defaultConfig = createDefaultConfiguration(userId);
        setConfigurations([defaultConfig]);
        setCurrentConfig(defaultConfig);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save configuration to database
  const saveConfiguration = useCallback(async (config: DashboardConfiguration) => {
    try {
      console.log('💾 Updating dashboard configuration:', config.id, config);
      console.log('👤 User ID for save operation:', userId);

      // Always try localStorage first as a fallback mechanism
      const updateLocalStorage = () => {
        try {
          const configs = configurations.map(c => c.id === config.id ? config : c);
          if (!configs.find(c => c.id === config.id)) {
            configs.push(config);
          }
          localStorage.setItem(`dashboardConfigs_${userId}`, JSON.stringify(configs));
          console.log('✅ Updated localStorage successfully');
          return configs;
        } catch (error) {
          console.error('💥 localStorage update failed:', error);
          return null;
        }
      };

      // Update local state immediately
      setConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
      setCurrentConfig(config);

      if (isSupabaseMock) {
        console.log('⚠️ Mock mode: Using localStorage only');
        updateLocalStorage();
        return;
      }

      // For anonymous users or if userId is not a valid UUID, use localStorage only
      if (!userId || userId === 'anonymous' || userId.length < 10) {
        console.log('⚠️ Invalid or anonymous user ID, using localStorage only');
        updateLocalStorage();
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
            console.log('🔄 Database insert failed, ensuring localStorage is updated');
            updateLocalStorage();
            return; // Don't throw, just use localStorage
          }
          
          console.log('✅ Created new dashboard configuration:', insertedData);
        } else {
          console.log('🔄 Database update failed, ensuring localStorage is updated');
          updateLocalStorage();
          return; // Don't throw, just use localStorage
        }
      } else {
        console.log('✅ Updated dashboard configuration successfully:', data);
      }

      // Also update localStorage as backup
      updateLocalStorage();

    } catch (error) {
      console.error('💥 Error saving dashboard configuration:', error);
      console.log('🔄 Database operation failed, using localStorage as fallback');
      
      // Ensure local state is updated even if database fails
      setConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
      setCurrentConfig(config);
      
      // Fallback to localStorage
      try {
        const configs = configurations.map(c => c.id === config.id ? config : c);
        if (!configs.find(c => c.id === config.id)) {
          configs.push(config);
        }
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

    // Update local state immediately so the UI reflects the change before
    // persisting to the database. Without this, the added card does not
    // appear until a reload.
    setCurrentConfig(updatedConfig);
    setConfigurations(prev => {
      const idx = prev.findIndex(cfg => cfg.id === updatedConfig.id);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = updatedConfig;
        return arr;
      }
      return [...prev, updatedConfig];
    });
    // Persist to the database
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

    // Immediately update local state to remove the card
    setCurrentConfig(updatedConfig);
    setConfigurations(prev => {
      const idx = prev.findIndex(cfg => cfg.id === updatedConfig.id);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = updatedConfig;
        return arr;
      }
      return [...prev, updatedConfig];
    });

    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Update a card in the current configuration
  const updateCard = useCallback(async (cardId: string, updates: Partial<DashboardCard>) => {
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      layoutConfig: {
        ...currentConfig.layoutConfig,
        cards: currentConfig.layoutConfig.cards.map(card =>
          card.id === cardId ? { ...card, ...updates } : card
        )
      },
      updatedAt: new Date().toISOString()
    };

    // Update local state so changes are reflected immediately
    setCurrentConfig(updatedConfig);
    setConfigurations(prev => {
      const idx = prev.findIndex(cfg => cfg.id === updatedConfig.id);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = updatedConfig;
        return arr;
      }
      return [...prev, updatedConfig];
    });

    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Resize a card in the current configuration
  const resizeCard = useCallback(async (cardId: string, newSize: CardSize) => {
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      layoutConfig: {
        ...currentConfig.layoutConfig,
        cards: currentConfig.layoutConfig.cards.map(card =>
          card.id === cardId ? { ...card, size: newSize } : card
        )
      },
      updatedAt: new Date().toISOString()
    };

    // Update local state so resize is visible immediately
    setCurrentConfig(updatedConfig);
    setConfigurations(prev => {
      const idx = prev.findIndex(cfg => cfg.id === updatedConfig.id);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = updatedConfig;
        return arr;
      }
      return [...prev, updatedConfig];
    });

    await saveConfiguration(updatedConfig);
  }, [currentConfig, saveConfiguration]);

  // Add multiple cards to the current configuration (for batch operations)
  const addMultipleCards = useCallback(async (cardTypes: Array<{ type: string; size: CardSize }>) => {
    console.log('🔄 useDashboardConfig.addMultipleCards called with:', cardTypes);
    
    let configToUpdate = currentConfig;
    
    // If no current configuration exists, create a default one
    if (!configToUpdate) {
      console.log('📝 No current config found, creating default configuration');
      configToUpdate = createDefaultConfiguration(userId);
    }

    // Create all new cards
    const newCards: DashboardCard[] = cardTypes.map(({ type, size }, index) => ({
      id: `card-${type}-${Date.now()}-${index}`,
      type: type as any,
      size,
      position: { x: 0, y: 0, w: size === 'full' ? 4 : size === 'half' ? 2 : 1, h: 1 },
      config: {
        title: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        visible: true
      }
    }));

    // Add all cards to configuration at once
    const updatedConfig = {
      ...configToUpdate,
      layoutConfig: {
        ...configToUpdate.layoutConfig,
        cards: [...(configToUpdate.layoutConfig.cards || []), ...newCards]
      },
      updatedAt: new Date().toISOString()
    };

    console.log('📊 Adding multiple cards to dashboard:', cardTypes, 'Updated config:', updatedConfig);

    // Update local state so all cards appear immediately
    setCurrentConfig(updatedConfig);
    setConfigurations(prev => {
      const idx = prev.findIndex(cfg => cfg.id === updatedConfig.id);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = updatedConfig;
        return arr;
      }
      return [...prev, updatedConfig];
    });
    await saveConfiguration(updatedConfig);
    
    console.log('✅ Multiple cards added successfully:', cardTypes.length);
  }, [currentConfig, saveConfiguration, userId]);

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
    updateCard,
    resizeCard,
    addMultipleCards,
    saveConfiguration,
    loadConfigurations
  };
}; 