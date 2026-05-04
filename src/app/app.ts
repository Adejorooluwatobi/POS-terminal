import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { TerminalService } from './services/terminal.service';
import { AuthService } from './services/auth.service';
import { ToastNotification } from './components/toast-notification/toast-notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastNotification],
  template: `
    <router-outlet></router-outlet>
    <app-toast-notification></app-toast-notification>
  `,
  styles: []
})
export class App implements OnInit {
  private _theme = inject(ThemeService);
  private terminal = inject(TerminalService);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.terminal.isPaired()) {
      this.router.navigate(['/pairing']);
      return;
    }

    if (this.auth.currentStaff()) {
      this.router.navigate(['/pos-terminal']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
