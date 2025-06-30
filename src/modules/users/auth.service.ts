import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isTwoFactorEnabled: true, // Enable 2FA by default
    });

    await this.userRepository.save(user);
    
    // Generate and send OTP for email verification
    const otp = this.generateOTP();
    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await this.userRepository.save(user);
    
    await this.emailService.sendOTP(user.email, otp);

    return { message: 'Registration successful. Please verify your email with the OTP sent.' };
  }

  async login(loginDto: LoginDto): Promise<{ otpSent: boolean } | { token: string }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isTwoFactorEnabled) {
      const otp = this.generateOTP();
      user.otpCode = await bcrypt.hash(otp, 10);
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      await this.userRepository.save(user);
      
      await this.emailService.sendOTP(user.email, otp);
      return { otpSent: true };
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
} 