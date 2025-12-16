import { useState, useEffect, useCallback } from 'react';
import { useOfflineContext } from '@/contexts/OfflineContext';
import { supabase } from '@/integrations/supabase/client';
import * as db from '@/lib/indexedDB';
import { offlineInsert, offlineUpdate, offlineDelete, getOfflineData } from '@/lib/syncService';
import type { StoreName } from '@/lib/indexedDB';

type SyncableTable = 'turnos_km' | 'turno_fontes_ganho' | 'ganhos_despesas' | 'manutencoes' | 'metas' | 'veiculos';

interface UseOfflineDataOptions<T> {
  table: SyncableTable;
  userId: string | undefined;
  fetchOnline?: () => Promise<T[]>;
  dependencies?: any[];
}

export function useOfflineData<T extends { id: string; user_id: string }>({
  table,
  userId,
  fetchOnline,
  dependencies = []
}: UseOfflineDataOptions<T>) {
  const { isOnline, isSyncing } = useOfflineContext();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOnline && fetchOnline) {
        // Online: fetch from server and update local cache
        const serverData = await fetchOnline();
        setData(serverData);
        
        // Update local cache
        await db.clear(table as StoreName);
        if (serverData.length > 0) {
          await db.putMany(table as StoreName, serverData);
        }
      } else {
        // Offline: fetch from local cache
        const localData = await getOfflineData<T>(table, userId);
        setData(localData);
      }
    } catch (err) {
      console.error(`[useOfflineData] Error loading ${table}:`, err);
      setError(err as Error);
      
      // Fallback to local data on error
      try {
        const localData = await getOfflineData<T>(table, userId);
        setData(localData);
      } catch (localErr) {
        console.error(`[useOfflineData] Local fallback failed:`, localErr);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isOnline, table, fetchOnline, ...dependencies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when coming back online
  useEffect(() => {
    const handleOnline = () => {
      loadData();
    };

    window.addEventListener('app:online', handleOnline);
    return () => window.removeEventListener('app:online', handleOnline);
  }, [loadData]);

  const insert = useCallback(async (newData: Omit<T, 'id'> & { id?: string }): Promise<T> => {
    if (!userId) throw new Error('User not authenticated');
    
    const record = await offlineInsert(table, { ...newData, user_id: userId } as T, isOnline);
    setData(prev => [...prev, record as T]);
    return record as T;
  }, [table, userId, isOnline]);

  const update = useCallback(async (updatedData: T): Promise<void> => {
    await offlineUpdate(table, updatedData, isOnline);
    setData(prev => prev.map(item => item.id === updatedData.id ? updatedData : item));
  }, [table, isOnline]);

  const remove = useCallback(async (id: string): Promise<void> => {
    await offlineDelete(table, id, isOnline);
    setData(prev => prev.filter(item => item.id !== id));
  }, [table, isOnline]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isOnline,
    isSyncing,
    insert,
    update,
    remove,
    refresh
  };
}
