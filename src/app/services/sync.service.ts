import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OfflineTransactionService } from './offline-transaction.service';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { environment } from '../../../src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SyncService implements OnDestroy {
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private syncTimer?: Subscription;
  private readonly SYNC_INTERVAL_MS = 60000; // Try syncing every minute
  private apiUrl = environment?.apiUrl || 'https://localhost:7119/api';

  constructor(
    private http: HttpClient,
    private offlineDb: OfflineTransactionService
  ) {
    this.setupListeners();
    this.startPeriodicSync();
  }

  private setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.syncNow();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  private startPeriodicSync() {
    this.syncTimer = timer(0, this.SYNC_INTERVAL_MS).subscribe(() => {
      if (this.isOnline$.value) {
        this.syncNow();
      }
    });
  }

  async syncNow(): Promise<void> {
    if (!this.isOnline$.value) return;

    try {
      const unsynced = await this.offlineDb.getUnsyncedTransactions();
      if (unsynced.length === 0) return;

      console.log(`Attempting to sync ${unsynced.length} offline transactions...`);

      // Call the backend API created previously
      this.http.post<{ success: boolean; syncedCount: number; failedTransactionIds: string[] }>(
        `${this.apiUrl}/transactions/sync`, 
        { transactions: unsynced }
      ).subscribe({
        next: async (response) => {
          if (response) {
            // Find which transactions actually succeeded
            const failedIds = response.failedTransactionIds || [];
            const syncedIds = unsynced
              .map(t => t.id)
              .filter(id => !failedIds.includes(id));
            
            if (syncedIds.length > 0) {
              await this.offlineDb.removeSyncedTransactions(syncedIds);
              console.log(`Successfully synced ${syncedIds.length} transactions.`);
            }
          }
        },
        error: async (err) => {
          console.error('Background sync failed, will retry later.', err);
          
          const isValidationError = err.status === 400;
          const isConflictError = err.status === 409;
          const isDatabaseConstraintError = err.status === 500 && err.error && err.error.detail && (err.error.detail.includes('23503') || err.error.detail.includes('23505'));
          
          if (isValidationError || isDatabaseConstraintError || isConflictError) {
            console.error('Unrecoverable database error! Deleting corrupted offline transactions to prevent infinite loop.', err.error);
            const ids = unsynced.map(t => t.id);
            await this.offlineDb.removeSyncedTransactions(ids);
          }
        }
      });
    } catch (err) {
      console.error('Error reading offline database', err);
    }
  }

  get isOnline() {
    return this.isOnline$.asObservable();
  }

  ngOnDestroy() {
    if (this.syncTimer) {
      this.syncTimer.unsubscribe();
    }
  }
}
