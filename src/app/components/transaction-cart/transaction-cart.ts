import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-transaction-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-cart.html',
  styleUrl: './transaction-cart.css',
})
export class TransactionCart {
  pos = inject(POSService);

  @Output() clickCharge = new EventEmitter<void>();
  @Output() clickCustomer = new EventEmitter<void>();

  fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onSelect(idx: number) {
    this.pos.selectedItemIdx.set(idx);
  }

  onChangeQty(idx: number, delta: number, event: Event) {
    event.stopPropagation();
    this.pos.cart.update(prev => {
      const next = [...prev];
      next[idx].qty = Math.max(1, next[idx].qty + delta);
      return next;
    });
  }

  onRemove(idx: number, event: Event) {
    event.stopPropagation();
    this.pos.removeItem(idx);
  }

  onApplyCoupon(code: string) {
    this.pos.applyCoupon(code);
  }

  onVoid() {
    if (confirm('Void this transaction? This will be logged.')) {
      this.pos.clearCart();
    }
  }

  onOpenPayModal() {
    this.clickCharge.emit();
  }

  onOpenCustomerModal() {
    this.clickCustomer.emit();
  }
}
