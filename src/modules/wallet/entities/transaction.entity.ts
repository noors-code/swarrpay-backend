import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  signature: string;

  @Column()
  type: 'SEND' | 'RECEIVE';

  @Column('decimal', { precision: 18, scale: 9 })
  amount: number;

  @Column({ nullable: true })
  fromAddress: string;

  @Column({ nullable: true })
  toAddress: string;

  @Column('decimal', { precision: 18, scale: 9 })
  fee: number;

  @Column({ default: 'CONFIRMED' })
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';

  @Column({ nullable: true })
  errorMessage?: string;

  @ManyToOne(() => Wallet, { eager: true })
  wallet: Wallet;

  @Column()
  walletId: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
} 