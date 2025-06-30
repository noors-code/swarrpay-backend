import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly emailService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, emailService: EmailService);
    private generateOTP;
    register(createUserDto: CreateUserDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        otpSent: boolean;
    } | {
        token: string;
    }>;
    verifyOTP(email: string, otp: string): Promise<{
        token: string;
    }>;
    private generateToken;
}
