// IndexedDB wrapper for offline data storage

const DB_NAME = 'bateu-a-meta-offline';
const DB_VERSION = 1;

export interface PendingOperation {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

const STORES = [
  'turnos_km',
  'turno_fontes_ganho',
  'ganhos_despesas',
  'manutencoes',
  'metas',
  'veiculos',
  'profiles',
  'pending_operations'
] as const;

export type StoreName = typeof STORES[number];

let dbInstance: IDBDatabase | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          
          // Add indexes for common queries
          if (storeName !== 'pending_operations') {
            store.createIndex('user_id', 'user_id', { unique: false });
          }
          
          if (storeName === 'turnos_km') {
            store.createIndex('data', 'data', { unique: false });
            store.createIndex('veiculo_id', 'veiculo_id', { unique: false });
          }
          
          if (storeName === 'turno_fontes_ganho') {
            store.createIndex('turno_id', 'turno_id', { unique: false });
          }
          
          if (storeName === 'manutencoes') {
            store.createIndex('veiculo_id', 'veiculo_id', { unique: false });
          }
          
          if (storeName === 'pending_operations') {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('table', 'table', { unique: false });
          }
        }
      });
    };
  });
};

export const getAll = async <T>(storeName: StoreName): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getByIndex = async <T>(
  storeName: StoreName, 
  indexName: string, 
  value: IDBValidKey
): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getById = async <T>(storeName: StoreName, id: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const put = async <T extends { id: string }>(storeName: StoreName, data: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const putMany = async <T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const remove = async (storeName: StoreName, id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clear = async (storeName: StoreName): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Pending operations management
export const addPendingOperation = async (
  table: string,
  operation: PendingOperation['operation'],
  data: any
): Promise<void> => {
  const pendingOp: PendingOperation = {
    id: crypto.randomUUID(),
    table,
    operation,
    data,
    timestamp: Date.now()
  };
  
  await put('pending_operations', pendingOp);
};

export const getPendingOperations = async (): Promise<PendingOperation[]> => {
  const operations = await getAll<PendingOperation>('pending_operations');
  return operations.sort((a, b) => a.timestamp - b.timestamp);
};

export const removePendingOperation = async (id: string): Promise<void> => {
  await remove('pending_operations', id);
};

export const clearPendingOperations = async (): Promise<void> => {
  await clear('pending_operations');
};
