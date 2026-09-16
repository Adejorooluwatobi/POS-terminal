import { Staff } from './staff.model';
import { Product } from './product.model';
import { Customer } from './customer.model';

export const STAFF_LIST: Staff[] = [
  { id:'EMP-001', name:'Gold Adejoro',  initials:'GA', role:'MANAGER',    pin:'1234', store:'VI Store', color:'#00c2ff' },
  { id:'EMP-002', name:'Sola Fashola',  initials:'SF', role:'CASHIER',    pin:'1234', store:'VI Store', color:'#00d68f' },
  { id:'EMP-003', name:'Bola Adekunle', initials:'BA', role:'CASHIER',    pin:'1234', store:'VI Store', color:'#f5a623' },
  { id:'EMP-004', name:'Temi Oladipo',  initials:'TO', role:'SUPERVISOR', pin:'1234', store:'VI Store', color:'#a78bfa' },
];

export const PRODUCTS: Product[] = [];

export const CUSTOMERS: Customer[] = [];

export const COUPONS: Record<string, { type: 'pct' | 'fixed', val: number }> = {
  'SAVE10':{ type:'pct', val:10 },
  'SAVE500':{ type:'fixed', val:500 },
  'FLAT20':{ type:'pct', val:20 }
};
