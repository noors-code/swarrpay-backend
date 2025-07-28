import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { PhoneLoginDto } from './dto/phone-login.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const { email, phoneNumber, password } = createUserDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Check if user already exists by email or phoneNumber
    const existingUser = await this.userRepository.findOne({
      where: email ? { email } : { phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException(
        email ? 'Email already exists' : 'Phone number already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isTwoFactorEnabled: false, // Disable 2FA for testing
      isVerified: true, // Auto-verify for testing
    });

    await this.userRepository.save(user);

    return { message: 'Registration successful.' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ otpSent: boolean } | { token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Skip 2FA for testing
    const token = this.generateToken(user);
    return { token };
  }
  // phone login method
  async loginWithPhone(loginDto: PhoneLoginDto): Promise<{ token: string }> {
    const { phoneNumber, password } = loginDto;
    console.log('Phone login attempt:', phoneNumber);

    const user = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    return { token };
  }

  async verifyOTP(email: string, otp: string): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.otpCode || !user.otpExpiry) {
      throw new UnauthorizedException('Invalid OTP request');
    }

    if (user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    const isOTPValid = await bcrypt.compare(otp, user.otpCode);
    if (!isOTPValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP after successful verification
    user.otpCode = null;
    user.otpExpiry = null;

    if (!user.isVerified) {
      user.isVerified = true;
      if (user.email) {
        // Only send welcome email if email exists
        await this.emailService.sendWelcomeEmail(user.email, user.firstName);
      }
    }

    await this.userRepository.save(user);

    const token = this.generateToken(user);
    return { token };
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    let user = await this.userRepository.findOne({
      where: { email: req.user.email },
    });

    if (!user) {
      // Create new user from Google data
      user = this.userRepository.create({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        isVerified: true, // Google emails are verified
        profilePicture: req.user.picture,
        password: '', // No password for Google users
      });
      await this.userRepository.save(user);
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
      },
    };
  }

  async appleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Apple');
    }

    let user = await this.userRepository.findOne({
      where: { email: req.user.email },
    });

    if (!user) {
      // Create new user from Apple data
      user = this.userRepository.create({
        email: req.user.email,
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || '',
        isVerified: true, // Apple emails are verified
        password: '', // No password for Apple users
      });
      await this.userRepository.save(user);
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
