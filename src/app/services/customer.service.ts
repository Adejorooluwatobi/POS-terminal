import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer } from '../models/customer.model';

import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private api = inject(ApiService);

  getCustomers(): Observable<Customer[]> {
    return this.api.get<any>('/api/customers?size=100').pipe(
      map(res => {
        const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
        if (!Array.isArray(items)) return [];
        return items.map((c: any) => ({
          id: c.id,
          name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer',
          phone: c.phone || c.phoneNumber || '',
          email: c.email || '',
          points: c.loyaltyPoints ?? c.points ?? 0,
          tier: c.tier || ((c.loyaltyPoints ?? c.points ?? 0) > 500 ? 'VIP' : 'Regular'),
          totalSpend: c.totalSpend ?? 0,
          balance: c.balance ?? 0
        }));
      })
    );
  }

  getCustomerById(id: number | string): Observable<Customer> {
    return this.api.get<Customer>(`/api/customers/${id}`);
  }

  createCustomer(customer: Partial<Customer>): Observable<Customer> {
    return this.api.post<Customer>('/api/customers', customer);
  }

  updateCustomer(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.api.put<Customer>(`/api/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.api.delete<void>(`/api/customers/${id}`);
  }
}
