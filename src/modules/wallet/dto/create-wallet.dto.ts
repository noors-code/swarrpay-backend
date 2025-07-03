import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Optional wallet name for identification',
    required: false,
    example: 'My Main Wallet',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Optional description for the wallet',
    required: false,
    example: 'Personal spending wallet',
  })
  @IsString()
  @IsOptional()
  description?: string;
} 