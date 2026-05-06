import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TillSessionService } from '../../services/till-session.service';
import { ToastService } from '../../services/toast.service';
import { CreateTillSessionDto, UpdateTillSessionDto } from '../../models/till-session.model';

@Component({
  selector: 'app-till-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './till-modal.html',
  styleUrl: './till-modal.css'
})
export class TillModalComponent {
  private tillService = inject(TillSessionService);
  private toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  session = this.tillService.currentSession;
  isOpening = signal<boolean>(false);
  isClosing = signal<boolean>(false);

  // Form Fields
  openingFloat = signal<number>(0);
  closingCash = signal<number>(0);
  notes = signal<string>('');

  ngOnInit() {
    if (!this.session()) {
      this.isOpening.set(true);
    } else {
      this.isClosing.set(true);
    }
  }

  async openTill() {
    if (this.openingFloat() < 0) {
      this.toast.error('Opening float cannot be negative');
      return;
    }

    let terminalId = localStorage.getItem('terminal_id');
    if (!terminalId) {
      const terminalDataStr = localStorage.getItem('terminal_data');
      if (terminalDataStr) {
        try {
          const terminalData = JSON.parse(terminalDataStr);
          terminalId = terminalData.id;
        } catch (e) {}
      }
    }

    const dto: CreateTillSessionDto = {
      terminalId: terminalId || '00000000-0000-0000-0000-000000000001',
      openingFloat: this.openingFloat(),
      notes: this.notes()
    };

    this.tillService.openSession(dto).subscribe({
      next: () => {
        this.toast.success('Till opened successfully');
        this.close.emit();
      },
      error: (err) => {
        this.toast.error('Failed to open till: ' + (err.error?.message || err.message));
      }
    });
  }

  async closeTill() {
    const session = this.session();
    if (!session) return;

    const dto: UpdateTillSessionDto = {
      closingCash: this.closingCash(),
      notes: this.notes()
    };

    this.tillService.closeSession(session.id, dto).subscribe({
      next: () => {
        this.toast.success('Till closed successfully');
        this.close.emit();
      },
      error: (err) => {
        this.toast.error('Failed to close till: ' + (err.error?.message || err.message));
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}
