// Sync service for offline/online data synchronization

import { supabase } from '@/integrations/supabase/client';
import * as db from './indexedDB';
import type { StoreName, PendingOperation } from './indexedDB';

type SyncableTable = 'turnos_km' | 'turno_fontes_ganho' | 'ganhos_despesas' | 'manutencoes' | 'metas' | 'veiculos';

const SYNCABLE_TABLES: SyncableTable[] = [
  'veiculos',
  'turnos_km',
  'turno_fontes_ganho',
  'ganhos_despesas',
  'manutencoes',
  'metas'
];

export const syncFromServer = async (userId: string): Promise<void> => {
  console.log('[Sync] Starting sync from server...');
  
  for (const table of SYNCABLE_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error(`[Sync] Error fetching ${table}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        await db.clear(table as StoreName);
        await db.putMany(table as StoreName, data);
        console.log(`[Sync] Synced ${data.length} records from ${table}`);
      }
    } catch (err) {
      console.error(`[Sync] Failed to sync ${table}:`, err);
    }
  }
  
  // Sync profile
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
      await db.put('profiles', profile);
      console.log('[Sync] Profile synced');
    }
  } catch (err) {
    console.error('[Sync] Failed to sync profile:', err);
  }
  
  console.log('[Sync] Server sync complete');
};

export const syncPendingOperations = async (): Promise<{ success: number; failed: number }> => {
  const pending = await db.getPendingOperations();
  let success = 0;
  let failed = 0;
  
  console.log(`[Sync] Processing ${pending.length} pending operations...`);
  
  for (const op of pending) {
    try {
      await executePendingOperation(op);
      await db.removePendingOperation(op.id);
      success++;
      console.log(`[Sync] Operation ${op.id} completed`);
    } catch (err) {
      console.error(`[Sync] Operation ${op.id} failed:`, err);
      failed++;
    }
  }
  
  return { success, failed };
};

const executePendingOperation = async (op: PendingOperation): Promise<void> => {
  const table = op.table as SyncableTable;
  
  switch (op.operation) {
    case 'INSERT': {
      // Remove local-only fields before sending to server
      const { _offline, ...data } = op.data;
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;
      break;
    }
    case 'UPDATE': {
      const { _offline, ...data } = op.data;
      const { error } = await supabase.from(table).update(data).eq('id', data.id);
      if (error) throw error;
      break;
    }
    case 'DELETE': {
      const { error } = await supabase.from(table).delete().eq('id', op.data.id);
      if (error) throw error;
      break;
    }
  }
};

// Helper functions for offline-first CRUD operations
export const offlineInsert = async <T extends { id?: string; user_id: string }>(
  table: SyncableTable,
  data: T,
  isOnline: boolean
): Promise<T & { id: string }> => {
  const id = data.id || crypto.randomUUID();
  const record = { ...data, id, _offline: !isOnline } as T & { id: string; _offline?: boolean };
  
  // Always save locally first
  await db.put(table as StoreName, record);
  
  if (isOnline) {
    try {
      const { _offline, ...serverData } = record as any;
      const { error } = await supabase.from(table).insert(serverData);
      if (error) throw error;
      
      // Update local record to remove offline flag
      await db.put(table as StoreName, { ...record, _offline: false });
    } catch (err) {
      console.error(`[Offline] Insert failed, queuing for sync:`, err);
      await db.addPendingOperation(table, 'INSERT', record);
    }
  } else {
    await db.addPendingOperation(table, 'INSERT', record);
  }
  
  return record;
};

export const offlineUpdate = async <T extends { id: string }>(
  table: SyncableTable,
  data: T,
  isOnline: boolean
): Promise<void> => {
  const record = { ...data, _offline: !isOnline };
  
  // Always save locally first
  await db.put(table as StoreName, record);
  
  if (isOnline) {
    try {
      const { _offline, ...serverData } = record as any;
      const { error } = await supabase.from(table).update(serverData).eq('id', data.id);
      if (error) throw error;
      
      await db.put(table as StoreName, { ...record, _offline: false });
    } catch (err) {
      console.error(`[Offline] Update failed, queuing for sync:`, err);
      await db.addPendingOperation(table, 'UPDATE', record);
    }
  } else {
    await db.addPendingOperation(table, 'UPDATE', record);
  }
};

export const offlineDelete = async (
  table: SyncableTable,
  id: string,
  isOnline: boolean
): Promise<void> => {
  // Always remove locally first
  await db.remove(table as StoreName, id);
  
  if (isOnline) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(`[Offline] Delete failed, queuing for sync:`, err);
      await db.addPendingOperation(table, 'DELETE', { id });
    }
  } else {
    await db.addPendingOperation(table, 'DELETE', { id });
  }
};

export const getOfflineData = async <T>(
  table: SyncableTable,
  userId: string
): Promise<T[]> => {
  const data = await db.getByIndex<T>(table as StoreName, 'user_id', userId);
  return data;
};
