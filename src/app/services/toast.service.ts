import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'info' | 'error' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'info' | 'error' | 'success' = 'info') {
    const toast: Toast = { message, type };
    this.toasts.update(prev => [...prev, toast]);
    setTimeout(() => {
      this.toasts.update(prev => prev.filter(t => t !== toast));
    }, 3000);
  }

  info(msg: string) { this.show(msg, 'info'); }
  error(msg: string) { this.show(msg, 'error'); }
  success(msg: string) { this.show(msg, 'success'); }
}
