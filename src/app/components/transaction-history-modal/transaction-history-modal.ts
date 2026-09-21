import { Component, Output, EventEmitter, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineTransactionService } from '../../services/offline-transaction.service';
import { AuthService } from '../../services/auth.service';
import { POSService } from '../../services/pos.service';
import { OfflineTransaction } from '../../database/app-db';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-transaction-history-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history-modal.html',
  styleUrls: ['./transaction-history-modal.css']
})
export class TransactionHistoryModal implements OnInit {
  @Output() close = new EventEmitter<void>();

  private offlineDb = inject(OfflineTransactionService);
  private auth = inject(AuthService);
  private pos = inject(POSService);
  private txService = inject(TransactionService);
  private cdr = inject(ChangeDetectorRef);

  transactions: any[] = [];
  selectedTx: OfflineTransaction | null = null;
  loading = true;

  async ngOnInit() {
    await this.loadHistory();
  }

  async loadHistory() {
    this.loading = true;
    const staff = this.auth.currentStaff();
    if (!staff) {
      this.loading = false;
      return;
    }

    const isGuid = (val: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    let cashierId = staff.id;
    if (!isGuid(cashierId)) {
      const token = localStorage.getItem('pos_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub && isGuid(payload.sub)) cashierId = payload.sub;
        } catch(e) {}
      }
    }
    if (!isGuid(cashierId)) cashierId = '00000000-0000-0000-0000-000000000000';

    try {
      if (navigator.onLine) {
        try {
          const res = await firstValueFrom(this.txService.getTransactions(cashierId));
          // Assuming res.items exists if it's a PagedResult, else res
          let list = res.items || res;
          
          // Filter for today
          const todayStr = new Date().toISOString().split('T')[0];
          list = list.filter((t: any) => t.createdAt && t.createdAt.startsWith(todayStr));
          
          this.transactions = list.map((t: any) => ({
            id: t.id,
            receiptNumber: t.receiptNumber,
            sessionId: t.sessionId,
            cashierId: t.cashierId,
            grandTotal: t.grandTotal,
            subtotal: t.subtotal,
            taxTotal: t.taxTotal,
            createdAt: t.createdAt,
            status: t.status,
            items: (t.items || []).map((i: any) => ({
              ...i,
              productName: i.productName || i.variantName
            })),
            payments: t.payments || []
          }));
        } catch (apiErr) {
          console.error('API history fetch failed, falling back to local DB', apiErr);
          this.transactions = await this.offlineDb.getTodayTransactions(cashierId);
        }
      } else {
        this.transactions = await this.offlineDb.getTodayTransactions(cashierId);
      }
    } catch (e) {
      console.error('Error loading history:', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  selectTx(tx: OfflineTransaction) {
    this.selectedTx = tx;
  }

  async refundTx() {
    if (!this.selectedTx) return;
    if (this.selectedTx.status === 2) return; 

    if (confirm('Are you sure you want to refund this entire transaction?')) {
      await this.pos.refundTransaction(this.selectedTx);
      await this.offlineDb.markAsRefunded(this.selectedTx.id);
      await this.loadHistory();
      this.selectedTx = null;
    }
  }
}
