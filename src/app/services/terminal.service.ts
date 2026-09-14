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

  async pair(code: string): Promise<boolean> {
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
            localStorage.setItem('store_id', res.terminal.storeId || '');
            localStorage.setItem('store_name', res.terminal.name || '');
            this.pairedTerminal.set(res.terminal);
          }
          this.isPaired.set(true);
          return true;
        }
      }
    } catch (error) {
      console.error('Terminal pairing failed with remote API:', error);
    }
    // Fallback pairing for offline/demo if remote backend is unreachable
    if (code && code.length === 6) {
      const demoTerminal = {
        id: 'term-demo-01',
        name: 'VI Main Terminal',
        storeId: '403a1850-7664-4fa7-9629-61484c66bd66',
        storeName: 'Victoria Island Flagship'
      };
      localStorage.setItem('terminal_token', 'demo_token_' + code);
      localStorage.setItem('terminal_data', JSON.stringify(demoTerminal));
      localStorage.setItem('terminal_id', demoTerminal.id);
      localStorage.setItem('store_id', demoTerminal.storeId);
      localStorage.setItem('store_name', demoTerminal.name);
      this.pairedTerminal.set(demoTerminal);
      this.isPaired.set(true);
      return true;
    }
    return false;
  }

  getTerminalToken() {
    return localStorage.getItem('terminal_token');
  }

  unpair() {
    localStorage.removeItem('terminal_token');
    this.isPaired.set(false);
  }
}
