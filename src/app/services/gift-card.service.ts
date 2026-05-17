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
}
