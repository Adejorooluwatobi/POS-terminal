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

  createTransaction(transaction: Transaction): Observable<Transaction> {
    return this.api.post<Transaction>('/api/transactions', transaction);
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.api.get<Transaction>(`/api/transactions/${id}`);
  }
}
