import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { GiftCardService } from '../../services/gift-card.service';
import { Customer } from '../../models/customer.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-customer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-modal.html',
})
export class CustomerModal {
  pos = inject(POSService);
  private gcService = inject(GiftCardService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  searchResults = signal<Customer[]>([]);

  async onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    const q = input.value.trim();
    if (q.length > 1) {
      const results = this.pos.customers().filter(c => 
        c.name.toLowerCase().includes(q.toLowerCase()) || 
        c.phone.includes(q) || 
        (c.loyalty && c.loyalty.toUpperCase().includes(q.toUpperCase()))
      );
      this.searchResults.set(results);

      // If not found in memory, check if query is a card number / barcode
      if (results.length === 0 && q.length >= 8) {
        try {
          const card = await firstValueFrom(this.gcService.getGiftCardByNumber(q));
          if (card && card.customerId) {
            const found = this.pos.customers().find(c => c.id === card.customerId);
            if (found) {
              this.searchResults.set([found]);
            } else {
              this.searchResults.set([{
                id: card.customerId,
                name: card.customerName || 'Cardholder',
                phone: card.customerPhone || '',
                loyalty: card.customerLoyaltyCardNo || card.cardNumber,
                points: card.customerPointsBalance || 0,
                tier: 'BRONZE'
              }]);
            }
          }
        } catch {
          // ignore lookup errors during typing
        }
      }
    } else {
      this.searchResults.set([]);
    }
  }

  onSelect(c: Customer) {
    this.pos.assignCustomer(c.id as any);
    this.closeModal();
  }

  setWalkin() {
    this.pos.currentCustomer.set(null);
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}
