import { Injectable, inject, signal } from '@angular/core';
import { POSService } from './pos.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {
  private pos = inject(POSService);
  private toast = inject(ToastService);

  private buffer = '';
  private lastKeyTime = 0;
  private threshold = 50; // ms between keys to consider it a scanner
  
  isScanning = signal(false);

  private listener = (e: KeyboardEvent) => this.handleGlobalKey(e);

  init() {
    window.addEventListener('keydown', this.listener);
  }

  destroy() {
    window.removeEventListener('keydown', this.listener);
  }

  private handleGlobalKey(e: KeyboardEvent) {
    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

    const now = Date.now();
    const diff = now - this.lastKeyTime;
    this.lastKeyTime = now;

    // Check if we are in an input field
    const active = document.activeElement;
    const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    
    // Scanners usually end with 'Enter'
    if (e.key === 'Enter') {
      if (this.buffer.length > 2) {
        // If the buffer was filled quickly, or we weren't in an input, process it
        this.processBuffer();
        this.buffer = '';
        this.isScanning.set(false);
        
        // Prevent Enter from triggering other things if we processed a barcode
        e.preventDefault();
        e.stopPropagation();
      } else {
        this.buffer = '';
      }
      return;
    }

    // Only buffer printable characters (length 1)
    if (e.key.length === 1) {
      // If it's fast OR not in an input, it's likely a scanner
      if (diff < this.threshold || !isInput) {
        this.buffer += e.key;
        this.isScanning.set(true);
        
        // If it's fast and we are in an input, prevent the character from appearing in the input
        // to avoid "barcode garbage" in a focused text field.
        if (diff < this.threshold && isInput) {
          e.preventDefault();
        }
      } else {
        // Slow typing in an input - clear buffer, it's a human
        this.buffer = '';
        this.isScanning.set(false);
      }
    }
  }

  private async processBuffer() {
    const barcode = this.buffer.trim();
    if (!barcode) return;

    const p = await this.pos.processBarcode(barcode);
    if (p) {
      this.toast.success(`Scanned: ${p.name}`);
      this.playBeep();
    } else {
      this.toast.error(`Barcode not found: ${barcode}`);
    }
  }

  private playBeep() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); // 100ms
    } catch (e) {
      console.warn('Audio beep failed', e);
    }
  }
}
