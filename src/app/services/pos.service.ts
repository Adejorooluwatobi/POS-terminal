import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, CartItem } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { Transaction } from '../models/transaction.model';
import { PRODUCTS, CUSTOMERS } from '../models/mock-data';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { TransactionService } from './transaction.service';
import { CouponService, Coupon } from './coupon.service';
import { OfflineTransactionService } from './offline-transaction.service';
import { SyncService } from './sync.service';
import { ToastService } from './toast.service';
import { StoreService } from './store.service';
import { TerminalService } from './terminal.service';
import { db } from '../database/app-db';
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
  private offlineDb = inject(OfflineTransactionService);
  private syncService = inject(SyncService);
  private toast = inject(ToastService);
  private storeService = inject(StoreService);
  private terminalService = inject(TerminalService);
  products = signal<Product[]>(PRODUCTS);
  customers = signal<Customer[]>(CUSTOMERS);
  cart = signal<CartItem[]>([]);
  heldTxs = signal<any[]>([]);
  selectedItemIdx = signal<number>(-1);
  numBuffer = signal<string>('');
  
  // Promotion State
  appliedPromo = signal<{code: string, amount: number, promotionId?: string} | null>(null);
  redeemedGiftCards = signal<{cardNumber: string, amount: number}[]>([]);

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
  businessName = computed(() => this.auth.currentStaff()?.businessName || 'RETAILOS STORE');

  currentStore = computed(() => this.storeService.currentStore());

  storeName = computed(() => {
    return this.currentStore()?.name || 
           this.auth.currentStaff()?.storeName || 
           localStorage.getItem('store_name') || 
           (this.terminalService.pairedTerminal() as any)?.storeName || 
           '';
  });

  storeAddress = computed(() => {
    const store = this.currentStore();
    if (store && (store.address || store.city)) {
      const parts = [store.address, store.city, store.state].filter(Boolean);
      return parts.join(', ');
    }
    const staff = this.auth.currentStaff();
    if (staff && (staff.storeAddress || staff.storeCity)) {
      const parts = [staff.storeAddress, staff.storeCity].filter(Boolean);
      return parts.join(', ');
    }
    const localAddr = localStorage.getItem('store_address');
    if (localAddr) {
      const localCity = localStorage.getItem('store_city');
      return localCity ? `${localAddr}, ${localCity}` : localAddr;
    }
    const term = this.terminalService.pairedTerminal() as any;
    if (term && (term.storeAddress || term.storeCity)) {
      const parts = [term.storeAddress, term.storeCity].filter(Boolean);
      return parts.join(', ');
    }
    return '';
  });

  storePhone = computed(() => {
    return this.currentStore()?.phone || 
           this.auth.currentStaff()?.storePhone || 
           localStorage.getItem('store_phone') || 
           (this.terminalService.pairedTerminal() as any)?.storePhone || 
           '';
  });

  tenantEmail = computed(() => {
    return this.currentStore()?.tenantEmail || 
           this.auth.currentStaff()?.tenantEmail || 
           localStorage.getItem('tenant_email') || 
           (this.terminalService.pairedTerminal() as any)?.tenantEmail || 
           '';
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

  giftCardDiscount = computed(() => {
    return this.redeemedGiftCards().reduce((s, gc) => s + gc.amount, 0);
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

  amountDue = computed(() => {
    return Math.max(0, this.grandTotal() - this.giftCardDiscount());
  });

  constructor() {
    this.fetchInitialData();
    this.loadSessionStats();
  }

  async fetchInitialData() {
    // Add a tiny delay to ensure the component tree is stable before signals start updating
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Fetch Products
      try {
        if (navigator.onLine) {
          try {
            const prods = await firstValueFrom(this.productService.getProducts());
            if (prods && Array.isArray(prods) && prods.length > 0) {
              this.products.set(prods);
              await db.products.clear();
              await db.products.bulkPut(prods);
            }
          } catch (e) {
            console.warn('Failed to fetch products from API, loaded offline cache');
            const cached = await db.products.toArray();
            if (cached.length) this.products.set(cached);
            else this.products.set([]);
          }
        } else {
          const cached = await db.products.toArray();
          if (cached.length) this.products.set(cached);
          else this.products.set([]);
        }
      } catch (err) {
        console.error('Local DB products error', err);
      }

      // Fetch Customers
      try {
        if (navigator.onLine) {
          try {
            const custs = await firstValueFrom(this.customerService.getCustomers());
            if (custs && Array.isArray(custs) && custs.length > 0) {
              this.customers.set(custs);
              await db.customers.clear();
              await db.customers.bulkPut(custs);
            }
          } catch (e) {
            console.warn('Failed to fetch customers from API, loaded offline cache');
            const cached = await db.customers.toArray();
            if (cached.length) this.customers.set(cached);
            else this.customers.set([]);
          }
        } else {
          const cached = await db.customers.toArray();
          if (cached.length) this.customers.set(cached);
          else this.customers.set([]);
        }
      } catch (err) {
        console.error('Local DB customers error', err);
      }

      // Fetch Store Details
      try {
        const storeId = localStorage.getItem('store_id') || this.auth.currentStaff()?.store;
        if (storeId && navigator.onLine) {
          try {
            const storeData = await firstValueFrom(this.storeService.getStore(storeId));
            if (storeData) {
              this.storeService.setStore(storeData);
            }
          } catch (e) {
            console.warn('Could not fetch store from API, using cached store details');
          }
        }
      } catch (err) {
        console.error('Store details fetch error', err);
      }
    } catch (error) {
      console.error('General data fetch error:', error);
    }
  }

  async loadSessionStats() {
    const staff = this.auth.currentStaff();
    if (!staff) return;

    const isGuid = (val: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    let realCashierId = staff.id;
    if (!isGuid(realCashierId)) {
      const token = localStorage.getItem('pos_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub && isGuid(payload.sub)) realCashierId = payload.sub;
        } catch(e) {}
      }
    }
    const cashierId = isGuid(realCashierId) ? realCashierId : '00000000-0000-0000-0000-000000000000';

    try {
      let totalRevenue = 0;
      let count = 0;
      
      const todayStr = new Date().toISOString().split('T')[0];

      if (navigator.onLine) {
        try {
          const res = await firstValueFrom(this.transactionService.getTransactions(cashierId));
          const list = res.items || res || [];
          const todayBackendTxs = list.filter((t: any) => t.createdAt && t.createdAt.startsWith(todayStr));
          
          for (const tx of todayBackendTxs) {
            if (tx.status === 2) continue; // Ignore refunded parent transactions
            totalRevenue += tx.grandTotal;
            count++;
          }

          const localTxs = await this.offlineDb.getTodayTransactions(cashierId);
          for (const tx of localTxs) {
            if (tx.synced) continue; // Already counted from backend
            if (tx.status === 2) continue;
            totalRevenue += tx.grandTotal;
            count++;
          }

          this.sessionRevenue.set(totalRevenue);
          this.sessionTxCount.set(count);
          this.txCounter.set(Math.max(todayBackendTxs.length, localTxs.length) + 1);
          return;
        } catch (apiErr) {
          console.warn('Failed to fetch session stats from API, falling back to local DB', apiErr);
        }
      }

      // Offline Fallback
      const txs = await this.offlineDb.getTodayTransactions(cashierId);
      for (const tx of txs) {
        if (tx.status === 2) continue; // Fix double-subtraction bug
        totalRevenue += tx.grandTotal;
        count++;
      }
      this.sessionRevenue.set(totalRevenue);
      this.sessionTxCount.set(count);
      this.txCounter.set(txs.length + 1);
    } catch (e) {
      console.error('Failed to load session stats', e);
    }
  }

  setQty(idx: number, qty: number) {
    const validQty = Math.max(1, Math.floor(qty) || 1);
    this.cart.update(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], qty: validQty };
      }
      return next;
    });
  }

  updateQty(idx: number, delta: number) {
    this.cart.update(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], qty: Math.max(1, next[idx].qty + delta) };
      }
      return next;
    });
  }

  addToCart(productId: string | number, overrideQty?: number, unit: 'Single' | 'Roll' | 'Pack' = 'Single') {
    const p = this.products().find(x => x.id === productId);
    if (!p) return;

    const qty = overrideQty || (this.numBuffer() ? parseInt(this.numBuffer()) : 1);
    this.numBuffer.set('');

    // Determine price based on unit
    let price = p.price;
    if (unit === 'Roll' && p.rollPrice) price = p.rollPrice;
    if (unit === 'Pack' && p.packPrice) price = p.packPrice;

    let targetIdx = -1;
    this.cart.update(prev => {
      // Find item with same ID AND same unit
      const existingIdx = prev.findIndex(i => i.id === productId && i.unit === unit);
      if (existingIdx > -1) {
        prev[existingIdx].qty += qty;
        targetIdx = existingIdx;
        return [...prev];
      } else {
        targetIdx = prev.length;
        return [...prev, { ...p, price, qty, discount: 0, unit }];
      }
    });

    this.selectedItemIdx.set(targetIdx >= 0 ? targetIdx : this.cart().length - 1);
  }

  async processBarcode(barcode: string): Promise<Product | null> {
    // 1. Try local cache first
    let p = this.products().find(x => 
      x.barcode === barcode || 
      (x.barcodes && x.barcodes.includes(barcode)) || 
      x.sku.toLowerCase() === barcode.toLowerCase()
    );
    
    if (!p) {
      // 2. Try API lookup by barcode
      try {
        p = await firstValueFrom(this.productService.getProductByBarcode(barcode));
      } catch (error) {
        console.warn('Barcode not found in API:', barcode);
      }
    }

    if (p) {
      if (!this.products().find(x => x.id === p!.id)) {
        this.products.update(prev => [...prev, p!]);
        try {
          await db.products.put(p!);
        } catch (dbErr) {
          console.warn('Failed to cache scanned product', dbErr);
        }
      }
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
    this.redeemedGiftCards.set([]);
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
      txNum: `INV-${Date.now().toString(36).toUpperCase()}-${String(this.txCounter()).padStart(3, '0')}`
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

    const storeId = localStorage.getItem('store_id') || staff.store || '';
    const gcPaid = this.giftCardDiscount();
    const isGiftCardOnly = (gcPaid > 0 && this.amountDue() === 0) || method === 'GIFTCARD';
    const effectiveMethod = isGiftCardOnly ? 'GIFTCARD' : (gcPaid > 0 ? 'SPLIT' : method);
    const totalTendered = isGiftCardOnly ? gcPaid : (tendered + gcPaid);
    const computedChange = isGiftCardOnly ? 0 : Math.max(0, tendered - this.amountDue());

    const tx: Transaction = {
      txNum: `INV-${Date.now().toString(36).toUpperCase()}-${String(this.txCounter()).padStart(3, '0')}`,
      items: [...this.cart()],
      customer: this.currentCustomer(),
      staff: staff,
      storeId,
      subtotal: this.subtotal(),
      couponDisc: this.couponDiscount(),
      giftCardDisc: gcPaid,
      vat: this.vat(),
      grand: this.grandTotal(),
      tender: totalTendered,
      change: computedChange,
      method: effectiveMethod,
      promotionId: this.appliedPromo()?.promotionId,
      redeemedGiftCards: this.redeemedGiftCards(),
      date: new Date()
    };

    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const isGuid = (val: any) => {
      if (typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    };

    const sessionId = localStorage.getItem('till_session_id') || '00000000-0000-0000-0000-000000000000';
    const txStoreId = tx.storeId;
    
    // Extract real Guid from token if staff.id is corrupted (e.g. employeeNo was stored instead)
    let realCashierId = staff.id;
    if (!isGuid(realCashierId)) {
      const token = localStorage.getItem('pos_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub && isGuid(payload.sub)) realCashierId = payload.sub;
        } catch(e) {}
      }
    }
    const cashierId = isGuid(realCashierId) ? realCashierId : '00000000-0000-0000-0000-000000000000';
    const customerId = tx.customer && isGuid(tx.customer.id?.toString()) ? tx.customer.id.toString() : undefined;

    const paymentsList: any[] = [];
    if (gcPaid > 0) {
      paymentsList.push({
        id: generateUUID(),
        method: 4, // 4 = GiftCard
        amount: Math.min(gcPaid, tx.grand),
        amountTendered: gcPaid,
        changeGiven: 0,
        status: 1, // 1 = Approved
        processedAt: tx.date.toISOString()
      });
    }
    const cashCardAmount = Math.max(0, tx.grand - gcPaid);
    if (cashCardAmount > 0 || paymentsList.length === 0) {
      paymentsList.push({
        id: generateUUID(),
        method: method === 'CASH' ? 0 : 
                method === 'CARD' ? 1 : 
                method === 'MOBILE' ? 2 : 
                method === 'GIFTCARD' ? 4 : 
                method === 'SPLIT' ? 6 : 0,
        amount: cashCardAmount,
        amountTendered: isGiftCardOnly ? 0 : tendered,
        changeGiven: tx.change,
        status: 1,
        processedAt: tx.date.toISOString()
      });
    }

    // Create an OfflineTransaction formatted object
    const offlineTx = {
      id: generateUUID(),
      receiptNumber: tx.txNum,
      sessionId: isGuid(sessionId) ? sessionId : '00000000-0000-0000-0000-000000000000',
      storeId: isGuid(txStoreId) ? txStoreId : '00000000-0000-0000-0000-000000000000',
      cashierId: cashierId,
      customerId: customerId,
      subtotal: tx.subtotal || 0,
      discountTotal: tx.couponDisc || 0,
      taxTotal: tx.vat || 0,
      grandTotal: tx.grand || 0,
      amountPaid: totalTendered || 0,
      changeGiven: tx.change || 0,
      createdAt: tx.date.toISOString(),
      completedAt: tx.date.toISOString(),
      items: tx.items.map((i: any) => {
        let cf = 1;
        if (i.unit === 'Pack') cf = i.singlesPerPack || 1;
        if (i.unit === 'Roll') cf = i.singlesPerRoll || 1;
        
        return {
          id: generateUUID(),
          variantId: i.variantId ? i.variantId : (isGuid(i.id?.toString()) ? i.id.toString() : undefined),
          productName: i.name,
          quantity: i.qty,
          baseQuantity: (i.qty || 1) * cf,
          unitPrice: i.price,
          originalPrice: i.price,
          unitCost: i.cost || 0, // Fallback to 0 if no cost
          discountAmount: i.discount,
          taxRate: 7.5,
          taxAmount: i.tax,
          lineTotal: (i.price * i.qty) - i.discount
        };
      }),
      payments: paymentsList
    };

    // Save to Offline DB and attempt background sync
    try {
      await this.offlineDb.saveTransaction(offlineTx as any);
      
      // Show friendly offline or success message
      if (!navigator.onLine) {
        this.toast.info('Transaction queued securely! It will automatically sync when connection returns.');
      } else {
        this.toast.success('Transaction Completed!');
      }

      // Fire and forget sync attempt
      this.syncService.syncNow();
    } catch (error) {
      console.error('Offline DB save failed', error);
      this.toast.error('Failed to save transaction locally. Please check storage space.');
    }

    this.lastTx.set(tx);
    this.sessionRevenue.update(s => s + tx.grand);
    this.sessionTxCount.update(s => s + 1);
    this.txCounter.update(c => c + 1);
    this.clearCart();
  }
  async refundTransaction(originalTx: any) {
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const refundTx = {
      ...originalTx,
      id: generateUUID(),
      receiptNumber: `REF-${Date.now().toString(36).toUpperCase()}-${String(this.txCounter()).padStart(3, '0')}`,
      subtotal: -Math.abs(originalTx.subtotal),
      discountTotal: -Math.abs(originalTx.discountTotal),
      taxTotal: -Math.abs(originalTx.taxTotal),
      grandTotal: -Math.abs(originalTx.grandTotal),
      amountPaid: -Math.abs(originalTx.amountPaid),
      changeGiven: 0,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      voidRefId: originalTx.id,
      status: 1, // The refund itself is completed
      synced: false,
      items: originalTx.items.map((i: any) => ({
        ...i,
        id: generateUUID(),
        quantity: -Math.abs(i.quantity),
        discountAmount: -Math.abs(i.discountAmount),
        taxAmount: -Math.abs(i.taxAmount),
        lineTotal: -Math.abs(i.lineTotal)
      })),
      payments: originalTx.payments.map((p: any) => ({
        ...p,
        id: generateUUID(),
        amount: -Math.abs(p.amount),
        amountTendered: -Math.abs(p.amountTendered || p.amount),
        changeGiven: 0,
        processedAt: new Date().toISOString()
      }))
    };

    try {
      await this.offlineDb.saveTransaction(refundTx as any);
      if (!navigator.onLine) {
        this.toast.info('Refund queued securely!');
      } else {
        this.toast.success('Refund Completed!');
      }
      this.syncService.syncNow();
    } catch (error) {
      console.error('Refund save failed', error);
      this.toast.error('Failed to process refund locally.');
    }
    
    this.sessionRevenue.update(s => s - Math.abs(originalTx.grandTotal));
    this.sessionTxCount.update(s => s + 1);
    this.txCounter.update(c => c + 1);
  }
}
