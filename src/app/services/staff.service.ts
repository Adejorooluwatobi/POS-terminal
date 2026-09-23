import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Staff } from '../models/staff.model';

import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private api = inject(ApiService);

  getStaffList(): Observable<Staff[]> {
    return this.api.get<any>('/api/staff?size=100').pipe(
      map(res => {
        const items = res?.items || res?.data || (Array.isArray(res) ? res : []);
        if (!Array.isArray(items)) return [];
        return items.map((s: any) => ({
          id: s.id,
          employeeNo: s.employeeNo || s.email,
          name: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff',
          initials: (((s.firstName?.[0] || '') + (s.lastName?.[0] || '')) || 'ST').toUpperCase(),
          role: (s.systemRole !== undefined ? (s.systemRole === 0 ? 'SUPERADMIN' : s.systemRole === 1 ? 'ADMIN' : s.systemRole === 2 ? 'MANAGER' : 'CASHIER') : (s.role || 'CASHIER')).toUpperCase(),
          pin: '',
          store: s.storeId || '',
          color: '#4edea3',
          todayRevenue: s.todayRevenue || 0,
          lifetimeRevenue: s.lifetimeRevenue || 0
        }));
      })
    );
  }

  getStaffById(id: string): Observable<Staff> {
    return this.api.get<Staff>(`/api/staff/${id}`);
  }
}
