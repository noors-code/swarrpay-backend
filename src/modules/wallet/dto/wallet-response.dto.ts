import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({
    description: 'Wallet ID',
    example: 'uuid-v4',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet public key',
    example: 'GsbwXfJraMomNxBcjYLcG3mxkBUxn7B2Eup2Vw8Tbh5p',
  })
  publicKey: string;

  @ApiProperty({
    description: 'Wallet name',
    example: 'My Main Wallet',
  })
  name: string;

  @ApiProperty({
    description: 'Wallet description',
    example: 'Personal spending wallet',
  })
  description: string;

  @ApiProperty({
    description: 'Wallet status',
    enum: ['ACTIVE', 'DISABLED', 'LOCKED'],
    example: 'ACTIVE',
  })
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED';

  @ApiProperty({
    description: 'Wallet balance in SOL',
    example: 10.5,
  })
  balance: number;

  @ApiProperty({
    description: 'Whether the wallet is initialized',
    example: true,
  })
  isInitialized: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-03-20T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2024-03-20T15:45:00Z',
  })
  lastActivityAt: Date;
}

export class CreateWalletResponseDto {
  @ApiProperty({
    description: 'Wallet details',
    type: WalletResponseDto,
  })
  wallet: WalletResponseDto;

  @ApiProperty({
    description: 'Seed phrase (only returned once during creation)',
    example: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
  })
  seedPhrase: string;
} 