import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'CHANGE_ME_DEV',
    });
  }

  async validate(payload: any) {
    return {
      first_name: payload.first_name,
      last_name: payload.last_name,
      user_id: payload.user_id,
      email: payload.email,
      is_admin: payload.is_admin,
    };
  }
}
