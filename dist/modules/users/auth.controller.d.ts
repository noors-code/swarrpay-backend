import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        otpSent: boolean;
    } | {
        token: string;
    }>;
    verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<{
        token: string;
    }>;
    getProfile(req: any): any;
}
