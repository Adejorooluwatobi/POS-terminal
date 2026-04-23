import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  auth = inject(AuthService);
  themeService = inject(ThemeService);

  navItems = [
    { id: 'pos', label: 'Terminal', icon: 'monitor', route: '/pos-terminal' },
    { id: 'history', label: 'History', icon: 'history', route: '/transactions' },
    { id: 'customers', label: 'Customers', icon: 'users', route: '/customers' },
    { id: 'inventory', label: 'Inventory', icon: 'box', route: '/inventory' },
    { id: 'reports', label: 'Reports', icon: 'chart', route: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.auth.logout();
      window.location.reload();
    }
  }
}
