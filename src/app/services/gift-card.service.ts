import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class GiftCardService {
  private api = inject(ApiService);

  getGiftCards(page: number = 1, size: number = 50): Observable<any> {
    return this.api.get<any>('/api/gift-cards', { page, size });
  }

  getGiftCardByNumber(cardNumber: string): Observable<any> {
    return this.api.get<any>(`/api/gift-cards/by-number/${cardNumber}`);
  }

  redeem(cardNumber: string, amount: number, pin?: string): Observable<any> {
    return this.api.post<any>('/api/gift-cards/redeem', {
      cardNumber,
      amount,
      pin: pin || null
    });
  }

  setStatus(cardId: string, isActive: boolean, reason?: string): Observable<any> {
    return this.api.post<any>(`/api/gift-cards/${cardId}/set-status`, {
      isActive,
      reason: reason || null
    });
  }

  replaceLostCard(dto: {
    lostCardNumber: string;
    newCardNumber?: string;
    newCardPin?: string;
    activateNewCard?: boolean;
    reason?: string;
    verificationPin?: string;
    bypassVerification?: boolean;
    bypassReason?: string;
  }): Observable<any> {
    return this.api.post<any>('/api/gift-cards/replace-lost', dto);
  }

  recharge(cardNumber: string, amount: number, paymentMethod: string = 'Cash', reference?: string): Observable<any> {
    return this.api.post<any>('/api/gift-cards/recharge', {
      cardNumber,
      amount,
      paymentMethod,
      reference: reference || null
    });
  }

  transfer(sourceCardNumber: string, destinationCardNumber: string, amount: number, sourcePin?: string, notes?: string): Observable<any> {
    return this.api.post<any>('/api/gift-cards/transfer', {
      sourceCardNumber,
      destinationCardNumber,
      amount,
      sourcePin: sourcePin || null,
      notes: notes || null
    });
  }
}
