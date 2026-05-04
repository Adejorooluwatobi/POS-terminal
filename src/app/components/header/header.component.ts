import { Component, OnInit, OnDestroy, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  pos = inject(POSService);
  toast = inject(ToastService);

  isScannerFocused = false;
  clock = signal<string>('--:--:--');
  private clockInterval: any;

  @Output() clickSummary = new EventEmitter<void>();
  @Output() clickCalculator = new EventEmitter<void>();

  ngOnInit() {
    this.startClock();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  startClock() {
    const tick = () => {
      this.clock.set(new Date().toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    tick();
    this.clockInterval = setInterval(tick, 1000);
  }

  handleScannerKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      const val = input.value.trim();
      if (val) {
        const p = this.pos.processBarcode(val);
        if (p) {
          this.toast.success(`${p.emoji} ${p.name}`);
        } else {
          this.toast.error(`No product found: ${val}`);
        }
      }
      input.value = '';
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  confirmLogout() {
    if (confirm(`Close till and end shift for ${this.auth.currentStaff()?.name}?`)) {
      location.reload();
    }
  }

  openSessionSummary() {
    this.clickSummary.emit();
  }
}
