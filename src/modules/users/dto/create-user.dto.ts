import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'The email address of the user',
  })
  @ValidateIf((o) => !o.phoneNumber) // Only validate email if phoneNumber is not provided
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({
    example: '+923001234567',
    description: 'The phone number of the user',
  })
  @ValidateIf((o) => !o.email) // Only validate phoneNumber if email is not provided
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password for the account (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}
