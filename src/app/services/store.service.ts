import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface Store {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  phone?: string;
  timezone?: string;
  isActive?: boolean;
  tenantEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private api = inject(ApiService);
  currentStore = signal<Store | null>(null);

  constructor() {
    const saved = localStorage.getItem('current_store');
    if (saved) {
      try {
        this.currentStore.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('current_store');
      }
    }
  }

  getStore(id: string): Observable<Store> {
    return this.api.get<Store>(`/api/stores/${id}`).pipe(
      tap(store => {
        if (store) {
          this.setStore(store);
        }
      })
    );
  }

  setStore(store: Store) {
    this.currentStore.set(store);
    localStorage.setItem('current_store', JSON.stringify(store));
    if (store.id) localStorage.setItem('store_id', store.id);
    if (store.name) localStorage.setItem('store_name', store.name);
    if (store.address) localStorage.setItem('store_address', store.address);
    if (store.city) localStorage.setItem('store_city', store.city);
    if (store.phone) localStorage.setItem('store_phone', store.phone);
    if (store.tenantEmail) localStorage.setItem('tenant_email', store.tenantEmail);
  }
}
