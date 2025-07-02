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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const SendGrid = require("@sendgrid/mail");
let EmailService = class EmailService {
    configService;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('SENDGRID_API_KEY');
        if (!apiKey) {
            throw new Error('SENDGRID_API_KEY is not defined in environment variables');
        }
        SendGrid.setApiKey(apiKey);
    }
    async sendOTP(email, otp) {
        const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL');
        if (!fromEmail) {
            throw new Error('SENDGRID_FROM_EMAIL is not defined in environment variables');
        }
        const msg = {
            to: email,
            from: fromEmail,
            subject: 'Your SwarpPay Authentication Code',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SwarpPay Authentication Code</h2>
          <p>Your authentication code is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message from SwarpPay. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
        };
        try {
            await SendGrid.send(msg);
        }
        catch (error) {
            console.error('SendGrid error:', error);
            if (error.response) {
                console.error('Error response:', error.response.body);
            }
            throw new Error('Failed to send email');
        }
    }
    async sendWelcomeEmail(email, firstName) {
        const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL');
        if (!fromEmail) {
            throw new Error('SENDGRID_FROM_EMAIL is not defined in environment variables');
        }
        const msg = {
            to: email,
            from: fromEmail,
            subject: 'Welcome to SwarpPay!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to SwarpPay!</h2>
          <p>Dear ${firstName},</p>
          <p>Thank you for joining SwarpPay! We're excited to have you on board.</p>
          <p>With SwarpPay, you can:</p>
          <ul>
            <li>Send and receive payments securely</li>
            <li>Manage your cryptocurrency portfolio</li>
            <li>Track your transactions in real-time</li>
          </ul>
          <p>If you have any questions, our support team is here to help.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message from SwarpPay. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
        };
        try {
            await SendGrid.send(msg);
        }
        catch (error) {
            console.error('SendGrid error:', error);
            if (error.response) {
                console.error('Error response:', error.response.body);
            }
            throw new Error('Failed to send welcome email');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map