import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RepaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LATE = 'LATE',
}

@Entity('repayments')
export class Repayment {
  @PrimaryColumn('varchar', { length: 36 })
  repayment_id: string;

  @Column('varchar', { length: 36, nullable: false })
  loan_id: string;

  @Column('decimal', { precision: 18, scale: 2, nullable: false })
  amount: number;

  @Column('date', { nullable: false })
  due_date: Date;

  @Column('date', { nullable: true })
  paid_date: Date;

  @Column('enum', {
    enum: RepaymentStatus,
    default: RepaymentStatus.PENDING,
  })
  status: RepaymentStatus;

  @Column('varchar', { length: 66, nullable: true })
  blockchain_tx_hash: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
