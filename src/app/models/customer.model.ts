export interface Customer {
  id: number | string;
  firstName?: string;
  lastName?: string;
  name: string;
  phone: string;
  email?: string;
  loyalty?: string;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  points: number;
  identityType?: string;
  identityNumber?: string;
  maskedIdentityNumber?: string;
  photoUrl?: string;
  isIdentityVerified?: boolean;
}
