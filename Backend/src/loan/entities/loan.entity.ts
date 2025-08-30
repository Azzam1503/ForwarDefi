import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  REPAID = 'REPAID',
  DEFAULTED = 'DEFAULTED',
}

@Entity('loans')
export class Loan {
  @PrimaryColumn('varchar', { length: 36 })
  loan_id: string;

  @Column('varchar', { length: 36, nullable: false })
  user_id: string;

  @Column('decimal', { precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: false })
  interest_rate: number;

  @Column('decimal', { precision: 18, scale: 2, nullable: false })
  collateral_amount: number;

  @Column('enum', {
    enum: LoanStatus,
    default: LoanStatus.PENDING,
  })
  status: LoanStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
