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
  activeCards = signal<any[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  async ngOnChanges() {
    if (this.isOpen) {
      this.generateNewCard();
      await this.loadActiveCards();
    }
  }

  generateNewCard() {
    this.cardNumber.set('GC-' + Math.floor(10000000 + Math.random() * 90000000).toString());
    this.pin.set(Math.floor(1000 + Math.random() * 9000).toString());
    this.amount.set(0);
  }

  async loadActiveCards() {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.giftCardService.getGiftCards(1, 100));
      this.activeCards.set(res.items || res);
    } catch (e) {
      console.error('Failed to load active cards', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCard(card: any) {
    this.cardNumber.set(card.cardNumber);
    this.pin.set('****'); // We don't show pin for existing cards usually
    this.toast.show(`Selected Card: ${card.cardNumber}`, 'success');
  }

  onAddToCart() {
    if (this.amount() <= 0) return;

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
        pin: this.pin(),
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
