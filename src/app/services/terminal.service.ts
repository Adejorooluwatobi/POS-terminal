import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  private api = inject(ApiService);
  
  // A terminal is paired if we have a persistent device token
  isPaired = signal<boolean>(!!localStorage.getItem('terminal_token'));
  
  pairedTerminal = signal<any>(null);

  constructor() {
    const saved = localStorage.getItem('terminal_data');
    if (saved) this.pairedTerminal.set(JSON.parse(saved));
  }

  async pair(code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await firstValueFrom(
        this.api.post<any>('/api/terminals/pair', { pairingCode: code })
      );
      
      console.log('Pairing response:', res);
      
      if (res && res.success) {
        const token = res.deviceToken || res.token;
        if (token) {
          localStorage.setItem('terminal_token', token);
          if (res.terminal) {
            console.log('Terminal data found:', res.terminal);
            localStorage.setItem('terminal_data', JSON.stringify(res.terminal));
            localStorage.setItem('terminal_id', res.terminal.id);
            localStorage.setItem('terminal_code', res.terminal.terminalCode || res.terminal.code || '');
            localStorage.setItem('store_id', res.terminal.storeId || '');
            localStorage.setItem('store_name', res.terminal.storeName || res.terminal.name || '');
            if (res.terminal.storeAddress) localStorage.setItem('store_address', res.terminal.storeAddress);
            if (res.terminal.storeCity) localStorage.setItem('store_city', res.terminal.storeCity);
            if (res.terminal.storePhone) localStorage.setItem('store_phone', res.terminal.storePhone);
            if (res.terminal.tenantEmail) localStorage.setItem('tenant_email', res.terminal.tenantEmail);
            this.pairedTerminal.set(res.terminal);
          }
          this.isPaired.set(true);
          return { success: true };
        }
      }
      return { success: false, message: res?.message || 'Invalid pairing code.' };
    } catch (error: any) {
      console.error('Terminal pairing failed with remote API:', error);
      const msg = error?.error?.message || error?.error?.title || error?.message || 'Terminal pairing failed. Please verify API server is running and pairing code is active.';
      return { success: false, message: msg };
    }
  }

  getTerminalToken() {
    return localStorage.getItem('terminal_token');
  }

  unpair() {
    localStorage.removeItem('terminal_token');
    localStorage.removeItem('terminal_data');
    localStorage.removeItem('terminal_id');
    localStorage.removeItem('terminal_code');
    localStorage.removeItem('store_id');
    localStorage.removeItem('store_name');
    localStorage.removeItem('store_address');
    localStorage.removeItem('store_city');
    localStorage.removeItem('store_phone');
    localStorage.removeItem('tenant_email');
    localStorage.removeItem('business_name');
    localStorage.removeItem('pos_token');
    localStorage.removeItem('currentStaff');
    localStorage.removeItem('active_till_session');
    localStorage.removeItem('till_session_id');
    this.pairedTerminal.set(null);
    this.isPaired.set(false);
  }
}
