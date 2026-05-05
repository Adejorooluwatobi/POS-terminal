import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class GiftCardService {
  private api = inject(ApiService);

  redeem(cardNumber: string, amount: number, pin?: string): Observable<any> {
    return this.api.post<any>('/api/gift-cards/redeem', {
      cardNumber,
      amount,
      pin: pin || null
    });
  }
}
