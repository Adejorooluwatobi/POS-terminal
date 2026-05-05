import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  getProducts(): Observable<Product[]> {
    return this.api.get<any>('/api/products').pipe(
      map(res => {
        const items = res.items || res.data || res;
        return Array.isArray(items) 
          ? items.map(this.mapDtoToProduct).filter((p): p is Product => p !== null)
          : [];
      })
    );
  }

  getProductById(id: number | string): Observable<Product> {
    return this.api.get<any>(`/api/products/${id}`).pipe(
      map(dto => {
        const mapped = this.mapDtoToProduct(dto);
        if (!mapped) throw new Error('Product not available for this store');
        return mapped;
      })
    );
  }

  getProductByBarcode(barcode: string): Observable<Product> {
    return this.api.get<any>(`/api/products/barcode/${barcode}`).pipe(
      map(dto => {
        const mapped = this.mapDtoToProduct(dto);
        if (!mapped) throw new Error('Product not available for this store');
        return mapped;
      })
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/api/products', product);
  }

  updateProduct(id: number | string, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/api/products/${id}`, product);
  }

  deleteProduct(id: number | string): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  private mapDtoToProduct = (dto: any): Product | null => {
    const currentStoreId = this.auth.currentStaff()?.store;
    
    // Filter out products registered strictly to a different store
    if (dto.storeId && dto.storeId !== currentStoreId) {
      return null;
    }

    // Check for store price overrides
    let finalPrice = dto.basePrice !== undefined ? dto.basePrice : dto.price;
    if (dto.storeOverrides && Array.isArray(dto.storeOverrides)) {
      const override = dto.storeOverrides.find((o: any) => o.storeId === currentStoreId && o.isActive);
      if (override) {
        finalPrice = override.price;
      }
    }

    return {
      id: dto.id,
      name: dto.name,
      sku: dto.masterSku || dto.sku || '',
      barcode: dto.barcodes && dto.barcodes.length > 0 ? dto.barcodes[0] : (dto.barcode || ''),
      cat: 'all',
      price: finalPrice,
      cost: dto.costPrice !== undefined ? dto.costPrice : dto.cost,
      emoji: '📦',
      tax: dto.taxRate !== undefined ? dto.taxRate : dto.tax
    };
  }
}
