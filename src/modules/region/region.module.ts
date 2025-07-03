import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { I18nModule } from 'nestjs-i18n';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('FALLBACK_LANGUAGE', 'en'),
        loaderOptions: {
          path: path.join(__dirname, '../../i18n'),
          watch: true,
        },
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
  ],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {} 