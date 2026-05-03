import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { FloatSetup } from './pages/float-setup/float-setup';
import { POSTerminal } from './pages/pos-terminal/pos-terminal';
import { Pairing } from './pages/pairing/pairing';

export const routes: Routes = [
  { path: 'pairing', component: Pairing },
  { path: 'login', component: Login },
  { path: 'float-setup', component: FloatSetup },
  { path: 'pos-terminal', component: POSTerminal },
  { path: '', redirectTo: 'pairing', pathMatch: 'full' },
  { path: '**', redirectTo: '/pairing' }
];
