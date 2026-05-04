import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Coupon {
  code: string;
  type: 'pct' | 'fixed';
  val: number;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private api = inject(ApiService);

  validatePromoCode(code: string, cartAmount: number): Observable<any> {
    return this.api.get<any>(`/api/promotions/validate/${code}?cartAmount=${cartAmount}`);
  }
}
