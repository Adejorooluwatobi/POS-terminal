import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';
import { GiftCardService } from '../../services/gift-card.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-gift-card-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gift-card-sale-modal.html',
  styleUrl: './gift-card-sale-modal.css',
})
export class GiftCardSaleModal {
  private pos = inject(POSService);
  private toast = inject(ToastService);
  private giftCardService = inject(GiftCardService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  cardNumber = signal('');
  amount = signal<number>(0);
  pin = signal('');
  oldPin = signal('');
  changePin = signal(false);
  isExistingCard = signal(false);
  searchedCard = signal<any>(null);

  isLoading = signal(false);
  searchTerm = signal('');

  ngOnChanges() {
    if (this.isOpen) {
      this.searchTerm.set('');
      this.generateNewCard();
    }
  }

  generateNewCard() {
    this.cardNumber.set('GC-' + Math.floor(10000000 + Math.random() * 90000000).toString());
    this.pin.set(Math.floor(1000 + Math.random() * 9000).toString());
    this.amount.set(0);
    this.oldPin.set('');
    this.changePin.set(false);
    this.isExistingCard.set(false);
    this.searchedCard.set(null);
  }

  async searchCard() {
    if (!this.searchTerm()) return;
    
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.giftCardService.getGiftCardByNumber(this.searchTerm()));
      if (res) {
        this.searchedCard.set(res);
        this.cardNumber.set(res.cardNumber);
        this.isExistingCard.set(true);
        this.changePin.set(false);
        this.pin.set('');
        this.oldPin.set('');
        this.amount.set(0);
        this.toast.show(`Found Card: ${res.cardNumber}`, 'success');
      }
    } catch (e) {
      this.toast.show('Card not found', 'error');
      this.searchedCard.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  onAddToCart() {
    if (this.amount() <= 0) return;
    if (this.isExistingCard() && this.changePin() && (!this.oldPin() || !this.pin())) {
      this.toast.show('Both current and new PIN are required to change PIN', 'error');
      return;
    }

    // Add to cart as a special "Gift Card" item
    // In a real system, the transaction processing would trigger the issuance on the backend
    this.pos.cart.update(prev => [
      ...prev,
      {
        id: -99, // Special ID for gift card
        name: `Gift Card Sale (${this.cardNumber()})`,
        price: this.amount(),
        qty: 1,
        discount: 0,
        tax: 0,
        emoji: '💳',
        category: 'FINANCIAL',
        sku: this.cardNumber(),
        barcode: this.cardNumber(),
        pin: this.isExistingCard() ? (this.changePin() ? this.pin() : null) : this.pin(),
        oldPin: this.isExistingCard() && this.changePin() ? this.oldPin() : null,
        stock: 999
      } as any
    ]);

    this.toast.show('Gift card added to cart', 'success');
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
