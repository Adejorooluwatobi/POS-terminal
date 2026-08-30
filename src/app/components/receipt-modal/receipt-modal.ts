import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-modal.html',
})
export class ReceiptModal {
  pos = inject(POSService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() newTransaction = new EventEmitter<void>();

  fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  printReceipt() {
    alert('Sending to receipt printer…');
  }

  onNewTransaction() {
    this.newTransaction.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
