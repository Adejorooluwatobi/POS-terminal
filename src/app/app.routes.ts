import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { FloatSetup } from './pages/float-setup/float-setup';
import { POSTerminal } from './pages/pos-terminal/pos-terminal';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'float-setup', component: FloatSetup },
  { path: 'pos-terminal', component: POSTerminal },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
