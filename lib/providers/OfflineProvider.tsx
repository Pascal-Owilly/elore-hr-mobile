// lib/providers/OfflineProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: Date;
  retries: number;
}

interface OfflineContextType {
  isConnected: boolean;
  isSyncing: boolean;
  syncQueue: SyncQueueItem[];
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => void;
  clearSyncQueue: () => void;
  retrySync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      
      // Auto-sync when connection is restored
      if (state.isConnected && syncQueue.length > 0) {
        retrySync();
      }
    });

    return () => unsubscribe();
  }, [syncQueue]);

  // Load sync queue from storage on mount
  useEffect(() => {
    loadSyncQueue();
  }, []);

  const loadSyncQueue = async () => {
    try {
      const storedQueue = await AsyncStorage.getItem('sync_queue');
      if (storedQueue) {
        setSyncQueue(JSON.parse(storedQueue));
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  };

  const saveSyncQueue = async (queue: SyncQueueItem[]) => {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  };

  const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date(),
      retries: 0,
    };
    
    const newQueue = [...syncQueue, newItem];
    setSyncQueue(newQueue);
    saveSyncQueue(newQueue);
  };

  const clearSyncQueue = () => {
    setSyncQueue([]);
    AsyncStorage.removeItem('sync_queue');
  };

  const retrySync = async () => {
    if (isSyncing || syncQueue.length === 0 || !isConnected) return;

    setIsSyncing(true);
    const failedItems: SyncQueueItem[] = [];

    for (const item of syncQueue) {
      try {
        // TODO: Replace with your actual API calls
        const response = await fetch(`http://your-api-url${item.endpoint}`, {
          method: item.action === 'CREATE' ? 'POST' : 
                  item.action === 'UPDATE' ? 'PUT' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if needed
          },
          body: JSON.stringify(item.data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Success - item will be removed from queue
      } catch (error) {
        console.error(`Sync failed for item ${item.id}:`, error);
        
        // Retry logic (max 3 retries)
        if (item.retries < 3) {
          failedItems.push({
            ...item,
            retries: item.retries + 1,
          });
        }
      }
    }

    setSyncQueue(failedItems);
    saveSyncQueue(failedItems);
    setIsSyncing(false);
  };

  const value: OfflineContextType = {
    isConnected,
    isSyncing,
    syncQueue,
    addToSyncQueue,
    clearSyncQueue,
    retrySync,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};