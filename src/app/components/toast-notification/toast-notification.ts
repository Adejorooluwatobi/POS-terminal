import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (n of notificationService.notifications(); track n.id) {
        <div class="toast" [class]="n.type" (click)="notificationService.remove(n.id)">
          <div class="icon">
            @if (n.type === 'success') { ✓ }
            @else if (n.type === 'error') { ✕ }
            @else if (n.type === 'warning') { ⚠ }
            @else { ℹ }
          </div>
          <div class="message">{{ n.message }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      min-width: 300px;
      max-width: 420px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      transition: all 0.2s;
    }
    .toast:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    .icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content:center;
      font-size: 14px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .message {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
    }

    /* Types */
    .success { border-left: 4px solid #10b981; }
    .success .icon { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    
    .error { border-left: 4px solid #ef4444; }
    .error .icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    
    .warning { border-left: 4px solid #f59e0b; }
    .warning .icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    
    .info { border-left: 4px solid var(--accent); }
    .info .icon { background: var(--accent-glow); color: var(--accent); }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastNotification {
  notificationService = inject(NotificationService);
}
