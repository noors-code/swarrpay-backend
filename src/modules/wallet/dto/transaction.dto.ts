import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class SendTransactionDto {
  @ApiProperty()
  @IsString()
  toAddress: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  memo?: string;
}

export class GetTransactionsQueryDto {
  @ApiProperty({
    description: 'Start date for transaction history',
    required: false,
    example: '2024-03-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for transaction history',
    required: false,
    example: '2024-03-20T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Number of transactions to return',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Number of transactions to skip',
    required: false,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 'uuid-v4',
  })
  id: string;

  @ApiProperty({
    description: 'Transaction signature',
    example: '4vC38p8dM9TENxtBR...',
  })
  signature: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['SEND', 'RECEIVE'],
    example: 'SEND',
  })
  type: 'SEND' | 'RECEIVE';

  @ApiProperty({
    description: 'Transaction amount in SOL',
    example: 1.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Sender address',
    example: 'GsbwXfJraMomNxBcjYLcG3mxkBUxn7B2Eup2Vw8Tbh5p',
  })
  fromAddress: string;

  @ApiProperty({
    description: 'Recipient address',
    example: 'HN7cABqLq46Es1jh92dQQisAq662SmxGtNdMnswNHhm8',
  })
  toAddress: string;

  @ApiProperty({
    description: 'Transaction fee in SOL',
    example: 0.000005,
  })
  fee: number;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    example: 'CONFIRMED',
  })
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';

  @ApiProperty({
    description: 'Transaction timestamp',
    example: '2024-03-20T10:30:00Z',
  })
  timestamp: Date;
} 