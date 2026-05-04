import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, CartItem } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { Transaction } from '../models/transaction.model';
import { PRODUCTS, CUSTOMERS, COUPONS } from '../models/mock-data';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class POSService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  products = signal<Product[]>(PRODUCTS);
  customers = signal<Customer[]>(CUSTOMERS);
  cart = signal<CartItem[]>([]);
  heldTxs = signal<any[]>([]);
  selectedItemIdx = signal<number>(-1);
  numBuffer = signal<string>('');
  couponCode = signal<string>('');
  currentCustomer = signal<Customer | null>(null);
  txCounter = signal<number>(1);
  sessionRevenue = signal<number>(0);
  sessionTxCount = signal<number>(0);
  lastTx = signal<Transaction | null>(null);
  recentScanned = signal<Product[]>([]);


  subtotal = computed(() => {
    return this.cart().reduce((s, i) => s + (i.price * i.qty) - i.discount, 0);
  });

  itemTotalDiscount = computed(() => {
    return this.cart().reduce((s, i) => s + i.discount, 0);
  });

  couponDiscount = computed(() => {
    const code = this.couponCode();
    if (!code) return 0;
    const c = COUPONS[code];
    if (!c) return 0;
    const sub = this.cart().reduce((s, i) => s + (i.price * i.qty), 0);
    return c.type === 'pct' ? sub * (c.val / 100) : Math.min(c.val, sub);
  });

  totalDiscount = computed(() => this.itemTotalDiscount() + this.couponDiscount());

  taxableAmount = computed(() => {
    const taxableItemsSub = this.cart()
      .filter(i => i.tax > 0)
      .reduce((s, i) => s + (i.price * i.qty) - i.discount, 0);
    return Math.max(0, taxableItemsSub - this.couponDiscount());
  });

  vat = computed(() => this.taxableAmount() * 0.075);

  grandTotal = computed(() => {
    const afterCoupon = Math.max(0, this.subtotal() - this.couponDiscount());
    return afterCoupon + this.vat();
  });

  constructor() {
    this.fetchInitialData();
  }

  async fetchInitialData() {
    try {
      const prods = await firstValueFrom(this.api.get<any>('/api/products'));
      if (prods && Array.isArray(prods)) this.products.set(prods);

      const custs = await firstValueFrom(this.api.get<any>('/api/customers'));
      if (custs && Array.isArray(custs)) this.customers.set(custs);
    } catch (error) {
      console.warn('Could not fetch real data, using mocks', error);
    }
  }

  addToCart(productId: number, overrideQty?: number) {
    const p = this.products().find(x => x.id === productId);
    if (!p) return;

    const qty = overrideQty || (this.numBuffer() ? parseInt(this.numBuffer()) : 1);
    this.numBuffer.set('');

    this.cart.update(prev => {
      const existing = prev.find(i => i.id === productId);
      if (existing) {
        existing.qty += qty;
        return [...prev];
      } else {
        return [...prev, { ...p, qty, discount: 0 }];
      }
    });

    this.selectedItemIdx.set(this.cart().length - 1);
  }

  processBarcode(barcode: string): Product | null {
    const p = this.products().find(x => x.barcode === barcode || x.sku.toLowerCase() === barcode.toLowerCase());
    if (p) {
      this.addToCart(p.id);
      this.addToRecentScanned(p);
      return p;
    }
    return null;
  }

  addToRecentScanned(p: Product) {
    this.recentScanned.update(prev => {
      const filtered = prev.filter(x => x.id !== p.id);
      return [p, ...filtered].slice(0, 5);
    });
  }


  removeItem(idx: number) {
    this.cart.update(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
    if (this.selectedItemIdx() >= this.cart().length) {
      this.selectedItemIdx.set(this.cart().length - 1);
    }
  }

  clearCart() {
    this.cart.set([]);
    this.couponCode.set('');
    this.currentCustomer.set(null);
    this.selectedItemIdx.set(-1);
    this.numBuffer.set('');
  }

  applyCoupon(code: string): boolean {
    if (COUPONS[code.toUpperCase()]) {
      this.couponCode.set(code.toUpperCase());
      return true;
    }
    return false;
  }

  assignCustomer(id: number) {
    const c = this.customers().find(cust => cust.id === id);
    if (c) this.currentCustomer.set(c);
  }

  holdTransaction() {
    if (this.cart().length === 0) return;
    const held = {
      id: `HOLD-${Date.now()}`,
      items: [...this.cart()],
      customer: this.currentCustomer(),
      couponCode: this.couponCode(),
      txNum: `LG01-${String(this.txCounter()).padStart(3, '0')}`
    };
    this.heldTxs.update(h => [...h, held]);
    this.clearCart();
  }

  recallHeld(idx: number) {
    const h = this.heldTxs()[idx];
    this.cart.set(h.items);
    this.currentCustomer.set(h.customer);
    this.couponCode.set(h.couponCode);
    this.heldTxs.update(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  async processPayment(method: any, tendered: number) {
    const staff = this.auth.currentStaff();
    if (!staff) return;

    const tx: Transaction = {
      txNum: `LG01-${String(this.txCounter()).padStart(3, '0')}`,
      items: [...this.cart()],
      customer: this.currentCustomer(),
      staff: staff,
      subtotal: this.subtotal(),
      couponDisc: this.couponDiscount(),
      vat: this.vat(),
      grand: this.grandTotal(),
      tender: tendered,
      change: Math.max(0, tendered - this.grandTotal()),
      method: method,
      date: new Date()
    };

    // Send to API
    try {
      await firstValueFrom(this.api.post('/api/transactions', tx));
    } catch (error) {
      console.error('Failed to sync transaction to cloud', error);
    }

    this.lastTx.set(tx);
    this.sessionRevenue.update(s => s + tx.grand);
    this.sessionTxCount.update(s => s + 1);
    this.txCounter.update(c => c + 1);
  }
}
