import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

export type Region = 'EU' | 'ME' | 'AF';

interface RegionConfig {
  timezone: string;
  currency: string;
  dateFormat: string;
  solanaEndpoint: string;
  supportedLanguages: string[];
}

@Injectable()
export class RegionService {
  private readonly regionConfigs: Record<Region, RegionConfig> = {
    EU: {
      timezone: 'Europe/London',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      solanaEndpoint: 'https://api.eu-central-1.solana.com',
      supportedLanguages: ['en', 'fr', 'de', 'es'],
    },
    ME: {
      timezone: 'Asia/Dubai',
      currency: 'AED',
      dateFormat: 'DD/MM/YYYY',
      solanaEndpoint: 'https://api.me-central-1.solana.com',
      supportedLanguages: ['ar', 'en'],
    },
    AF: {
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      dateFormat: 'DD/MM/YYYY',
      solanaEndpoint: 'https://api.af-south-1.solana.com',
      supportedLanguages: ['en', 'fr', 'ar'],
    },
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  getRegionConfig(region: Region): RegionConfig {
    return this.regionConfigs[region];
  }

  async getLocalizedMessage(
    key: string,
    lang: string,
    args?: Record<string, any>,
  ): Promise<string> {
    return this.i18n.translate(key, {
      lang,
      args,
    });
  }

  getSolanaEndpoint(region: Region): string {
    return this.regionConfigs[region].solanaEndpoint;
  }

  formatCurrency(amount: number, region: Region): string {
    const currency = this.regionConfigs[region].currency;
    return new Intl.NumberFormat(this.getLocale(region), {
      style: 'currency',
      currency,
    }).format(amount);
  }

  formatDate(date: Date, region: Region): string {
    return new Intl.DateTimeFormat(this.getLocale(region), {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: this.regionConfigs[region].timezone,
    }).format(date);
  }

  private getLocale(region: Region): string {
    switch (region) {
      case 'EU':
        return 'en-GB';
      case 'ME':
        return 'ar-AE';
      case 'AF':
        return 'en-NG';
      default:
        return 'en-US';
    }
  }

  isLanguageSupportedInRegion(lang: string, region: Region): boolean {
    return this.regionConfigs[region].supportedLanguages.includes(lang);
  }
} 