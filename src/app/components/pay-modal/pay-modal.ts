import { Component, inject, signal, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-pay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pay-modal.html',
  styleUrl: './pay-modal.css',
})
export class PayModal {
  pos = inject(POSService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  payMethod = signal<'CASH' | 'CARD' | 'MOBILE' | 'SPLIT'>('CASH');
  tendered = signal<number>(0);

  change = computed(() => {
    return Math.max(0, this.tendered() - this.pos.grandTotal());
  });

  fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  selPayMethod(m: 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT') {
    this.payMethod.set(m);
    if (m !== 'CASH') {
        this.tendered.set(this.pos.grandTotal());
    }
  }

  setTender(v: number) {
    this.tendered.set(v);
  }

  setExact() {
    this.tendered.set(this.pos.grandTotal());
  }

  processPayment() {
    const g = this.pos.grandTotal();
    if (this.payMethod() === 'CASH' && this.tendered() < g) {
      alert('Amount tendered is insufficient');
      return;
    }

    this.pos.processPayment(this.payMethod(), this.tendered());
    this.paymentSuccess.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
