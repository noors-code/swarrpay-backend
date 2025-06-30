export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    otpCode: string | null;
    otpExpiry: Date | null;
    isTwoFactorEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
