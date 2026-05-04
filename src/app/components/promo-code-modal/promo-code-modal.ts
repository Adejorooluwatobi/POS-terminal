import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../services/coupon.service';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-promo-code-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promo-code-modal.html',
  styleUrl: './promo-code-modal.css',
})
export class PromoCodeModal {
  private couponService = inject(CouponService);
  private pos = inject(POSService);
  private toast = inject(ToastService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  promoCode = signal('');
  isValidating = signal(false);

  async onApply() {
    const code = this.promoCode().trim();
    if (!code) return;

    this.isValidating.set(true);
    try {
      const cartTotal = this.pos.subtotal();
      this.couponService.validatePromoCode(code, cartTotal).subscribe({
        next: (res) => {
          if (res.isValid) {
            this.pos.appliedPromo.set({
              code: code,
              amount: res.discountAmount,
              promotionId: res.promotion.id
            });
            this.toast.show('Promo code applied!', 'success');
            this.closeModal();
          } else {
            this.toast.show(res.message || 'Invalid promo code', 'error');
          }
          this.isValidating.set(false);
        },
        error: (err) => {
          this.toast.show('Failed to validate promo code', 'error');
          this.isValidating.set(false);
        }
      });
    } catch (error) {
      this.isValidating.set(false);
    }
  }

  closeModal() {
    this.promoCode.set('');
    this.close.emit();
  }
}
