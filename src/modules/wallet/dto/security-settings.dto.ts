import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MinLength, IsArray, Min } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @ApiProperty({
    description: 'Enable/disable PIN requirement for transactions',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requirePINForTransactions?: boolean;

  @ApiProperty({
    description: 'New transaction PIN (min 6 digits)',
    required: false,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  transactionPIN?: string;

  @ApiProperty({
    description: 'Daily transaction limit in SOL (0 for unlimited)',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyTransactionLimit?: number;

  @ApiProperty({
    description: 'List of allowed addresses for transactions',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  allowedAddresses?: string[];

  @ApiProperty({
    description: 'Enable/disable email confirmation for transactions',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requireEmailConfirmationForTransactions?: boolean;
}

export class VerifyTransactionPINDto {
  @ApiProperty({
    description: 'Transaction PIN',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  pin: string;
} 