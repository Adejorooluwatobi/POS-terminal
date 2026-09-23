import { Component, inject, signal, computed, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
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
export class Login implements OnInit {
  auth = inject(AuthService);
  terminalService = inject(TerminalService);
  themeService = inject(ThemeService);
  router = inject(Router);

  @ViewChild('empInputRef') empInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('pinInputRef') pinInputRef?: ElementRef<HTMLInputElement>;

  pin = signal<string>('');
  employeeNo = signal<string>('');
  error = signal<string>('');
  isLoading = signal<boolean>(false);

  storeId = computed(() => (this.terminalService.pairedTerminal() as any)?.storeId || localStorage.getItem('store_id') || '');
  storeName = computed(() => (this.terminalService.pairedTerminal() as any)?.name || (this.terminalService.pairedTerminal() as any)?.storeName || localStorage.getItem('store_name') || localStorage.getItem('business_name') || 'Main Store');
  terminalCode = computed(() => (this.terminalService.pairedTerminal() as any)?.code || (this.terminalService.pairedTerminal() as any)?.terminalCode || localStorage.getItem('terminal_code') || 'READY');

  isInputReady = computed(() => !!this.employeeNo().trim());

  ngOnInit() {
    // If workstation has not been paired to a store yet, redirect to pairing protocol
    if (!this.terminalService.isPaired() || !this.storeId()) {
      this.router.navigate(['/pairing']);
    }
  }

  focusPinInput() {
    if (this.pinInputRef && this.pinInputRef.nativeElement) {
      this.pinInputRef.nativeElement.focus();
    }
  }

  onEmployeeEnter() {
    if (this.isInputReady()) {
      this.focusPinInput();
    }
  }

  onPinInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      const clean = input.value.replace(/[^0-9]/g, '').slice(0, 4);
      this.pin.set(clean);
      input.value = clean;
      this.error.set('');
      if (clean.length === 4) {
        setTimeout(() => this.attemptLogin(), 150);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isEmpInput = target && target.id === 'employeeNoInput';

    if (isEmpInput) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.onEmployeeEnter();
      }
      return;
    }

    if (event.key >= '0' && event.key <= '9') {
      if (this.isInputReady()) {
        this.pinInput(event.key);
        event.preventDefault();
      }
    } else if (event.key === 'Backspace') {
      if (this.isInputReady()) {
        this.pinBackspace();
        event.preventDefault();
      }
    } else if (event.key === 'Escape' || event.key === 'Delete') {
      if (this.isInputReady()) {
        this.pinClear();
        event.preventDefault();
      }
    } else if (event.key === 'Enter') {
      if (this.isInputReady() && this.pin().length === 4 && !this.isLoading()) {
        this.attemptLogin();
        event.preventDefault();
      }
    }
  }
  
  pinInput(d: string) {
    if (!this.isInputReady()) return;
    if (this.pin().length >= 4) return;
    this.pin.update(p => p + d);
    this.error.set('');

    if (this.pinInputRef && this.pinInputRef.nativeElement) {
      this.pinInputRef.nativeElement.value = this.pin();
    }
    
    if (this.pin().length === 4) {
      setTimeout(() => this.attemptLogin(), 150);
    }
  }

  pinBackspace() {
    this.pin.update(p => p.slice(0, -1));
    this.error.set('');
    if (this.pinInputRef && this.pinInputRef.nativeElement) {
      this.pinInputRef.nativeElement.value = this.pin();
    }
  }

  pinClear() {
    this.pin.set('');
    this.error.set('');
    if (this.pinInputRef && this.pinInputRef.nativeElement) {
      this.pinInputRef.nativeElement.value = '';
    }
  }

  async attemptLogin() {
    if (!this.isInputReady() || this.pin().length < 4 || this.isLoading()) return;
    
    this.isLoading.set(true);
    this.error.set('');

    try {
      const res = await this.auth.login(this.pin(), this.employeeNo().trim(), this.storeId());
      if (res.success) {
        this.router.navigate(['/float-setup']);
      } else {
        this.error.set(res.message || 'Invalid Employee ID or PIN. Please try again.');
        this.pinClear();
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Login failed. Please check connection.');
      this.pinClear();
    } finally {
      this.isLoading.set(false);
    }
  }

  goToPairing() {
    this.terminalService.unpair();
    this.router.navigate(['/pairing']);
  }
}
