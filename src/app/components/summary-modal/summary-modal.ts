import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-summary-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-modal.html',
})
export class SummaryModal {
  pos = inject(POSService);
  auth = inject(AuthService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  closeModal() {
    this.close.emit();
  }
}
