export interface Product {
  id: string | number;
  variantId?: string; // backend UUID for the product variant, used in transactions
  name: string;
  sku: string;
  barcode: string;
  cat: string;
  price: number;
  cost: number;
  emoji: string;
  tax: number;
  rollPrice?: number;
  packPrice?: number;
  singlesPerRoll?: number;
  rollsPerPack?: number;
  singlesPerPack?: number;
}

export interface CartItem extends Product {
  qty: number;
  discount: number;
  unit: 'Single' | 'Roll' | 'Pack';
}
