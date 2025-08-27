import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  user_id: string;

  @Column('varchar', { nullable: false })
  first_name: string;

  @Column('varchar', { nullable: false })
  last_name: string;

  @Column('varchar', { unique: true, nullable: false })
  email: string;

  @Column('varchar', { nullable: true, default: null })
  phone_number: string;

  @Column('varchar', { nullable: false })
  password: string; // hashed

  @Column('boolean', { default: false })
  is_admin: boolean;

  @Column('boolean', { default: true })
  is_active: boolean;

  @Column('boolean', { default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
