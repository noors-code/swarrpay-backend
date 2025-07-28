import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import * as web3 from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UpdateSecuritySettingsDto } from './dto/security-settings.dto';
import { EmailService } from '../email/email.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { SendTransactionDto } from './dto/transaction.dto';
import {
  WalletResponseDto,
  CreateWalletResponseDto,
} from './dto/wallet-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  private connection: web3.Connection;
  private readonly MAX_PIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private configService: ConfigService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {
    const network = this.configService.get<string>('SOLANA_NETWORK', 'devnet');
    this.connection = new web3.Connection(
      network === 'mainnet'
        ? web3.clusterApiUrl('mainnet-beta')
        : web3.clusterApiUrl('devnet'),
      'confirmed',
    );
  }

  private async transformToWalletResponse(
    wallet: Wallet,
  ): Promise<WalletResponseDto> {
    const balance = await this.getWalletBalance(wallet.publicKey);
    return {
      id: wallet.id,
      publicKey: wallet.publicKey,
      name: wallet.name || '',
      description: wallet.description || '',
      status: wallet.status,
      balance,
      isInitialized: wallet.isInitialized,
      createdAt: wallet.createdAt,
      lastActivityAt: wallet.lastActivityAt || wallet.createdAt,
    };
  }

  async createWallet(
    user: User,
    createWalletDto: CreateWalletDto,
  ): Promise<CreateWalletResponseDto> {
    const seedPhrase = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    const keypair = web3.Keypair.fromSeed(seed.slice(0, 32));

    const wallet = this.walletRepository.create({
      publicKey: keypair.publicKey.toString(),
      userId: user.id,
      user: user,
      isInitialized: true,
      hasSeedPhrase: true,
      lastActivityAt: new Date(),
      name: createWalletDto.name,
      description: createWalletDto.description,
    });

    const savedWallet = await this.walletRepository.save(wallet);
    const walletResponse = await this.transformToWalletResponse(savedWallet);

    return {
      wallet: walletResponse,
      seedPhrase,
    };
  }

  async getUserWallets(userId: string): Promise<WalletResponseDto[]> {
    const wallets = await this.walletRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      wallets.map((wallet) => this.transformToWalletResponse(wallet)),
    );
  }

  async getWallet(id: string, userId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.transformToWalletResponse(wallet);
  }

  async updateWallet(
    id: string,
    userId: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (updateWalletDto.name !== undefined) {
      wallet.name = updateWalletDto.name;
    }
    if (updateWalletDto.description !== undefined) {
      wallet.description = updateWalletDto.description;
    }
    if (updateWalletDto.status !== undefined) {
      wallet.status = updateWalletDto.status;
    }

    const updatedWallet = await this.walletRepository.save(wallet);
    return this.transformToWalletResponse(updatedWallet);
  }

  async getWalletBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new web3.PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / web3.LAMPORTS_PER_SOL;
    } catch (error) {
      throw new NotFoundException('Failed to fetch wallet balance');
    }
  }

  private async notifyTransaction(
    userId: string,
    transaction: Transaction,
    type: 'SEND' | 'RECEIVE',
  ) {
    const amount = transaction.amount;
    const address =
      type === 'SEND' ? transaction.toAddress : transaction.fromAddress;

    await this.notificationsService.sendNotification(userId, {
      title: type === 'SEND' ? 'Transaction Sent' : 'Transaction Received',
      body:
        type === 'SEND'
          ? `You sent ${amount} SOL to ${address}`
          : `You received ${amount} SOL from ${address}`,
      type: 'TRANSACTION',
      data: {
        transactionId: transaction.id,
        amount: amount.toString(),
        type,
        address,
        timestamp: transaction.timestamp.toISOString(),
      },
    });
  }

  async sendTransaction(
    walletId: string,
    userId: string,
    sendTransactionDto: SendTransactionDto,
  ): Promise<Transaction> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Implement actual transaction sending logic here
    // This is a placeholder that creates a transaction record
    const transaction = this.transactionRepository.create({
      signature: 'placeholder_signature', // Replace with actual signature
      type: 'SEND',
      amount: sendTransactionDto.amount,
      fee: 0.000005, // Replace with actual fee
      status: 'PENDING',
      fromAddress: wallet.publicKey,
      toAddress: sendTransactionDto.toAddress,
      wallet,
      walletId: wallet.id,
      metadata: {
        memo: sendTransactionDto.memo,
      },
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Send notification after transaction is saved
    await this.notifyTransaction(userId, savedTransaction, 'SEND');

    return savedTransaction;
  }

  async syncTransactions(walletId: string, userId: string): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const publicKey = new web3.PublicKey(wallet.publicKey);

    try {
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit: 50 },
        'confirmed',
      );

      for (const sigInfo of signatures) {
        const existingTx = await this.transactionRepository.findOne({
          where: { signature: sigInfo.signature },
        });

        if (!existingTx) {
          const tx = await this.connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (tx) {
            const postBalances = tx.meta?.postBalances?.[0] || 0;
            const preBalances = tx.meta?.preBalances?.[0] || 0;
            const amount =
              Math.abs(postBalances - preBalances) / web3.LAMPORTS_PER_SOL;
            const fee = (tx.meta?.fee || 0) / web3.LAMPORTS_PER_SOL;

            const message = tx.transaction.message;
            const accountKeys =
              'accountKeys' in message
                ? message.accountKeys
                : message.getAccountKeys();

            const type = postBalances > preBalances ? 'RECEIVE' : 'SEND';

            const transaction = this.transactionRepository.create({
              signature: sigInfo.signature,
              type,
              amount,
              fee,
              status: 'CONFIRMED',
              fromAddress: accountKeys[0].toString(),
              toAddress: accountKeys[1]?.toString(),
              wallet,
              walletId: wallet.id,
              metadata: {
                slot: tx.slot,
                blockTime: tx.blockTime,
                numConfirmations: sigInfo.slot
                  ? (await this.connection.getSlot('confirmed')) - sigInfo.slot
                  : undefined,
              },
            });

            await this.transactionRepository.save(transaction);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw new Error('Failed to sync transactions');
    }
  }

  async getTransactionHistory(
    walletId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', { walletId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.timestamp BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const [transactions, total] = await queryBuilder
      .orderBy('transaction.timestamp', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  async getTransactionDetails(
    signature: string,
    walletId: string,
    userId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        signature,
        walletId,
        wallet: { userId },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async updateSecuritySettings(
    walletId: string,
    userId: string,
    settings: UpdateSecuritySettingsDto,
  ): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (settings.transactionPIN) {
      wallet.transactionPINHash = await bcrypt.hash(
        settings.transactionPIN,
        10,
      );
      wallet.requirePINForTransactions = true;
    }

    if (typeof settings.requirePINForTransactions !== 'undefined') {
      wallet.requirePINForTransactions = settings.requirePINForTransactions;
    }

    if (typeof settings.dailyTransactionLimit !== 'undefined') {
      wallet.dailyTransactionLimit = settings.dailyTransactionLimit;
    }

    if (settings.allowedAddresses) {
      wallet.allowedAddresses = settings.allowedAddresses;
    }

    if (
      typeof settings.requireEmailConfirmationForTransactions !== 'undefined'
    ) {
      wallet.requireEmailConfirmationForTransactions =
        settings.requireEmailConfirmationForTransactions;
    }

    return this.walletRepository.save(wallet);
  }

  async verifyTransactionPIN(
    walletId: string,
    userId: string,
    pin: string,
  ): Promise<boolean> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Check if wallet is locked
    if (wallet.isLocked) {
      if (wallet.lockExpiresAt && wallet.lockExpiresAt > new Date()) {
        throw new UnauthorizedException(
          'Wallet is locked. Please try again later.',
        );
      }
      // If lock has expired, reset the lock
      wallet.isLocked = false;
      wallet.lockExpiresAt = null;
      wallet.lastIncorrectPINAttempt = null;
      wallet.incorrectPINAttempts = 0;
      await this.walletRepository.save(wallet);
    }

    const isValid = await bcrypt.compare(pin, wallet.transactionPINHash);

    if (!isValid) {
      wallet.incorrectPINAttempts = (wallet.incorrectPINAttempts || 0) + 1;
      wallet.lastIncorrectPINAttempt = new Date();

      if (wallet.incorrectPINAttempts >= this.MAX_PIN_ATTEMPTS) {
        wallet.isLocked = true;
        wallet.lockExpiresAt = new Date(Date.now() + this.LOCK_DURATION);
      }

      await this.walletRepository.save(wallet);
      throw new UnauthorizedException('Invalid PIN');
    }

    // Reset attempts on successful verification
    if (wallet.incorrectPINAttempts > 0) {
      wallet.incorrectPINAttempts = 0;
      wallet.lastIncorrectPINAttempt = null;
      await this.walletRepository.save(wallet);
    }

    return true;
  }

  async checkDailyTransactionLimit(
    walletId: string,
    userId: string,
    amount: number,
  ): Promise<boolean> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.dailyTransactionLimit) {
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset daily amount if it's a new day
    if (!wallet.lastDailyLimitReset || wallet.lastDailyLimitReset < today) {
      wallet.dailyTransactionAmount = 0;
      wallet.lastDailyLimitReset = today;
      await this.walletRepository.save(wallet);
    }

    const newDailyTotal = wallet.dailyTransactionAmount + amount;
    if (newDailyTotal > wallet.dailyTransactionLimit) {
      throw new BadRequestException('Transaction would exceed daily limit');
    }

    return true;
  }

  async verifyAllowedAddress(
    walletId: string,
    userId: string,
    address: string,
  ): Promise<boolean> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.allowedAddresses || wallet.allowedAddresses.length === 0) {
      return true;
    }

    if (!wallet.allowedAddresses.includes(address)) {
      throw new UnauthorizedException('Address not in allowed list');
    }

    return true;
  }

  async sendTransactionConfirmationEmail(
    walletId: string,
    userId: string,
    transactionDetails: {
      amount: number;
      toAddress: string;
    },
  ): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.requireEmailConfirmationForTransactions) {
      return;
    }

    // Generate OTP for transaction
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store OTP hash in wallet temporarily
    wallet.transactionConfirmationCode = otpHash;
    wallet.transactionConfirmationExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await this.walletRepository.save(wallet);

    // Send confirmation email
    if (wallet.user.email) {
      await this.emailService.sendTransactionConfirmationEmail(
        wallet.user.email,
        {
          amount: transactionDetails.amount,
          toAddress: transactionDetails.toAddress,
          otp,
        },
      );
    } else {
      // Optional: handle missing email case
      // For example, log a warning or throw an error
      console.warn(
        'User email is missing; cannot send transaction confirmation email.',
      );
    }
  }
}
