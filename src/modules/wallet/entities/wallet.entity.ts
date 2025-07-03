import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';
import { Exclude } from 'class-transformer';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  publicKey: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  transactions: Transaction[];

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED';

  @Column({ default: false })
  isInitialized: boolean;

  @Column({ default: false })
  hasSeedPhrase: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date | null;

  @Column({ nullable: true })
  @Exclude()
  transactionPIN: string;

  @Column({ default: 0 })
  incorrectPINAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastIncorrectPINAttempt: Date | null;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lockExpiresAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyTransactionLimit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  dailyTransactionAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastDailyLimitReset: Date | null;

  @Column({ default: false })
  requirePINForTransactions: boolean;

  @Column({ default: false })
  requireEmailConfirmationForTransactions: boolean;

  @Column('text', { array: true, nullable: true })
  allowedAddresses: string[];

  // New security fields
  @Column({ nullable: true })
  @Exclude()
  transactionPINHash: string;

  @Column({ nullable: true })
  @Exclude()
  transactionConfirmationCode: string;

  @Column({ nullable: true })
  transactionConfirmationExpiry: Date;
} 