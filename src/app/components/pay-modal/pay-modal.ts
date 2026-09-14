import { Component, inject, signal, Input, Output, EventEmitter, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { POSService } from '../../services/pos.service';
import { GiftCardService } from '../../services/gift-card.service';
import { ToastService } from '../../services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-pay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pay-modal.html',
})
export class PayModal {
  pos = inject(POSService);
  private gcService = inject(GiftCardService);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  payMethod = signal<'CASH' | 'CARD' | 'MOBILE' | 'SPLIT' | 'GIFTCARD'>('CASH');
  tendered = signal<number>(0);

  gcNumber = signal<string>('');
  gcPin = signal<string>('');
  gcAmount = signal<number>(0);
  isRedeeming = signal<boolean>(false);

  constructor() {
    effect(() => {
      // Whenever grand total changes, update defaults if not in CASH mode
      if (this.payMethod() !== 'CASH') {
        this.tendered.set(this.pos.grandTotal());
        this.gcAmount.set(this.pos.grandTotal());
      }
    }, { allowSignalWrites: true });
  }

  change = computed(() => {
    return Math.max(0, this.tendered() - this.pos.grandTotal());
  });

  fmt(n: number) {
    return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  selPayMethod(m: 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT' | 'GIFTCARD') {
    this.payMethod.set(m);
    if (m !== 'CASH') {
        this.tendered.set(this.pos.grandTotal());
        this.gcAmount.set(this.pos.grandTotal());
    }
  }

  setTender(v: number) {
    this.tendered.set(v);
  }

  setExact() {
    this.tendered.set(this.pos.grandTotal());
  }

  async redeemGiftCard() {
    const storeId = localStorage.getItem('store_id');
    if (!storeId) {
      this.toast.error('Terminal not paired with a store. Please pair first.');
      return;
    }

    if (!this.gcNumber() || this.gcAmount() <= 0) return;
    
    this.isRedeeming.set(true);
    console.log('Redeeming gift card for store:', storeId);
    try {
      const amountToRedeem = this.gcAmount();
      await firstValueFrom(this.gcService.redeem(this.gcNumber(), amountToRedeem, this.gcPin()));
      this.toast.success('Gift card redeemed successfully!');
      
      this.pos.redeemedGiftCards.update(prev => [...prev, { cardNumber: this.gcNumber(), amount: amountToRedeem }]);
      
      this.gcNumber.set('');
      this.gcPin.set('');
      
      if (this.pos.grandTotal() > 0) {
        this.selPayMethod('CASH');
      } else {
        this.processPayment();
      }
    } catch (e: any) {
      this.toast.error(e.error?.message || 'Failed to redeem gift card. Insufficient balance?');
    } finally {
      this.isRedeeming.set(false);
    }
  }

  async processPayment() {
    const g = this.pos.grandTotal();
    if (this.payMethod() === 'CASH' && this.tendered() < g) {
      alert('Amount tendered is insufficient');
      return;
    }

    await this.pos.processPayment(this.payMethod(), this.tendered());
    this.paymentSuccess.emit();
    this.closeModal();
  }

  closeModal() {
    this.gcNumber.set('');
    this.gcPin.set('');
    this.close.emit();
  }
}

