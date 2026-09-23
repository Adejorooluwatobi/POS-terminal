import { Component, inject, Output, EventEmitter, signal } from '@angular/core';
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

  selectedTender = signal<'CASH' | 'CARD' | 'GIFTCARD' | 'TRANSFER'>('CARD');

  @Output() clickCharge = new EventEmitter<string>();
  @Output() clickCustomer = new EventEmitter<void>();

  trackByItem(index: number, item: CartItem): string {
    return `${item.id}-${item.unit}`;
  }

  fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getItemCode(item: CartItem): string {
    if (item.sku && item.sku.length <= 5) return item.sku.toUpperCase();
    if (item.sku) return item.sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();
    return item.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'ITM';
  }

  onSelect(idx: number) {
    this.pos.selectedItemIdx.set(idx);
  }

  onChangeQty(idx: number, delta: number, event: Event) {
    event.stopPropagation();
    this.pos.updateQty(idx, delta);
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
    if (confirm('Void this active transaction? All cart items will be removed.')) {
      this.pos.clearCart();
    }
  }

  selectTender(method: 'CASH' | 'CARD' | 'GIFTCARD' | 'TRANSFER') {
    this.selectedTender.set(method);
  }

  onOpenPayModal(method?: string) {
    const tender = method || this.selectedTender();
    this.clickCharge.emit(tender);
  }

  onOpenCustomerModal() {
    this.clickCustomer.emit();
  }
}
