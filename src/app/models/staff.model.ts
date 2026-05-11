export interface Staff {
  id: string;
  name: string;
  initials: string;
  role: 'MANAGER' | 'CASHIER' | 'SUPERVISOR';
  pin: string;
  store: string;
  color: string;
  businessName?: string;
}
