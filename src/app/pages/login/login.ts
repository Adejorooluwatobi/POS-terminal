import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  router = inject(Router);

  pin = signal<string>('');
  
  pinInput(d: string) {
    if (!this.auth.selectedStaffId()) return;
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

  attemptLogin() {
    if (this.auth.login(this.pin())) {
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
