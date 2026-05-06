import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TillSessionService } from '../../services/till-session.service';
import { ToastService } from '../../services/toast.service';
import { CreateTillSessionDto } from '../../models/till-session.model';

@Component({
  selector: 'app-float-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './float-setup.html',
  styleUrl: './float-setup.css',
})
export class FloatSetup {
  auth = inject(AuthService);
  router = inject(Router);
  tillService = inject(TillSessionService);
  toast = inject(ToastService);

  floatValue = signal<number>(10000);

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

    const dto: CreateTillSessionDto = {
      terminalId: terminalId || '00000000-0000-0000-0000-000000000001',
      openingFloat: this.floatValue(),
      notes: 'Initial session opening'
    };

    this.tillService.openSession(dto).subscribe({
      next: () => {
        this.toast.success('Till opened successfully');
        this.router.navigate(['/pos-terminal']);
      },
      error: (err) => {
        this.toast.error('Failed to open till: ' + (err.error?.message || err.message));
      }
    });
  }
}
