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

  getCoupons(): Observable<Coupon[]> {
    return this.api.get<Coupon[]>('/api/coupons');
  }

  getCouponByCode(code: string): Observable<Coupon> {
    return this.api.get<Coupon>(`/api/coupons/${code}`);
  }
}
