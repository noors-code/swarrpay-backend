import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/users/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RegionModule } from './modules/region/region.module';
import { ScheduleModule } from '@nestjs/schedule';
import { getTypeOrmConfig } from './config/typeorm.config';
import { I18nModule } from 'nestjs-i18n';
import { i18nConfig } from './config/i18n.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    I18nModule.forRoot(i18nConfig),
    ScheduleModule.forRoot(),
    RegionModule,
    AuthModule,
    WalletModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
