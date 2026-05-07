import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-browser.html',
  styleUrl: './product-browser.css',
})
export class ProductBrowser {
  pos = inject(POSService);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  
  categories = [
    { id: 'all', name: 'All' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'household', name: 'Household' },
    { id: 'personal', name: 'Personal Care' },
  ];

  filteredProducts = computed(() => {
    let list = this.pos.products();
    const query = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();

    if (cat !== 'all') {
      list = list.filter(p => p.cat === cat);
    }

    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );
    }

    return list;
  });

  unitSelectionProduct = signal<Product | null>(null);

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  filterCat(cat: string) {
    this.selectedCategory.set(cat);
  }

  onProductClick(p: Product) {
    if (p.rollPrice || p.packPrice) {
      this.unitSelectionProduct.set(p);
    } else {
      this.pos.addToCart(p.id, undefined, 'Single');
    }
  }

  selectUnitAndAdd(unit: 'Single' | 'Roll' | 'Pack') {
    const p = this.unitSelectionProduct();
    if (p) {
      this.pos.addToCart(p.id, undefined, unit);
      this.unitSelectionProduct.set(null);
    }
  }

  closeUnitSelection() {
    this.unitSelectionProduct.set(null);
  }
}
