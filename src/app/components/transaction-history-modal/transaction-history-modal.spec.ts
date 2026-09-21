import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionHistoryModal } from './transaction-history-modal';

describe('TransactionHistoryModal', () => {
  let component: TransactionHistoryModal;
  let fixture: ComponentFixture<TransactionHistoryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistoryModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistoryModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
