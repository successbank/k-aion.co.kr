import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const selectFields = {
      id: true,
      username: true,
      email: true,
      name: true,
      password: true,
      grade: true,
      phone: true,
      isActive: true,
    };

    // 1. username으로 검색
    let member = await this.prisma.member.findUnique({
      where: { username },
      select: selectFields,
    });

    // 2. username으로 없고, 입력값이 숫자인 경우 회원번호(id)로 검색
    if (!member && /^\d+$/.test(username)) {
      member = await this.prisma.member.findUnique({
        where: { id: parseInt(username, 10) },
        select: selectFields,
      });
    }

    if (!member) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // 활성 상태 확인
    if (!member.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다. 관리자에게 문의하세요');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');
    }

    // JWT 토큰 생성
    const payload: JwtPayload = {
      sub: member.id,
      username: member.username,
      grade: member.grade,
    };

    const accessToken = this.jwtService.sign(payload);

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = member;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async register(registerDto: RegisterDto) {
    // recommenderId는 더 이상 사용하지 않음 (후원계보로 전환)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, password, recommenderId: _ignoredRecommenderId, sponsorId, ...rest } = registerDto;

    // username 중복 확인
    const existingUsername = await this.prisma.member.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 아이디입니다');
    }

    // 후원인 확인 (필수)
    const sponsor = await this.prisma.member.findUnique({
      where: { id: sponsorId },
    });

    if (!sponsor) {
      throw new BadRequestException('존재하지 않는 후원인입니다');
    }

    if (!sponsor.isActive) {
      throw new BadRequestException('비활성화된 후원인입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원 생성 (recommenderId는 null로 설정 - 후원계보만 사용)
    const newMember = await this.prisma.member.create({
      data: {
        username,
        password: hashedPassword,
        recommenderId: null, // 추천계보 미사용 - 후원계보로 전환
        sponsorId,
        grade: 'SALESPERSON', // 신규 가입자는 기본적으로 판매원 등급
        isActive: true,
        ...rest,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        grade: true,
        phone: true,
        createdAt: true,
      },
    });

    // JWT 토큰 생성
    const payload: JwtPayload = {
      sub: newMember.id,
      username: newMember.username,
      grade: newMember.grade,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: newMember,
    };
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const member = await this.prisma.member.findUnique({
      where: { username },
      select: { id: true },
    });

    return !!member;
  }

  async getProfile(userId: number) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        addressDetail: true,
        postalCode: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        cumulativePv: true,
        recommender: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            grade: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            grade: true,
          },
        },
        teamLine: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return member;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // 새 비밀번호 확인
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('새 비밀번호와 비밀번호 확인이 일치하지 않습니다');
    }

    // 현재 사용자 조회
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!member) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(currentPassword, member.password);
    if (!isPasswordValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다');
    }

    // 새 비밀번호 해싱 및 업데이트
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.member.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '비밀번호가 성공적으로 변경되었습니다' };
  }
}
