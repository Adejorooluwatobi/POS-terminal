import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POSService } from '../../services/pos.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-browser.html',
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
  unitQty = signal<number>(1);

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  filterCat(cat: string) {
    this.selectedCategory.set(cat);
  }

  onProductClick(p: Product) {
    const defaultQty = this.pos.numBuffer() ? (parseInt(this.pos.numBuffer(), 10) || 1) : 1;
    this.unitQty.set(defaultQty);
    if (p.rollPrice || p.packPrice) {
      this.unitSelectionProduct.set(p);
    } else {
      this.pos.addToCart(p.id, defaultQty, 'Single');
    }
  }

  changeUnitQty(delta: number) {
    this.unitQty.update(q => Math.max(1, q + delta));
  }

  onUnitQtyChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '');
    let val = parseInt(clean, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    }
    input.value = val.toString();
    this.unitQty.set(val);
  }

  selectUnitAndAdd(unit: 'Single' | 'Roll' | 'Pack') {
    const p = this.unitSelectionProduct();
    if (p) {
      this.pos.addToCart(p.id, this.unitQty(), unit);
      this.unitSelectionProduct.set(null);
    }
  }

  closeUnitSelection() {
    this.unitSelectionProduct.set(null);
  }
}
