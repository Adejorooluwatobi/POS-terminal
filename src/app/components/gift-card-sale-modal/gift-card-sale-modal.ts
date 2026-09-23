import { Component, inject, signal, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';
import { GiftCardService } from '../../services/gift-card.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { LivenessModal, LivenessResult } from '../liveness-modal/liveness-modal';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-gift-card-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LivenessModal],
  templateUrl: './gift-card-sale-modal.html',
  styleUrl: './gift-card-sale-modal.css',
})
export class GiftCardSaleModal {
  private pos = inject(POSService);
  private toast = inject(ToastService);
  private giftCardService = inject(GiftCardService);
  private customerService = inject(CustomerService);
  private auth = inject(AuthService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  activeTab = signal<'issue' | 'operations' | 'replace'>('operations');

  // Tab 1: Issue State
  cardNumber = signal('');
  amount = signal<number>(0);
  pin = signal('');
  activateImmediately = signal(false); // Default deactivated as required!

  // Tab 2: Operations State
  searchCardNumber = signal('');
  searchedCard = signal<any>(null);
  isLoading = signal(false);
  topUpAmount = signal<number>(50000);
  topUpPaymentMethod = signal<string>('transfer');
  deactivateReason = signal('');

  // Tab 3: Lost Card Replacement State
  lostCardSearchTerm = signal('');
  lostCard = signal<any>(null);
  isSearchingLost = signal(false);
  replacementCardNumber = signal('');
  replacementPin = signal('');
  activateReplacement = signal(true);
  verificationPin = signal('');
  replacementReason = signal('Reported lost/misplaced by customer');
  isReplacing = false;

  // Inline Customer Registration for Unlinked Expired/Lost Cards
  showRegisterCustomerForm = signal(false);
  newCustomerFirstName = signal('');
  newCustomerLastName = signal('');
  newCustomerPhone = signal('');
  newCustomerIdentityType = signal('NIN');
  newCustomerIdentityNumber = signal('');
  newCustomerPhoto = signal('');
  newCustomerLivenessLog = signal('');
  isRegisteringCustomer = false;

  // Liveness Modal
  isLivenessModalOpen = signal(false);
  livenessCustomerName = signal('');

  projectedBalance = computed(() => {
    const current = this.searchedCard()?.balance || 0;
    return current + (this.topUpAmount() || 0);
  });

  ngOnChanges() {
    if (this.isOpen) {
      if (!this.cardNumber()) {
        this.generateNewCard();
      }
    }
  }

  setTopUpPreset(amt: number) {
    this.topUpAmount.set(amt);
  }

  setIssuePreset(amt: number) {
    this.amount.set(amt);
  }

  // ── Tab 1: Issue Logic ──────────────────────────────────────────
  generateNewCard() {
    const businessName = this.auth.currentStaff()?.businessName || '';
    const prefix = this.getTenantPrefix(businessName);
    const digitsCount = 16 - prefix.length;
    let digits = '';
    for (let i = 0; i < digitsCount; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    this.cardNumber.set(prefix + digits);
    this.pin.set(Math.floor(1000 + Math.random() * 9000).toString());
    this.amount.set(0);
    this.activateImmediately.set(false); // Strict default: Deactivated
  }

  private getTenantPrefix(businessName: string): string {
    const name = (businessName || '').trim().toLowerCase();
    if (name.includes('nevermind')) return 'NVMD';
    if (name.includes('shoprite')) return 'SPR';

    const consonants = name.split('').filter(c => /[a-z]/i.test(c) && !'aeiou'.includes(c));
    if (consonants.length >= 3) {
      const candidate = consonants.join('').toUpperCase();
      return candidate.length > 4 ? candidate.substring(0, 4) : candidate;
    }
    return 'GFT';
  }

  onAddToCart() {
    if (this.amount() <= 0) {
      this.toast.show('Please specify a load amount greater than 0', 'error');
      return;
    }

    this.pos.cart.update(prev => [
      ...prev,
      {
        id: -99,
        name: `Card Issuance (${this.cardNumber()})${this.activateImmediately() ? ' [Active]' : ' [Deactivated]'}`,
        price: this.amount(),
        qty: 1,
        discount: 0,
        tax: 0,
        emoji: '💳',
        category: 'FINANCIAL',
        sku: this.cardNumber(),
        barcode: this.cardNumber(),
        pin: this.pin(),
        activateNow: this.activateImmediately(),
        stock: 999
      } as any
    ]);

    this.toast.show(
      `Card added to cart in ${this.activateImmediately() ? 'ACTIVE' : 'DEACTIVATED'} status`,
      'success'
    );
    this.closeModal();
  }

  // ── Tab 2: Operations Logic ────────────────────────────────────
  resetOperationsTab() {
    this.searchCardNumber.set('');
    this.searchedCard.set(null);
    this.topUpAmount.set(50000);
    this.topUpPaymentMethod.set('transfer');
    this.deactivateReason.set('');
  }

  async searchCard() {
    if (!this.searchCardNumber().trim()) return;

    this.isLoading.set(true);
    try {
      const card = await firstValueFrom(this.giftCardService.getGiftCardByNumber(this.searchCardNumber().trim()));
      this.searchedCard.set(card);
      this.toast.show(`Card found: ${card.cardNumber}`, 'success');
    } catch (e: any) {
      this.searchedCard.set(null);
      this.toast.show('Card not found', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  isCardExpired(card: any): boolean {
    if (!card?.expiresAt) return false;
    const exp = new Date(card.expiresAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp < today;
  }

  async activateCard() {
    const card = this.searchedCard();
    if (!card) return;

    if (this.isCardExpired(card)) {
      this.toast.show('Expired cards can NEVER be reactivated. Transfer balance to a new card.', 'error');
      return;
    }

    try {
      const res = await firstValueFrom(this.giftCardService.setStatus(card.id, true, 'Activated from Terminal'));
      this.searchedCard.set(res);
      this.toast.show('Card has been activated successfully!', 'success');
    } catch (e: any) {
      this.toast.show(e?.error?.message || e?.message || 'Failed to activate card', 'error');
    }
  }

  async deactivateCard() {
    const card = this.searchedCard();
    if (!card) return;

    const reason = this.deactivateReason().trim() || 'Deactivated by cashier on terminal';
    try {
      const res = await firstValueFrom(this.giftCardService.setStatus(card.id, false, reason));
      this.searchedCard.set(res);
      this.deactivateReason.set('');
      this.toast.show('Card has been deactivated', 'info');
    } catch (e: any) {
      this.toast.show(e?.error?.message || e?.message || 'Failed to deactivate card', 'error');
    }
  }

  async performTopUp() {
    const card = this.searchedCard();
    if (!card) return;

    if (this.isCardExpired(card)) {
      this.toast.show('Cannot top-up: Card has expired.', 'error');
      return;
    }

    if (!card.isActive) {
      this.toast.show('Cannot top-up: Card is deactivated. Activate it first.', 'error');
      return;
    }

    if (this.topUpAmount() <= 0) {
      this.toast.show('Enter a top-up amount greater than 0', 'error');
      return;
    }

    try {
      const res = await firstValueFrom(
        this.giftCardService.recharge(card.cardNumber, this.topUpAmount(), this.topUpPaymentMethod())
      );
      this.searchedCard.set(res);
      this.toast.show(`Successfully reloaded ₦${res.balance.toLocaleString()}`, 'success');
    } catch (e: any) {
      this.toast.show(e?.error?.message || e?.message || 'Top-up failed', 'error');
    }
  }

  // ── Tab 3: Lost Card Replacement Logic ─────────────────────────
  resetLostCardTab() {
    this.lostCardSearchTerm.set('');
    this.lostCard.set(null);
    this.replacementCardNumber.set('');
    this.replacementPin.set('');
    this.verificationPin.set('');
    this.replacementReason.set('Reported lost/misplaced by customer');
    this.showRegisterCustomerForm.set(false);
    this.resetInlineCustomerForm();
  }

  resetInlineCustomerForm() {
    this.newCustomerFirstName.set('');
    this.newCustomerLastName.set('');
    this.newCustomerPhone.set('');
    this.newCustomerIdentityType.set('NIN');
    this.newCustomerIdentityNumber.set('');
    this.newCustomerPhoto.set('');
    this.newCustomerLivenessLog.set('');
  }

  async searchLostCard() {
    if (!this.lostCardSearchTerm().trim()) return;

    this.isSearchingLost.set(true);
    try {
      const card = await firstValueFrom(this.giftCardService.getGiftCardByNumber(this.lostCardSearchTerm().trim()));
      this.lostCard.set(card);

      // Generate replacement card specs
      const businessName = this.auth.currentStaff()?.businessName || '';
      const prefix = this.getTenantPrefix(businessName);
      let digits = '';
      for (let i = 0; i < (16 - prefix.length); i++) {
        digits += Math.floor(Math.random() * 10).toString();
      }
      this.replacementCardNumber.set(prefix + digits);
      this.replacementPin.set(Math.floor(1000 + Math.random() * 9000).toString());

      if (!card.customerId) {
        this.showRegisterCustomerForm.set(true);
        this.toast.show('Card is not linked to a customer. Please register customer first.', 'info');
      } else {
        this.showRegisterCustomerForm.set(false);
      }
    } catch (e: any) {
      this.lostCard.set(null);
      this.toast.show('Lost card number not found', 'error');
    } finally {
      this.isSearchingLost.set(false);
    }
  }

  openLivenessVerification() {
    const name = `${this.newCustomerFirstName()} ${this.newCustomerLastName()}`.trim() || 'Customer';
    this.livenessCustomerName.set(name);
    this.isLivenessModalOpen.set(true);
  }

  onLivenessVerified(result: LivenessResult) {
    this.newCustomerPhoto.set(result.photoUrl);
    this.newCustomerLivenessLog.set(result.auditLog);
    this.toast.show('Face liveness verification completed!', 'success');
  }

  async registerAndLinkCustomer() {
    if (!this.newCustomerFirstName().trim() || !this.newCustomerPhone().trim()) {
      this.toast.show('Customer first name and phone number are required', 'error');
      return;
    }

    const lost = this.lostCard();
    if (!lost) return;

    this.isRegisteringCustomer = true;
    try {
      const customer = await firstValueFrom(
        this.customerService.createCustomer({
          firstName: this.newCustomerFirstName().trim(),
          lastName: this.newCustomerLastName().trim(),
          phone: this.newCustomerPhone().trim(),
          identityType: this.newCustomerIdentityType(),
          identityNumber: this.newCustomerIdentityNumber().trim() || undefined,
          photoUrl: this.newCustomerPhoto() || undefined,
          isIdentityVerified: !!this.newCustomerPhoto(),
          registeredStoreId: localStorage.getItem('store_id') || this.auth.currentStaff()?.store || undefined,
          isSelfRegistered: false
        } as any)
      );

      await firstValueFrom(this.giftCardService.getGiftCards());
      const refreshed = await firstValueFrom(this.giftCardService.getGiftCardByNumber(lost.cardNumber));
      refreshed.customerId = customer.id;
      refreshed.customerName = `${customer.firstName} ${customer.lastName}`.trim();
      this.lostCard.set(refreshed);

      this.showRegisterCustomerForm.set(false);
      this.toast.show('Customer registered and linked to card! Ready for balance migration.', 'success');
    } catch (e: any) {
      this.toast.show(e?.error?.message || e?.message || 'Failed to register customer', 'error');
    } finally {
      this.isRegisteringCustomer = false;
    }
  }

  async confirmReplacement() {
    const lost = this.lostCard();
    if (!lost) return;

    if (this.isCardExpired(lost) && !lost.customerId) {
      this.toast.show('Customer registration is mandatory for expired card balance transfer', 'error');
      return;
    }

    this.isReplacing = true;
    try {
      const res = await firstValueFrom(
        this.giftCardService.replaceLostCard({
          lostCardNumber: lost.cardNumber,
          newCardNumber: this.replacementCardNumber(),
          newCardPin: this.replacementPin(),
          activateNewCard: this.activateReplacement(),
          reason: this.replacementReason(),
          verificationPin: this.verificationPin().trim() || undefined
        })
      );

      this.toast.show(
        `Replacement successful! New card ${res.cardNumber} loaded with ₦${res.balance.toLocaleString()}`,
        'success'
      );
      this.closeModal();
    } catch (e: any) {
      this.toast.show(e?.error?.message || e?.message || 'Failed to replace card', 'error');
    } finally {
      this.isReplacing = false;
    }
  }

  closeModal() {
    this.close.emit();
  }
}
