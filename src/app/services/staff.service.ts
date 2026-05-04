import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Staff } from '../models/staff.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private api = inject(ApiService);

  getStaffList(): Observable<Staff[]> {
    return this.api.get<Staff[]>('/api/staff');
  }

  getStaffById(id: string): Observable<Staff> {
    return this.api.get<Staff>(`/api/staff/${id}`);
  }
}
