import { Injectable, signal } from '@angular/core';
import { Staff } from '../models/staff.model';
import { STAFF_LIST } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  staffList = signal<Staff[]>(STAFF_LIST);
  currentStaff = signal<Staff | null>(null);
  selectedStaffId = signal<string | null>(null);

  selectStaff(id: string) {
    this.selectedStaffId.set(id);
  }

  getStaff(id: string) {
    return this.staffList().find(s => s.id === id);
  }

  login(pin: string): boolean {
    const id = this.selectedStaffId();
    if (!id) return false;
    
    const staff = this.getStaff(id);
    if (staff && staff.pin === pin) {
      this.currentStaff.set(staff);
      return true;
    }
    return false;
  }

  logout() {
    this.currentStaff.set(null);
    this.selectedStaffId.set(null);
  }
}
