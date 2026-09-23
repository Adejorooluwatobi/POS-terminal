import { Component, OnInit, OnDestroy, inject, signal, EventEmitter, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { POSService } from '../../services/pos.service';
import { ToastService } from '../../services/toast.service';
import { TillSessionService } from '../../services/till-session.service';
import { ScannerService } from '../../services/scanner.service';

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
  tillService = inject(TillSessionService);
  scanner = inject(ScannerService);
  private router = inject(Router);

  isScannerFocused = false;
  clock = signal<string>('--:--:--');
  private clockInterval: any;

  storeName = computed(() => this.auth.currentStaff()?.businessName || localStorage.getItem('store_name') || localStorage.getItem('business_name') || 'RetailOS');
  terminalCode = computed(() => localStorage.getItem('terminal_code') || 'LG-01-T3');
  staffName = computed(() => this.auth.currentStaff()?.name || 'Cashier');
  staffInitials = computed(() => this.auth.currentStaff()?.initials || 'FL');
  staffRole = computed(() => this.auth.currentStaff()?.role || 'Cashier');
  isTillOpen = computed(() => !!this.tillService.currentSession());

  @Output() clickSummary = new EventEmitter<void>();
  @Output() clickCalculator = new EventEmitter<void>();
  @Output() clickGiftCard = new EventEmitter<void>();
  @Output() clickTill = new EventEmitter<void>();
  @Output() clickHistory = new EventEmitter<void>();

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

  async handleScannerKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      const val = input.value.trim();
      if (val) {
        const p = await this.pos.processBarcode(val);
        if (p) {
          this.toast.success(`${p.name} added to cart`);
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
    if (confirm(`Close register and end shift for ${this.staffName()}?`)) {
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }

  openSessionSummary() {
    this.clickSummary.emit();
  }
}
