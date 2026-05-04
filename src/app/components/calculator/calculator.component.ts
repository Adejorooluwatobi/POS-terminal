import { Component, signal, output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-wrap">
      <div class="modal glass" style="max-width: 300px;">
        <div class="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span class="text-sm font-bold">Calculator</span>
          <button (click)="close.emit()" class="btn btn-ghost btn-xs">✕</button>
        </div>
        
        <div class="p-4">
          <!-- Display -->
          <div class="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 mb-4 text-right">
            <div class="text-[10px] text-[var(--text3)] min-h-[14px]">{{ expression() }}</div>
            <div class="text-2xl font-bold mono truncate">{{ display() }}</div>
          </div>
          
          <!-- Keys -->
          <div class="grid grid-cols-4 gap-2">
            <button (click)="clear()" class="nk nk-special h-10">C</button>
            <button (click)="op('/')" class="nk nk-action h-10">/</button>
            <button (click)="op('*')" class="nk nk-action h-10">×</button>
            <button (click)="backspace()" class="nk nk-special h-10">⌫</button>
            
            <button (click)="digit('7')" class="nk h-10">7</button>
            <button (click)="digit('8')" class="nk h-10">8</button>
            <button (click)="digit('9')" class="nk h-10">9</button>
            <button (click)="op('-')" class="nk nk-action h-10">−</button>
            
            <button (click)="digit('4')" class="nk h-10">4</button>
            <button (click)="digit('5')" class="nk h-10">5</button>
            <button (click)="digit('6')" class="nk h-10">6</button>
            <button (click)="op('+')" class="nk nk-action h-10">+</button>
            
            <button (click)="digit('1')" class="nk h-10">1</button>
            <button (click)="digit('2')" class="nk h-10">2</button>
            <button (click)="digit('3')" class="nk h-10">3</button>
            <button (click)="calculate()" class="nk nk-action h-22 row-span-2">=</button>
            
            <button (click)="digit('0')" class="nk h-10 col-span-2">0</button>
            <button (click)="digit('.')" class="nk h-10">.</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .row-span-2 { grid-row: span 2 / span 2; height: 100% !important; }
  `]
})
export class CalculatorComponent {
  @Input() isOpen = false;
  display = signal('0');
  expression = signal('');
  
  close = output<void>();

  digit(d: string) {
    if (this.display() === '0') this.display.set(d);
    else this.display.update(v => v + d);
  }

  op(o: string) {
    this.expression.set(this.display() + ' ' + o);
    this.display.set('0');
  }

  clear() {
    this.display.set('0');
    this.expression.set('');
  }

  backspace() {
    if (this.display().length <= 1) this.display.set('0');
    else this.display.update(v => v.slice(0, -1));
  }

  calculate() {
    if (!this.expression()) return;
    const [num1, op] = this.expression().split(' ');
    const n1 = parseFloat(num1);
    const n2 = parseFloat(this.display());
    let res = 0;
    
    switch(op) {
      case '+': res = n1 + n2; break;
      case '-': res = n1 - n2; break;
      case '*': res = n1 * n2; break;
      case '/': res = n2 !== 0 ? n1 / n2 : 0; break;
    }
    
    this.display.set(res.toString());
    this.expression.set('');
  }
}
