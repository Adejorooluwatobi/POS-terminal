export interface Customer {
  id: number;
  name: string;
  phone: string;
  loyalty: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  points: number;
}
