import { Staff } from './staff.model';
import { Product } from './product.model';
import { Customer } from './customer.model';

export const STAFF_LIST: Staff[] = [
  { id:'EMP-001', name:'Gold Adejoro',  initials:'GA', role:'MANAGER',    pin:'1234', store:'VI Store', color:'#00c2ff' },
  { id:'EMP-002', name:'Sola Fashola',  initials:'SF', role:'CASHIER',    pin:'1234', store:'VI Store', color:'#00d68f' },
  { id:'EMP-003', name:'Bola Adekunle', initials:'BA', role:'CASHIER',    pin:'1234', store:'VI Store', color:'#f5a623' },
  { id:'EMP-004', name:'Temi Oladipo',  initials:'TO', role:'SUPERVISOR', pin:'1234', store:'VI Store', color:'#a78bfa' },
];

export const PRODUCTS: Product[] = [
  { id:1,  name:'Coca-Cola 50cl',     sku:'BEV-001', barcode:'5000112637987', cat:'beverages', price:350,  cost:220, emoji:'🥤', tax:.075 },
  { id:2,  name:'Malt Drink 33cl',    sku:'BEV-002', barcode:'5000112637988', cat:'beverages', price:420,  cost:260, emoji:'🍺', tax:.075 },
  { id:3,  name:'Water 75cl',         sku:'BEV-003', barcode:'5000112637989', cat:'beverages', price:150,  cost:80,  emoji:'💧', tax:0    },
  { id:4,  name:'Zobo Drink 50cl',    sku:'BEV-004', barcode:'5000112637990', cat:'beverages', price:200,  cost:120, emoji:'🧃', tax:0    },
  { id:5,  name:'Lipton Tea 50s',     sku:'BEV-005', barcode:'5000112637991', cat:'beverages', price:700,  cost:420, emoji:'🍵', tax:.075 },
  { id:6,  name:'Peak Milk 400g',     sku:'DAI-001', barcode:'5000212637001', cat:'dairy',     price:1800, cost:1200,emoji:'🥛', tax:0    },
  { id:7,  name:'Butter 250g',        sku:'DAI-002', barcode:'5000212637002', cat:'dairy',     price:950,  cost:600, emoji:'🧈', tax:0    },
  { id:8,  name:'Cheese Slices 200g', sku:'DAI-003', barcode:'5000212637003', cat:'dairy',     price:1200, cost:750, emoji:'🧀', tax:0    },
  { id:9,  name:'Digestive Biscuit',  sku:'SNK-001', barcode:'5000312637001', cat:'snacks',    price:650,  cost:400, emoji:'🍪', tax:.075 },
  { id:10, name:'Pringles Original',  sku:'SNK-002', barcode:'5000312637002', cat:'snacks',    price:1800, cost:1100,emoji:'🍿', tax:.075 },
  { id:11, name:'Chin Chin 200g',     sku:'SNK-003', barcode:'5000312637003', cat:'snacks',    price:500,  cost:300, emoji:'🫘', tax:.075 },
  { id:12, name:'Indomie 5-pack',     sku:'SNK-004', barcode:'5000312637004', cat:'snacks',    price:750,  cost:450, emoji:'🍜', tax:0    },
  { id:13, name:'Omo Detergent 1kg',  sku:'HSH-001', barcode:'5000412637001', cat:'household', price:1100, cost:700, emoji:'🧺', tax:.075 },
  { id:14, name:'Hypo Bleach 750ml',  sku:'HSH-002', barcode:'5000412637002', cat:'household', price:650,  cost:380, emoji:'🧴', tax:.075 },
  { id:15, name:'Dettol Soap 3-pack', sku:'PER-001', barcode:'5000512637001', cat:'personal',  price:1400, cost:850, emoji:'🧼', tax:0    },
  { id:16, name:'Vaseline 250ml',     sku:'PER-002', barcode:'5000512637002', cat:'personal',  price:900,  cost:540, emoji:'💊', tax:0    },
];

export const CUSTOMERS: Customer[] = [
  { id:1, name:'Amara Okafor',  phone:'08012345678', loyalty:'LOY-001', tier:'GOLD',     points:3200 },
  { id:2, name:'Tunde Adeyemi', phone:'08098765432', loyalty:'LOY-002', tier:'SILVER',   points:1100 },
  { id:3, name:'Ngozi Eze',     phone:'07031234567', loyalty:'LOY-003', tier:'BRONZE',   points:450  },
  { id:4, name:'Chidi Obi',     phone:'08155443322', loyalty:'LOY-004', tier:'PLATINUM', points:7800 },
];

export const COUPONS: Record<string, { type: 'pct' | 'fixed', val: number }> = {
  'SAVE10':{ type:'pct', val:10 },
  'SAVE500':{ type:'fixed', val:500 },
  'FLAT20':{ type:'pct', val:20 }
};
