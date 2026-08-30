import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { POSService } from '../../services/pos.service';

@Component({
  selector: 'app-disc-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disc-modal.html',
})
export class DiscModal {
  pos = inject(POSService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  discType = signal<'pct' | 'fixed'>('pct');
  discValue = signal<number>(0);

  onTypeSelect(t: 'pct' | 'fixed') {
    this.discType.set(t);
  }

  onApply() {
    const idx = this.pos.selectedItemIdx();
    if (idx < 0) return;
    
    const val = this.discValue();
    if (!val) return;

    this.pos.cart.update(prev => {
      const next = [...prev];
      const item = next[idx];
      const line = item.price * item.qty;
      item.discount = this.discType() === 'pct' ? line * (Math.min(val, 100) / 100) : Math.min(val, line);
      return next;
    });

    this.discValue.set(0);
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
