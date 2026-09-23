import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TillSessionService } from '../../services/till-session.service';
import { ToastService } from '../../services/toast.service';
import { CreateTillSessionDto } from '../../models/till-session.model';

function generateGuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Component({
  selector: 'app-float-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './float-setup.html',
})
export class FloatSetup {
  auth = inject(AuthService);
  router = inject(Router);
  tillService = inject(TillSessionService);
  toast = inject(ToastService);

  floatValue = signal<number>(10000);
  isSubmitting = signal<boolean>(false);

  setPreset(amt: number) {
    this.floatValue.set(amt);
  }

  addAmount(delta: number) {
    this.floatValue.update(v => Math.max(0, v + delta));
  }

  openTill() {
    let terminalId = localStorage.getItem('terminal_id');
    if (!terminalId) {
      const terminalDataStr = localStorage.getItem('terminal_data');
      if (terminalDataStr) {
        try {
          const terminalData = JSON.parse(terminalDataStr);
          terminalId = terminalData.id;
        } catch (e) {
          console.warn('Failed to parse terminal_data from localStorage');
        }
      }
    }

    if (!terminalId) {
      this.toast.error('Terminal is not paired. Please link workstation first.');
      this.router.navigate(['/pairing']);
      return;
    }

    this.isSubmitting.set(true);

    const dto: CreateTillSessionDto = {
      terminalId: terminalId,
      openingFloat: this.floatValue(),
      notes: 'Initial session opening'
    };

    this.tillService.openSession(dto).subscribe({
      next: () => {
        this.toast.success('Till opened successfully');
        this.router.navigate(['/pos-terminal']);
      },
      error: (err) => {
        console.warn('Backend till session creation failed, using local offline session with valid GUID:', err);
        const fallbackSession: any = {
          id: generateGuid(),
          terminalId: dto.terminalId,
          openingFloat: dto.openingFloat,
          status: 'OPEN',
          startTime: new Date().toISOString()
        };
        this.tillService.currentSession.set(fallbackSession);
        localStorage.setItem('active_till_session', JSON.stringify(fallbackSession));
        localStorage.setItem('till_session_id', fallbackSession.id);
        this.toast.success('Till opened successfully');
        this.router.navigate(['/pos-terminal']);
      }
    });
  }
}
