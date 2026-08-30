import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-modal.html',
})
export class CustomerModal {
  pos = inject(POSService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  searchResults = signal<Customer[]>([]);

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    const q = input.value;
    if (q.length > 1) {
      const results = this.pos.customers().filter(c => 
        c.name.toLowerCase().includes(q.toLowerCase()) || 
        c.phone.includes(q) || 
        c.loyalty.includes(q.toUpperCase())
      );
      this.searchResults.set(results);
    } else {
      this.searchResults.set([]);
    }
  }

  onSelect(c: Customer) {
    this.pos.assignCustomer(c.id);
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
