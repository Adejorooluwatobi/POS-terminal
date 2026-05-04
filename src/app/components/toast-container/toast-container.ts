import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      <div *ngFor="let t of toastService.toasts()" 
           class="fade-up px-4 py-2 rounded-lg text-sm font-semibold shadow-2xl border"
           [ngClass]="{
             'bg-[var(--surface2)] border-[var(--border2)] text-[var(--text)]': t.type === 'info',
             'bg-[var(--red-dim)] border-[rgba(255,75,110,0.3)] text-[var(--red)]': t.type === 'error',
             'bg-[var(--green-dim)] border-[rgba(0,214,143,0.3)] text-[var(--green)]': t.type === 'success'
           }">
        {{ t.message }}
      </div>
    </div>
  `,
})
export class ToastContainer {
  toastService = inject(ToastService);
}
