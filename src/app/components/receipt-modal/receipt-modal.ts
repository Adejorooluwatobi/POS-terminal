import { Component, inject, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-modal.html',
})
export class ReceiptModal {
  pos = inject(POSService);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() newTransaction = new EventEmitter<void>();

  isPrinting = signal<boolean>(false);
  printSuccess = signal<boolean>(false);

  storeName = computed(() => this.pos.storeName() || this.pos.businessName() || 'RetailOS Victoria Island');
  storeAddress = computed(() => this.pos.storeAddress() || '23 Adeola Hopewell, Victoria Island, Lagos');
  storePhone = computed(() => this.pos.storePhone() || '+234 1 234 5678');
  tenantEmail = computed(() => this.pos.tenantEmail() || 'support@retailos.com');

  fmt(n: number | undefined) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  printReceipt() {
    this.isPrinting.set(true);
    setTimeout(() => {
      this.isPrinting.set(false);
      this.printSuccess.set(true);
      this.toast.success('Sent to Thermal Receipt Printer');
      setTimeout(() => this.printSuccess.set(false), 2500);
    }, 700);
  }

  sendDigitalReceipt() {
    const target = prompt('Enter customer mobile number (+234...) or email for instant e-Receipt:');
    if (target && target.trim()) {
      this.toast.success(`e-Receipt dispatched to ${target.trim()}`);
    }
  }

  onNewTransaction() {
    this.newTransaction.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
