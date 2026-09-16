import { Injectable } from '@angular/core';
import { db, OfflineTransaction } from '../database/app-db';

@Injectable({
  providedIn: 'root'
})
export class OfflineTransactionService {
  
  constructor() {}

  async saveTransaction(transaction: OfflineTransaction): Promise<void> {
    try {
      await db.offlineTransactions.add(transaction);
      console.log('Transaction saved offline', transaction.id);
    } catch (error) {
      console.error('Failed to save offline transaction', error);
      throw error;
    }
  }

  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    return await db.offlineTransactions.filter(t => !t.synced).toArray();
  }

  async removeSyncedTransactions(ids: string[]): Promise<void> {
    await db.offlineTransactions.where('id').anyOf(ids).modify({ synced: true });
  }
  
  async getUnsyncedCount(): Promise<number> {
    return await db.offlineTransactions.filter(t => !t.synced).count();
  }

  async getTodayTransactions(cashierId: string): Promise<OfflineTransaction[]> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();
    
    const txs = await db.offlineTransactions
      .filter(t => t.cashierId === cashierId && t.createdAt >= todayStr)
      .toArray();
      
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRefunded(id: string): Promise<void> {
    await db.offlineTransactions.update(id, { status: 2 });
  }
}
