import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TerminalService } from '../../services/terminal.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  auth = inject(AuthService);
  terminalService = inject(TerminalService);
  themeService = inject(ThemeService);
  router = inject(Router);

  pin = signal<string>('');
  employeeNo = signal<string>('');

  storeId = computed(() => (this.terminalService.pairedTerminal() as any)?.storeId || localStorage.getItem('store_id') || '');
  storeName = computed(() => (this.terminalService.pairedTerminal() as any)?.name || localStorage.getItem('store_name') || 'Main Store');

  isInputReady = computed(() => !!this.employeeNo() && !!this.storeId());
  
  pinInput(d: string) {
    if (!this.isInputReady()) return;
    if (this.pin().length >= 4) return;
    this.pin.update(p => p + d);
    
    if (this.pin().length === 4) {
      setTimeout(() => this.attemptLogin(), 200);
    }
  }

  pinBackspace() {
    this.pin.update(p => p.slice(0, -1));
  }

  pinClear() {
    this.pin.set('');
  }

  async attemptLogin() {
    if (!this.isInputReady()) return;
    const success = await this.auth.login(this.pin(), this.employeeNo(), this.storeId());
    if (success) {
      this.router.navigate(['/float-setup']);
    } else {
      // Handle error (e.g., shake animation or toast)
      this.pinClear();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
