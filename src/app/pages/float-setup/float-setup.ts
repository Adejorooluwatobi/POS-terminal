import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  floatValue = signal<number>(10000);

  openTill() {
    this.router.navigate(['/pos-terminal']);
  }
}
