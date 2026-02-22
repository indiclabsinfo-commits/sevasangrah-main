// Offline Service — IndexedDB-based offline storage with sync
// Stores patient registrations when offline and syncs when back online

const DB_NAME = 'sevasangraha_offline';
const DB_VERSION = 1;
const STORES = {
  PENDING_PATIENTS: 'pending_patients',
  SYNC_LOG: 'sync_log',
} as const;

export interface PendingPatient {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  lastError?: string;
  retryCount: number;
}

export interface SyncLogEntry {
  id: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
  details?: string;
}

class OfflineService {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];
  private syncInProgress = false;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingData();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.isOnline));
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.PENDING_PATIENTS)) {
          db.createObjectStore(STORES.PENDING_PATIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
          db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async savePatientOffline(patientData: Record<string, any>): Promise<PendingPatient> {
    const db = await this.openDB();
    const entry: PendingPatient = {
      id: this.generateId(),
      data: patientData,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PATIENTS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_PATIENTS);
      const request = store.add(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingPatients(): Promise<PendingPatient[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PATIENTS, 'readonly');
      const store = tx.objectStore(STORES.PENDING_PATIENTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<number> {
    const patients = await this.getPendingPatients();
    return patients.filter(p => p.syncStatus === 'pending' || p.syncStatus === 'failed').length;
  }

  async removePendingPatient(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PATIENTS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_PATIENTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncPendingData(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPendingPatients();
      const toSync = pending.filter(p => p.syncStatus === 'pending' || p.syncStatus === 'failed');

      for (const entry of toSync) {
        try {
          // Try to sync via backend bulk endpoint first
          const apiBase = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiBase}/api/patients/bulk-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patients: [entry.data] }),
          });

          if (response.ok) {
            await this.removePendingPatient(entry.id);
            await this.addSyncLog('sync_patient', 'success', `Synced patient: ${entry.data.first_name} ${entry.data.last_name}`);
            synced++;
          } else {
            // Update retry count
            entry.syncStatus = 'failed';
            entry.retryCount++;
            entry.lastError = `HTTP ${response.status}`;
            await this.updatePendingPatient(entry);
            failed++;
          }
        } catch (err: any) {
          entry.syncStatus = 'failed';
          entry.retryCount++;
          entry.lastError = err.message;
          await this.updatePendingPatient(entry);
          failed++;
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    return { synced, failed };
  }

  private async updatePendingPatient(entry: PendingPatient): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_PATIENTS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_PATIENTS);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async addSyncLog(action: string, status: 'success' | 'failed', details?: string): Promise<void> {
    const db = await this.openDB();
    const entry: SyncLogEntry = {
      id: this.generateId(),
      action,
      status,
      timestamp: new Date().toISOString(),
      details,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOG, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_LOG);
      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncLog(): Promise<SyncLogEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOG, 'readonly');
      const store = tx.objectStore(STORES.SYNC_LOG);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineService = new OfflineService();
export default offlineService;
