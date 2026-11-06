
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt.types.js';

type AuthJwtPayload = JwtPayload & {
  userId?: string;
  id?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: AuthJwtPayload) {
    const userId = payload.sub ?? payload.userId ?? payload.id;

    if (!userId) {
      throw new UnauthorizedException(
        'JWT не містить ID користувача. Увійди в акаунт повторно.',
      );
    }

    return {
      id: userId,
      userId,
      email: payload.email,
    };
  }
}
