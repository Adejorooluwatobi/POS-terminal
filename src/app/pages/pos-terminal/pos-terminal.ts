import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { ProductBrowser } from '../../components/product-browser/product-browser';
import { TransactionCart } from '../../components/transaction-cart/transaction-cart';
import { Numpad } from '../../components/numpad/numpad';
import { PayModal } from '../../components/pay-modal/pay-modal';
import { ReceiptModal } from '../../components/receipt-modal/receipt-modal';
import { CustomerModal } from '../../components/customer-modal/customer-modal';
import { DiscModal } from '../../components/disc-modal/disc-modal';
import { PromoCodeModal } from '../../components/promo-code-modal/promo-code-modal';
import { GiftCardSaleModal } from '../../components/gift-card-sale-modal/gift-card-sale-modal';
import { SummaryModal } from '../../components/summary-modal/summary-modal';
import { ToastContainer } from '../../components/toast-container/toast-container';
import { CalculatorComponent } from '../../components/calculator/calculator.component';
import { TillModalComponent } from '../../components/till-modal/till-modal';
import { POSService } from '../../services/pos.service';
import { TillSessionService } from '../../services/till-session.service';

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    ProductBrowser, 
    TransactionCart, 
    Numpad,
    PayModal,
    ReceiptModal,
    CustomerModal,
    DiscModal,
    PromoCodeModal,
    GiftCardSaleModal,
    SummaryModal,
    ToastContainer,
    CalculatorComponent,
    TillModalComponent
  ],
  templateUrl: './pos-terminal.html',
  styleUrl: './pos-terminal.css',
})
export class POSTerminal {
  pos = inject(POSService);
  tillSession = inject(TillSessionService);

  showPayModal = signal(false);
  showReceiptModal = signal(false);
  showCustomerModal = signal(false);
  showDiscModal = signal(false);
  showPromoModal = signal(false);
  showGiftCardModal = signal(false);
  showSummaryModal = signal(false);
  showCalculator = signal(false);
  showTillModal = signal(false);

  openPayModal() { this.showPayModal.set(true); }
  closePayModal() { this.showPayModal.set(false); }

  onPaymentSuccess() {
    this.showPayModal.set(false);
    this.showReceiptModal.set(true);
  }

  openReceiptModal() { this.showReceiptModal.set(true); }
  closeReceiptModal() { this.showReceiptModal.set(false); }

  openCustomerModal() { this.showCustomerModal.set(true); }
  closeCustomerModal() { this.showCustomerModal.set(false); }

  openDiscModal() { this.showDiscModal.set(true); }
  closeDiscModal() { this.showDiscModal.set(false); }

  openPromoModal() { this.showPromoModal.set(true); }
  closePromoModal() { this.showPromoModal.set(false); }

  openGiftCardModal() { this.showGiftCardModal.set(true); }
  closeGiftCardModal() { this.showGiftCardModal.set(false); }

  openSummaryModal() { this.showSummaryModal.set(true); }
  closeSummaryModal() { this.showSummaryModal.set(false); }

  openTillModal() { this.showTillModal.set(true); }
  closeTillModal() { this.showTillModal.set(false); }

  startNewTransaction() {
    this.pos.clearCart();
    this.showReceiptModal.set(false);
  }
}
