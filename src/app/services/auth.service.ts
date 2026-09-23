import { Injectable, signal, inject } from '@angular/core';
import { Staff } from '../models/staff.model';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private staffService = inject(StaffService);
  
  staffList = signal<Staff[]>([]);
  currentStaff = signal<Staff | null>(null);
  selectedStaffId = signal<string | null>(null);

  constructor() {
    this.restoreSession();
    this.fetchStaff();
  }

  async fetchStaff() {
    const token = localStorage.getItem('pos_token');
    if (!token) {
      this.staffList.set([]);
      return;
    }

    try {
      const list = await firstValueFrom(this.staffService.getStaffList());
      if (list && Array.isArray(list)) {
        this.staffList.set(list);
      } else {
        this.staffList.set([]);
      }
    } catch (e) {
      console.warn('Could not fetch staff from API:', e);
      this.staffList.set([]);
    }
  }

  private restoreSession() {
    const saved = localStorage.getItem('currentStaff');
    if (saved) {
      try {
        this.currentStaff.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('currentStaff');
        localStorage.removeItem('pos_token');
      }
    }
  }

  selectStaff(id: string) {
    this.selectedStaffId.set(id);
  }

  getStaff(id: string) {
    return this.staffList().find(s => s.id === id);
  }

  async login(pin: string, employeeNo?: string, storeId?: string): Promise<{ success: boolean; message?: string }> {
    const sId = storeId || localStorage.getItem('store_id');
    const id = (employeeNo || this.selectedStaffId() || '').trim();

    if (!sId) {
      return { success: false, message: 'Workstation is not paired with a store. Please pair device first.' };
    }
    if (!id) {
      return { success: false, message: 'Please enter employee number.' };
    }
    if (!pin) {
      return { success: false, message: 'Please enter 4-digit PIN.' };
    }

    try {
      const payload = {
        storeId: sId,
        employeeNo: id,
        pin: pin
      };

      const res = await firstValueFrom(
        this.api.post<any>('/api/auth/login-pos', payload)
      );

      console.log('Login response:', res);

      if (res && res.token) {
        localStorage.setItem('pos_token', res.token);
        if (res.storeName) localStorage.setItem('store_name', res.storeName);
        if (res.storeAddress) localStorage.setItem('store_address', res.storeAddress);
        if (res.storeCity) localStorage.setItem('store_city', res.storeCity);
        if (res.storePhone) localStorage.setItem('store_phone', res.storePhone);
        if (res.tenantEmail) localStorage.setItem('tenant_email', res.tenantEmail);
        if (res.businessName) localStorage.setItem('business_name', res.businessName);

        const staff: Staff = {
          id: res.userId || res.staffId || id,
          name: res.name || res.fullName || id,
          initials: ((res.name || res.fullName || 'S').split(' ').map((n: any) => n[0]).join('')).toUpperCase(),
          role: (res.role || 'CASHIER').toUpperCase() as any,
          pin: pin,
          store: res.storeId || sId,
          color: '#4edea3',
          businessName: res.businessName,
          storeName: res.storeName,
          storeAddress: res.storeAddress,
          storeCity: res.storeCity,
          storePhone: res.storePhone,
          tenantEmail: res.tenantEmail
        };
        this.currentStaff.set(staff);
        localStorage.setItem('currentStaff', JSON.stringify(staff));
        return { success: true };
      }
      return { success: false, message: 'Login failed: No authentication token returned.' };
    } catch (error: any) {
      console.error('Remote login failed:', error);
      const msg = error?.error?.message || error?.error?.title || error?.message || 'Invalid POS credentials or unknown Store.';
      return { success: false, message: msg };
    }
  }

  logout() {
    this.currentStaff.set(null);
    this.selectedStaffId.set(null);
    localStorage.removeItem('currentStaff');
    localStorage.removeItem('pos_token');
  }
}
