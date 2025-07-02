import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'The email address of the user',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: '123456',
        description: 'The 6-digit OTP code sent to the email',
        minLength: 6,
        maxLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otp: string;
} 