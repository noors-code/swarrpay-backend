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
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        token: string;
    }>;
    getProfile(req: any): any;
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            profilePicture: string;
        };
    }>;
    appleAuth(): Promise<void>;
    appleAuthRedirect(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
}
