import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { syncFromServer, syncPendingOperations } from '@/lib/syncService';
import * as db from '@/lib/indexedDB';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n from '@/i18n';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  forceSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  forceSync: async () => {},
});

export const useOfflineContext = () => useContext(OfflineContext);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const pending = await db.getPendingOperations();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Sync function
  const performSync = useCallback(async () => {
    if (!userId || isSyncing) return;

    setIsSyncing(true);
    try {
      // First, push pending operations
      const pending = await db.getPendingOperations();
      if (pending.length > 0) {
        toast.info(i18n.t('offline.syncing', { count: pending.length }));
        const { success, failed } = await syncPendingOperations();
        
        if (success > 0) {
          toast.success(i18n.t('offline.syncedOk', { count: success }));
        }
        if (failed > 0) {
          toast.error(i18n.t('offline.syncedFail', { count: failed }));
        }
      }

      // Then, pull latest data from server
      await syncFromServer(userId);
      setLastSyncTime(new Date());
      await updatePendingCount();
    } catch (err) {
      console.error('[OfflineContext] Sync failed:', err);
      toast.error(i18n.t('offline.syncError'));
    } finally {
      setIsSyncing(false);
    }
  }, [userId, isSyncing, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (userId) {
        performSync();
      }
    };

    window.addEventListener('app:online', handleOnline);
    return () => window.removeEventListener('app:online', handleOnline);
  }, [userId, performSync]);

  // Initial sync when user logs in
  useEffect(() => {
    if (userId && isOnline) {
      performSync();
    }
  }, [userId]);

  const forceSync = useCallback(async () => {
    if (isOnline) {
      await performSync();
    } else {
      toast.warning(i18n.t('offline.pendingWarn'));
    }
  }, [isOnline, performSync]);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      isSyncing,
      pendingCount,
      lastSyncTime,
      forceSync
    }}>
      {children}
    </OfflineContext.Provider>
  );
};
