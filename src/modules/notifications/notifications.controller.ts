import { Controller, Post, Body, Get, Put, Param, Query, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Register FCM device token' })
  async registerToken(
    @Req() req: any,
    @Body() body: { token: string; deviceType?: string; deviceName?: string },
  ) {
    return this.notificationsService.registerDeviceToken(
      req.user.id,
      body.token,
      body.deviceType || body.deviceName ? {
        type: body.deviceType || 'unknown',
        name: body.deviceName || 'unknown',
      } : undefined
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, {
      limit,
      offset,
      unreadOnly,
    });
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
} 