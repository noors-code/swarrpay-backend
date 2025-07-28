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
    profilePicture: string;
    createdAt: Date;
    updatedAt: Date;
    phoneNumber: string | null;
}
