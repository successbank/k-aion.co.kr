import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number; // member id
  username: string;
  grade: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'kaion-jwt-secret-key-2024',
    });
  }

  async validate(payload: JwtPayload) {
    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        grade: true,
        phone: true,
        isActive: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    if (!member.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다');
    }

    return member;
  }
}
