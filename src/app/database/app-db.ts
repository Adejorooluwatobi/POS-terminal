import Dexie, { Table } from 'dexie';

export interface OfflineTransaction {
  id: string; // GUID
  receiptNumber: string;
  sessionId: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  changeGiven: number;
  createdAt: string; // ISO Date string
  completedAt?: string;
  items: OfflineTransactionItem[];
  payments: OfflinePayment[];
  synced?: boolean;
  voidRefId?: string;
  status?: number; // 1 = Completed, 2 = Refunded/Voided
}

export interface OfflineTransactionItem {
  id: string;
  variantId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface OfflinePayment {
  id: string;
  method: number;
  amount: number;
  status: number;
  gatewayRef?: string;
  amountTendered?: number;
  changeGiven?: number;
  processedAt?: string;
}

export class AppDB extends Dexie {
  offlineTransactions!: Table<OfflineTransaction, string>;
  products!: Table<any, any>;
  customers!: Table<any, any>;

  constructor() {
    super('pos-terminal-db');
    
    this.version(1).stores({
      offlineTransactions: 'id, createdAt' // Primary key and indexed props
    });

    this.version(2).stores({
      offlineTransactions: 'id, createdAt, synced, cashierId, sessionId, [cashierId+sessionId]'
    });

    this.version(3).stores({
      offlineTransactions: 'id, createdAt, synced, cashierId, sessionId, [cashierId+sessionId]',
      products: 'id, barcode, sku',
      customers: 'id, phone, loyalty'
    });
  }
}

export const db = new AppDB();
