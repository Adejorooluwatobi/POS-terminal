export interface Product {
  id: string | number;
  name: string;
  sku: string;
  barcode: string;
  cat: string;
  price: number;
  cost: number;
  emoji: string;
  tax: number;
}

export interface CartItem extends Product {
  qty: number;
  discount: number;
}
