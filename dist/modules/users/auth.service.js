"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
const email_service_1 = require("../email/email.service");
const config_1 = require("@nestjs/config");
const common_2 = require("@nestjs/common");
let AuthService = class AuthService {
    userRepository;
    jwtService;
    emailService;
    configService;
    constructor(userRepository, jwtService, emailService, configService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.configService = configService;
    }
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async register(createUserDto) {
        const { email, phoneNumber, password } = createUserDto;
        if (!email && !phoneNumber) {
            throw new common_2.BadRequestException('Email or phone number is required');
        }
        const existingUser = await this.userRepository.findOne({
            where: email ? { email } : { phoneNumber },
        });
        if (existingUser) {
            throw new common_1.ConflictException(email ? 'Email already exists' : 'Phone number already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            isTwoFactorEnabled: false,
            isVerified: true,
        });
        await this.userRepository.save(user);
        return { message: 'Registration successful.' };
    }
    async login(loginDto) {
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = this.generateToken(user);
        return { token };
    }
    async loginWithPhone(loginDto) {
        const { phoneNumber, password } = loginDto;
        console.log('Phone login attempt:', phoneNumber);
        const user = await this.userRepository.findOne({
            where: { phoneNumber },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = this.generateToken(user);
        return { token };
    }
    async verifyOTP(email, otp) {
        const user = await this.userRepository.findOne({
            where: { email },
        });
        if (!user || !user.otpCode || !user.otpExpiry) {
            throw new common_1.UnauthorizedException('Invalid OTP request');
        }
        if (user.otpExpiry < new Date()) {
            throw new common_1.UnauthorizedException('OTP has expired');
        }
        const isOTPValid = await bcrypt.compare(otp, user.otpCode);
        if (!isOTPValid) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        user.otpCode = null;
        user.otpExpiry = null;
        if (!user.isVerified) {
            user.isVerified = true;
            if (user.email) {
                await this.emailService.sendWelcomeEmail(user.email, user.firstName);
            }
        }
        await this.userRepository.save(user);
        const token = this.generateToken(user);
        return { token };
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
        };
        return this.jwtService.sign(payload);
    }
    async googleLogin(req) {
        if (!req.user) {
            throw new common_1.UnauthorizedException('No user from Google');
        }
        let user = await this.userRepository.findOne({
            where: { email: req.user.email },
        });
        if (!user) {
            user = this.userRepository.create({
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                isVerified: true,
                profilePicture: req.user.picture,
                password: '',
            });
            await this.userRepository.save(user);
        }
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
    async appleLogin(req) {
        if (!req.user) {
            throw new common_1.UnauthorizedException('No user from Apple');
        }
        let user = await this.userRepository.findOne({
            where: { email: req.user.email },
        });
        if (!user) {
            user = this.userRepository.create({
                email: req.user.email,
                firstName: req.user.firstName || '',
                lastName: req.user.lastName || '',
                isVerified: true,
                password: '',
            });
            await this.userRepository.save(user);
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        email_service_1.EmailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map