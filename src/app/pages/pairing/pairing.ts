import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TerminalService } from '../../services/terminal.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-pairing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pairing.html',
  styleUrl: './pairing.css',
})
export class Pairing {
  terminalService = inject(TerminalService);
  themeService = inject(ThemeService);
  router = inject(Router);

  pairingCode = signal<string>('');
  error = signal<string>('');
  isSubmitting = signal<boolean>(false);

  inputDigit(d: string) {
    if (this.pairingCode().length >= 6) return;
    this.pairingCode.update(c => c + d);
    
    if (this.pairingCode().length === 6) {
      this.attemptPairing();
    }
  }

  backspace() {
    this.pairingCode.update(c => c.slice(0, -1));
    this.error.set('');
  }

  async attemptPairing() {
    this.isSubmitting.set(true);
    this.error.set('');
    
    const success = await this.terminalService.pair(this.pairingCode());
    
    if (success) {
      this.router.navigate(['/login']);
    } else {
      this.error.set('Invalid pairing code. Please check the Admin Portal.');
      this.pairingCode.set('');
      this.isSubmitting.set(false);
    }
  }
}
