import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    constructor(configService: ConfigService);
    sendOTP(email: string, otp: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendTransactionConfirmationEmail(email: string, details: {
        amount: number;
        toAddress: string;
        otp: string;
    }): Promise<void>;
}
