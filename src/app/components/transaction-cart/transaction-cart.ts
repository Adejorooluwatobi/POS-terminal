import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { CartItem } from '../../models/product.model';

@Component({
  selector: 'app-transaction-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-cart.html',
})
export class TransactionCart {
  pos = inject(POSService);
  customerName = this.pos.customerName;

  @Output() clickCharge = new EventEmitter<void>();
  @Output() clickCustomer = new EventEmitter<void>();

  trackByItem(index: number, item: CartItem): string {
    return `${item.id}-${item.unit}`;
  }

  fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onSelect(idx: number) {
    this.pos.selectedItemIdx.set(idx);
  }

  onChangeQty(idx: number, delta: number, event: Event) {
    event.stopPropagation();
    this.pos.updateQty(idx, delta);
  }

  onQtyFocus(idx: number, event: Event) {
    event.stopPropagation();
    this.onSelect(idx);
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      input.select();
    }, 0);
  }

  onCommitQty(idx: number, event: Event) {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '');
    let val = parseInt(clean, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    }
    input.value = val.toString();
    this.pos.setQty(idx, val);
  }

  onQtyKeyDown(event: KeyboardEvent, idx: number) {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    }
  }

  onPromptQty(idx: number, event: Event) {
    event.stopPropagation();
    const current = this.pos.cart()[idx]?.qty || 1;
    const result = prompt('Enter quantity (e.g. 10, 100, 1000):', current.toString());
    if (result !== null) {
      const val = parseInt(result.trim(), 10);
      if (!isNaN(val) && val > 0) {
        this.pos.setQty(idx, val);
      }
    }
  }

  onRemove(idx: number, event: Event) {
    event.stopPropagation();
    this.pos.removeItem(idx);
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
