import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private api = inject(ApiService);

  getTransactions(): Observable<Transaction[]> {
    return this.api.get<Transaction[]>('/api/transactions');
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.api.get<Transaction>(`/api/transactions/${id}`);
  }

  /**
   * Maps a frontend transaction (from POSService) to the backend CreateTransactionDto
   * and posts it to the API.
   */
  createTransaction(tx: Transaction): Observable<Transaction> {
    const storeId = localStorage.getItem('store_id') || tx.storeId || tx.staff?.store || '';
    const sessionId = localStorage.getItem('till_session_id');

    if (!sessionId) {
      console.error('CRITICAL: Attempting to create transaction without an active Till Session');
    }

    if (!storeId || storeId === '00000000-0000-0000-0000-000000000000') {
      console.error('CRITICAL: Attempting to create transaction with empty StoreId');
    }

    const items = (tx.items || []).map((item: any) => ({
      variantId: item.variantId || (item.id === -99 ? '00000000-0000-0000-0000-000000000000' : item.id),
      quantity: item.qty,
      unitPrice: item.price,
      taxRate: item.tax || 0,
      isGiftCardSale: item.id === -99,
      giftCardNumber: item.id === -99 ? item.sku : null,
      giftCardPin: item.id === -99 ? item.pin : null
    }));

    const methodMap: Record<string, string> = {
      'CASH':     'Cash',
      'CARD':     'Card',
      'MOBILE':   'MobileMoney',
      'TRANSFER': 'BankTransfer',
      'GIFTCARD': 'GiftCard',
    };
    const method = methodMap[tx.method] || 'Cash';

    const payments: any[] = [];
    
    // 1. Add Redeemed Gift Cards
    if (tx.redeemedGiftCards && tx.redeemedGiftCards.length > 0) {
      tx.redeemedGiftCards.forEach(gc => {
        payments.push({
          method: 'GiftCard',
          amount: gc.amount,
          giftCardId: gc.giftCardId || null
        });
      });
    }

    // 2. Add the final payment method (Cash/Transfer/etc)
    // Only add if there's a balance or if it's the only payment
    if (tx.grand > 0 || payments.length === 0) {
      payments.push({
        method,
        amount: tx.grand,
        amountTendered: tx.tender
      });
    }

    const payload = {
      storeId,
      sessionId,
      customerId: tx.customer?.id || null,
      type: 'Sale',
      notes: tx.promotionId ? `Promo: ${tx.promotionId}` : null,
      items,
      payments
    };

    console.log('Syncing transaction to cloud:', payload);

    return this.api.post<Transaction>('/api/transactions', payload);
  }
}
