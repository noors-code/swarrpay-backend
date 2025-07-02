import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined in environment variables');
    }
    SendGrid.setApiKey(apiKey);
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined in environment variables');
    }

    const msg: SendGrid.MailDataRequired = {
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
    } catch (error) {
      console.error('SendGrid error:', error);
      if (error.response) {
        console.error('Error response:', error.response.body);
      }
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined in environment variables');
    }

    const msg: SendGrid.MailDataRequired = {
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
    } catch (error) {
      console.error('SendGrid error:', error);
      if (error.response) {
        console.error('Error response:', error.response.body);
      }
      throw new Error('Failed to send welcome email');
    }
  }
} 