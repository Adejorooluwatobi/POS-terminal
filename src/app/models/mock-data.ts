import { Staff } from './staff.model';
import { Product } from './product.model';
import { Customer } from './customer.model';

export const STAFF_LIST: Staff[] = [];

export const PRODUCTS: Product[] = [];

export const CUSTOMERS: Customer[] = [];

export const COUPONS: Record<string, { type: 'pct' | 'fixed', val: number }> = {};
