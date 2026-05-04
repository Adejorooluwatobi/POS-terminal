import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, CartItem } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { Transaction } from '../models/transaction.model';
// Mock data removed in favor of services
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { TransactionService } from './transaction.service';
import { CouponService, Coupon } from './coupon.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class POSService {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private transactionService = inject(TransactionService);
  private couponService = inject(CouponService);
  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]);
  cart = signal<CartItem[]>([]);
  heldTxs = signal<any[]>([]);
  selectedItemIdx = signal<number>(-1);
  numBuffer = signal<string>('');
  
  // Promotion State
  appliedPromo = signal<{code: string, amount: number, promotionId?: string} | null>(null);

  currentCustomer = signal<Customer | null>(null);
  txCounter = signal<number>(1);
  sessionRevenue = signal<number>(0);
  sessionTxCount = signal<number>(0);
  lastTx = signal<Transaction | null>(null);
  recentScanned = signal<Product[]>([]);
  customerName = computed(() => {
    const c = this.currentCustomer();
    if (!c || !c.name) return 'Walk-in';
    try {
      return c.name.split(' ')[0] || 'Walk-in';
    } catch (e) {
      return 'Walk-in';
    }
  });


  subtotal = computed(() => {
    return this.cart().reduce((s, i) => s + (i.price * i.qty) - i.discount, 0);
  });

  itemTotalDiscount = computed(() => {
    return this.cart().reduce((s, i) => s + i.discount, 0);
  });

  couponDiscount = computed(() => {
    const promo = this.appliedPromo();
    return promo ? promo.amount : 0;
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
    // Add a tiny delay to ensure the component tree is stable before signals start updating
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Fetch Products
      try {
        const prods = await firstValueFrom(this.productService.getProducts());
        if (prods && Array.isArray(prods)) this.products.set(prods);
      } catch (e) {
        console.warn('Failed to fetch products:', e);
      }

      // Fetch Customers
      try {
        const custs = await firstValueFrom(this.customerService.getCustomers());
        if (custs && Array.isArray(custs)) this.customers.set(custs);
      } catch (e) {
        console.warn('Failed to fetch customers:', e);
      }
    } catch (error) {
      console.error('General data fetch error:', error);
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

  async processBarcode(barcode: string): Promise<Product | null> {
    // 1. Try local cache first
    let p = this.products().find(x => x.barcode === barcode || x.sku.toLowerCase() === barcode.toLowerCase());
    
    if (!p) {
      // 2. Try API lookup by barcode
      try {
        p = await firstValueFrom(this.productService.getProductByBarcode(barcode));
      } catch (error) {
        console.warn('Barcode not found in API:', barcode);
      }
    }

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
    this.appliedPromo.set(null);
    this.currentCustomer.set(null);
    this.selectedItemIdx.set(-1);
    this.numBuffer.set('');
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
      appliedPromo: this.appliedPromo(),
      txNum: `LG01-${String(this.txCounter()).padStart(3, '0')}`
    };
    this.heldTxs.update(h => [...h, held]);
    this.clearCart();
  }

  recallHeld(idx: number) {
    const h = this.heldTxs()[idx];
    this.cart.set(h.items);
    this.currentCustomer.set(h.customer);
    this.appliedPromo.set(h.appliedPromo);
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
      promotionId: this.appliedPromo()?.promotionId,
      date: new Date()
    };

    // Send to API
    try {
      await firstValueFrom(this.transactionService.createTransaction(tx));
    } catch (error) {
      console.error('Failed to sync transaction to cloud', error);
    }

    this.lastTx.set(tx);
    this.sessionRevenue.update(s => s + tx.grand);
    this.sessionTxCount.update(s => s + 1);
    this.txCounter.update(c => c + 1);
  }
}
