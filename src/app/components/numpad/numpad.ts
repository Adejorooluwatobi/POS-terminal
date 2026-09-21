import { Component, inject, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numpad.html',
})
export class Numpad {
  pos = inject(POSService);

  @Output() clickDiscount = new EventEmitter<void>();
  @Output() clickPromo = new EventEmitter<void>();

  digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

  selectedItem = computed(() => {
    const idx = this.pos.selectedItemIdx();
    const cart = this.pos.cart();
    if (idx >= 0 && idx < cart.length) {
      return cart[idx];
    }
    return cart.length > 0 ? cart[cart.length - 1] : null;
  });

  onKeyClick(d: string) {
    this.pos.numBuffer.update(prev => (prev + d).slice(0, 6));
  }

  onClear() {
    this.pos.numBuffer.set('');
  }

  onBackspace() {
    this.pos.numBuffer.update(prev => prev.slice(0, -1));
  }

  onBufferInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '').slice(0, 6);
    this.pos.numBuffer.set(clean);
  }

  onApplyQty() {
    if (!this.pos.numBuffer() || this.pos.cart().length === 0) return;
    let idx = this.pos.selectedItemIdx();
    if (idx < 0 || idx >= this.pos.cart().length) {
      idx = this.pos.cart().length - 1;
      this.pos.selectedItemIdx.set(idx);
    }
    const qty = Math.max(1, parseInt(this.pos.numBuffer(), 10) || 1);
    this.pos.setQty(idx, qty);
    this.onClear();
  }

  onManualDiscount() {
    this.clickDiscount.emit();
  }

  onPromoCode() {
    this.clickPromo.emit();
  }

  onRemoveItem() {
    let idx = this.pos.selectedItemIdx();
    if (idx < 0 && this.pos.cart().length > 0) {
      idx = this.pos.cart().length - 1;
    }
    if (idx >= 0) {
      this.pos.removeItem(idx);
    }
  }
}
