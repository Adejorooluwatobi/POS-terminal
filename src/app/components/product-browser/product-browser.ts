import { Component, inject, signal, computed, Input } from '@angular/core';
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

  @Input() searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  
  dynamicCategories = computed(() => {
    const list = this.pos.products();
    const set = new Set<string>();
    list.forEach(p => {
      const c = p.category || p.cat;
      if (c && c.toLowerCase() !== 'all') {
        // Capitalize first letter for display
        const display = c.charAt(0).toUpperCase() + c.slice(1);
        set.add(display);
      }
    });
    const dynamic = Array.from(set).sort().map(c => ({ id: c.toLowerCase(), name: c }));
    return [{ id: 'all', name: 'All' }, ...dynamic];
  });

  filteredProducts = computed(() => {
    let list = this.pos.products();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    if (cat !== 'all') {
      list = list.filter(p => (p.cat || p.category || '').toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    return list;
  });

  unitSelectionProduct = signal<Product | null>(null);
  unitQty = signal<number>(1);

  categoryCount(catId: string): number {
    const list = this.pos.products();
    if (catId === 'all') return list.length;
    return list.filter(p => (p.cat || p.category || '').toLowerCase() === catId.toLowerCase()).length;
  }

  getProductCode(p: Product): string {
    if (p.sku && p.sku.length <= 4) return p.sku.toUpperCase();
    if (p.sku) return p.sku.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();
    return p.name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() || 'ITM';
  }

  getProductIcon(cat: string | undefined): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('bever') || c.includes('drink') || c.includes('water')) return 'local_drink';
    if (c.includes('snack') || c.includes('cookie') || c.includes('candy')) return 'cookie';
    if (c.includes('dairy') || c.includes('milk')) return 'icecream';
    if (c.includes('elect') || c.includes('gadget') || c.includes('phone')) return 'devices';
    if (c.includes('cloth') || c.includes('apparel') || c.includes('wear')) return 'apparel';
    if (c.includes('house') || c.includes('clean')) return 'cleaning_services';
    if (c.includes('grocer') || c.includes('food')) return 'bakery_dining';
    return 'inventory_2';
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
      if (this.pos.numBuffer()) {
        this.pos.numBuffer.set('');
      }
    }
  }

  changeUnitQty(delta: number) {
    this.unitQty.update(q => Math.max(1, q + delta));
  }

  selectUnitAndAdd(unit: 'Single' | 'Roll' | 'Pack') {
    const p = this.unitSelectionProduct();
    if (p) {
      this.pos.addToCart(p.id, this.unitQty(), unit);
      this.unitSelectionProduct.set(null);
      if (this.pos.numBuffer()) {
        this.pos.numBuffer.set('');
      }
    }
  }

  closeUnitSelection() {
    this.unitSelectionProduct.set(null);
  }
}
