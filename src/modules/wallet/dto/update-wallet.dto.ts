import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateWalletDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['ACTIVE', 'DISABLED', 'LOCKED'], required: false })
  @IsEnum(['ACTIVE', 'DISABLED', 'LOCKED'])
  @IsOptional()
  status?: 'ACTIVE' | 'DISABLED' | 'LOCKED';
} 