export interface TillSession {
  id: string;
  terminalId: string;
  staffId: string;
  openedAt: Date;
  closedAt?: Date;
  openingFloat: number;
  closingCash?: number;
  expectedCash?: number;
  variance?: number;
  status: 'Open' | 'Closed';
  notes?: string;
}

export interface CreateTillSessionDto {
  terminalId: string;
  openingFloat: number;
  notes?: string;
}

export interface UpdateTillSessionDto {
  closingCash: number;
  notes?: string;
}
