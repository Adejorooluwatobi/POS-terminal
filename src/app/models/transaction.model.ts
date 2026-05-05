import { Staff } from './staff.model';
import { Customer } from './customer.model';
import { CartItem } from './product.model';

export interface Transaction {
  txNum: string;
  items: CartItem[];
  customer: Customer | null;
  staff: Staff;
  storeId?: string;
  subtotal: number;
  couponDisc: number;
  giftCardDisc?: number;
  vat: number;
  grand: number;
  tender: number;
  change: number;
  method: 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT' | 'GIFTCARD';
  promotionId?: string;
  redeemedGiftCards?: any[];
  date: Date;
}
