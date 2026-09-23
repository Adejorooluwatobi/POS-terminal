import { Component, inject, signal, computed, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TerminalService } from '../../services/terminal.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-pairing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pairing.html',
  styleUrl: './pairing.css',
})
export class Pairing implements AfterViewInit {
  terminalService = inject(TerminalService);
  themeService = inject(ThemeService);
  router = inject(Router);

  @ViewChild('tokenInput') tokenInput?: ElementRef<HTMLInputElement>;

  pairingCode = signal<string>('');
  error = signal<string>('');
  isSubmitting = signal<boolean>(false);

  storeName = computed(() => (localStorage.getItem('store_name') || localStorage.getItem('business_name') || 'RETAILOS STORE').toUpperCase());
  terminalHwId = computed(() => {
    const tid = localStorage.getItem('terminal_id');
    return tid ? `HW-ID: TRM-${tid.substring(0, 8).toUpperCase()}` : 'HW-ID: TRM-8842-AX9';
  });

  ngAfterViewInit() {
    setTimeout(() => this.focusHiddenInput(), 200);
  }

  focusHiddenInput() {
    if (this.tokenInput && this.tokenInput.nativeElement) {
      this.tokenInput.nativeElement.focus();
    }
  }

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      const clean = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      this.pairingCode.set(clean);
      input.value = clean;
      this.error.set('');
      if (clean.length === 6) {
        this.attemptPairing();
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // If typing in any other input or textarea, let default process
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && target.id !== 'hiddenTokenInput') {
      return;
    }

    if (event.key >= '0' && event.key <= '9') {
      this.inputDigit(event.key);
      event.preventDefault();
    } else if (event.key === 'Backspace') {
      this.backspace();
      event.preventDefault();
    } else if (event.key === 'Escape' || event.key === 'Delete') {
      this.clearCode();
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (this.pairingCode().length === 6 && !this.isSubmitting()) {
        this.attemptPairing();
      }
      event.preventDefault();
    }
  }

  inputDigit(d: string) {
    if (this.pairingCode().length >= 6) return;
    this.pairingCode.update(c => c + d);
    this.error.set('');

    if (this.tokenInput && this.tokenInput.nativeElement) {
      this.tokenInput.nativeElement.value = this.pairingCode();
    }

    if (this.pairingCode().length === 6) {
      this.attemptPairing();
    }
  }

  clearCode() {
    this.pairingCode.set('');
    this.error.set('');
    if (this.tokenInput && this.tokenInput.nativeElement) {
      this.tokenInput.nativeElement.value = '';
      this.tokenInput.nativeElement.focus();
    }
  }

  backspace() {
    this.pairingCode.update(c => c.slice(0, -1));
    this.error.set('');
    if (this.tokenInput && this.tokenInput.nativeElement) {
      this.tokenInput.nativeElement.value = this.pairingCode();
    }
  }

  async pasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
      if (clean) {
        this.pairingCode.set(clean);
        if (this.tokenInput && this.tokenInput.nativeElement) {
          this.tokenInput.nativeElement.value = clean;
        }
        if (clean.length === 6) {
          this.attemptPairing();
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  }

  async attemptPairing() {
    if (this.pairingCode().length < 6) {
      this.error.set('Please enter a 6-digit activation token.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set('');

    const res = await this.terminalService.pair(this.pairingCode());

    if (res.success) {
      this.router.navigate(['/login']);
    } else {
      this.error.set(res.message || 'Invalid pairing token. Please verify in Admin Portal.');
      this.pairingCode.set('');
      if (this.tokenInput && this.tokenInput.nativeElement) {
        this.tokenInput.nativeElement.value = '';
        this.tokenInput.nativeElement.focus();
      }
      this.isSubmitting.set(false);
    }
  }
}
