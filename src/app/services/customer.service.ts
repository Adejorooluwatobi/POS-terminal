import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private api = inject(ApiService);

  getCustomers(): Observable<Customer[]> {
    return this.api.get<Customer[]>('/api/customers');
  }

  getCustomerById(id: number): Observable<Customer> {
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
