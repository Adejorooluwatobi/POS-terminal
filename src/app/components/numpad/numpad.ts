import { Component, inject, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { TillSessionService } from '../../services/till-session.service';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numpad.html',
})
export class Numpad {
  pos = inject(POSService);
  tillService = inject(TillSessionService);

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

  tillBadge = computed(() => {
    const s = this.tillService.currentSession();
    return s ? 'TILL ACTIVE' : 'TILL STANDBY';
  });

  formattedShiftVolume = computed(() => {
    const rev = this.pos.sessionRevenue();
    if (rev >= 1_000_000) return `₦${(rev / 1_000_000).toFixed(1)}M`;
    if (rev >= 1_000) return `₦${(rev / 1_000).toFixed(0)}K`;
    return `₦${rev}`;
  });

  onKeyClick(d: string) {
    this.pos.numBuffer.update(prev => (prev + d).slice(0, 8));
  }

  onClear() {
    this.pos.numBuffer.set('');
  }

  onBackspace() {
    this.pos.numBuffer.update(prev => prev.slice(0, -1));
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

  onHold() {
    this.pos.holdTransaction();
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
