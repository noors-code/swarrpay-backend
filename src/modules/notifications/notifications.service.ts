import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { MessagingPayload } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
      if (!serviceAccount) {
        this.logger.error('Firebase service account not configured');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }
  }

  async registerDeviceToken(userId: string, token: string, deviceInfo?: { type: string; name: string }) {
    // Check if token already exists
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (deviceToken) {
      // Update existing token
      deviceToken.userId = userId;
      deviceToken.isActive = true;
      deviceToken.lastUsedAt = new Date();
      if (deviceInfo) {
        deviceToken.deviceType = deviceInfo.type;
        deviceToken.deviceName = deviceInfo.name;
      }
    } else {
      // Create new token
      deviceToken = this.deviceTokenRepository.create({
        userId,
        token,
        deviceType: deviceInfo?.type,
        deviceName: deviceInfo?.name,
        lastUsedAt: new Date(),
      });
    }

    return this.deviceTokenRepository.save(deviceToken);
  }

  async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      type: 'TRANSACTION' | 'SECURITY' | 'SYSTEM' | 'MARKETING';
    },
  ) {
    // Get all active device tokens for user
    const deviceTokens = await this.deviceTokenRepository.find({
      where: { userId, isActive: true },
    });

    if (!deviceTokens.length) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return;
    }

    // Create notification record
    const notificationRecord = this.notificationRepository.create({
      userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      type: notification.type,
    });

    try {
      // Send to Firebase
      const message: MessagingPayload = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
      };

      // Send to each device token individually
      const sendPromises = deviceTokens.map(dt =>
        admin.messaging().send({
          ...message,
          token: dt.token,
        })
      );

      const results = await Promise.allSettled(sendPromises);
      
      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      // Update notification record with delivery status
      notificationRecord.isDelivered = successCount > 0;
      notificationRecord.deliveredAt = new Date();
      if (failureCount > 0) {
        notificationRecord.error = `Failed to deliver to ${failureCount} devices`;
      }

      // Handle failed tokens
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          this.handleFailedToken(deviceTokens[idx].token, result.reason);
        }
      });

    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      notificationRecord.isDelivered = false;
      notificationRecord.error = error.message;
    }

    // Save notification record
    return this.notificationRepository.save(notificationRecord);
  }

  private async handleFailedToken(token: string, error: any) {
    // Check error code from Firebase
    const errorCode = error?.code || error?.errorInfo?.code;
    if (errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered') {
      // Deactivate invalid token
      await this.deviceTokenRepository.update(
        { token },
        { isActive: false }
      );
    }
  }

  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (options.unreadOnly) {
      queryBuilder.andWhere('notification.isRead = false');
    }

    if (options.limit) {
      queryBuilder.take(options.limit);
    }

    if (options.offset) {
      queryBuilder.skip(options.offset);
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      notifications,
      total,
      unread: options.unreadOnly ? total : await this.getUnreadCount(userId),
    };
  }

  private async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.affected || 0;
  }
} 