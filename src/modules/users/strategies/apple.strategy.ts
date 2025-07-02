import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyLocation: configService.get<string>('APPLE_PRIVATE_KEY_PATH'),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL'),
      passReqToCallback: true,
      scope: ['email', 'name'],
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { email } = profile;
    let firstName = '';
    let lastName = '';

    // Apple only sends user data on the first login
    if (req.body && req.body.user) {
      const userData = JSON.parse(req.body.user);
      firstName = userData.name?.firstName || '';
      lastName = userData.name?.lastName || '';
    }

    const user = {
      email,
      firstName,
      lastName,
      accessToken,
      provider: 'apple',
    };

    done(null, user);
  }
} 