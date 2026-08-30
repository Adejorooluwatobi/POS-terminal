import { Injectable, signal, inject } from '@angular/core';
import { Staff } from '../models/staff.model';
import { STAFF_LIST } from '../models/mock-data';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private staffService = inject(StaffService);
  
  staffList = signal<Staff[]>(STAFF_LIST);
  currentStaff = signal<Staff | null>(null);
  selectedStaffId = signal<string | null>(null);

  constructor() {
    this.restoreSession();
    this.fetchStaff();
  }

  async fetchStaff() {
    try {
      const list = await firstValueFrom(this.staffService.getStaffList());
      if (list && Array.isArray(list) && list.length > 0) {
        this.staffList.set(list);
      } else {
        this.staffList.set(STAFF_LIST);
      }
    } catch (e) {
      console.warn('Could not fetch staff from API, loaded default staff list');
      this.staffList.set(STAFF_LIST);
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

  async login(pin: string, employeeNo?: string, storeId?: string): Promise<boolean> {
    const id = employeeNo || this.selectedStaffId() || 'EMP-001'; 
    const sId = storeId || localStorage.getItem('store_id') || '403a1850-7664-4fa7-9629-61484c66bd66';
    
    console.log('Attempting login with:', { id, sId, pin });
    
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
        // Map API response to Staff model
        const staff: Staff = {
          id: id,
          name: res.name || 'Staff',
          initials: (res.name || 'S').split(' ').map((n:any)=>n[0]).join(''),
          role: (res.role || 'CASHIER').toUpperCase() as any,
          pin: pin,
          store: localStorage.getItem('store_id') || res.storeId || sId,
          color: '#00c2ff',
          businessName: res.businessName
        };
        this.currentStaff.set(staff);
        localStorage.setItem('currentStaff', JSON.stringify(staff));
        return true;
      }
    } catch (error) {
      console.error('Remote login failed, falling back to local verification:', error);
    }

    // Fallback: match local staff list or default demo pin (1234)
    const local = this.staffList().find(s => s.id.toLowerCase() === id.toLowerCase()) || 
                  STAFF_LIST.find(s => s.id.toLowerCase() === id.toLowerCase()) ||
                  STAFF_LIST[0];

    if (local && (local.pin === pin || pin === '1234')) {
      const staff: Staff = {
        ...local,
        id: id || local.id,
        store: localStorage.getItem('store_id') || sId,
        businessName: localStorage.getItem('store_name') || 'RetailOS Victoria Island'
      };
      localStorage.setItem('pos_token', 'local_demo_token_' + staff.id);
      this.currentStaff.set(staff);
      localStorage.setItem('currentStaff', JSON.stringify(staff));
      return true;
    }

    return false;
  }

  logout() {
    this.currentStaff.set(null);
    this.selectedStaffId.set(null);
    localStorage.removeItem('currentStaff');
    localStorage.removeItem('pos_token');
  }
}
