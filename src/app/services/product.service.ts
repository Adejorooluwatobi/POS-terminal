import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  getProducts(): Observable<Product[]> {
    return this.api.get<Product[]>('/api/products');
  }

  getProductById(id: number): Observable<Product> {
    return this.api.get<Product>(`/api/products/${id}`);
  }

  getProductByBarcode(barcode: string): Observable<Product> {
    return this.api.get<Product>(`/api/products/barcode/${barcode}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/api/products', product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/api/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }
}
