import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum TransactionType {
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  REPAYMENT = 'REPAYMENT',
  COLLATERAL_DEPOSIT = 'COLLATERAL_DEPOSIT',
  COLLATERAL_LIQUIDATION = 'COLLATERAL_LIQUIDATION',
}

export enum TransactionSubtype {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

@Entity('transactions')
export class Transaction {
  @PrimaryColumn('varchar', { length: 36 })
  tx_id: string;

  @Column('varchar', { length: 36, nullable: false })
  user_id: string;

  @Column('varchar', { length: 36, nullable: true })
  loan_id: string;

  @Column('enum', {
    enum: TransactionType,
    nullable: false,
  })
  type: TransactionType;

  @Column('enum', {
    enum: TransactionSubtype,
    nullable: false,
  })
  subtype: TransactionSubtype;

  @Column('decimal', { precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column('varchar', { length: 66, nullable: true })
  tx_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
