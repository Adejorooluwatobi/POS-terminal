import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numpad.html',
  styleUrl: './numpad.css',
})
export class Numpad {
  pos = inject(POSService);

  @Output() clickDiscount = new EventEmitter<void>();
  @Output() clickPromo = new EventEmitter<void>();

  digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

  onKeyClick(d: string) {
    this.pos.numBuffer.update(prev => (prev + d).slice(0, 6));
  }

  onClear() {
    this.pos.numBuffer.set('');
  }

  onBackspace() {
    this.pos.numBuffer.update(prev => prev.slice(0, -1));
  }

  onApplyQty() {
    if (!this.pos.numBuffer() || this.pos.selectedItemIdx() < 0) return;
    const qty = parseInt(this.pos.numBuffer());
    this.pos.cart.update(prev => {
      const next = [...prev];
      next[this.pos.selectedItemIdx()].qty = qty;
      return next;
    });
    this.onClear();
  }

  onManualDiscount() {
    this.clickDiscount.emit();
  }

  onPromoCode() {
    this.clickPromo.emit();
  }

  onRemoveItem() {
    if (this.pos.selectedItemIdx() >= 0) {
      this.pos.removeItem(this.pos.selectedItemIdx());
    }
  }
}
