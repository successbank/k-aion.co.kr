import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTempMemberDto } from './dto/create-temp-member.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { TempMember } from '@prisma/client';

@Injectable()
export class TempMembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 임시 회원 등록
   */
  async create(createTempMemberDto: CreateTempMemberDto): Promise<TempMember> {
    // 아이디 중복 체크 (TempMember + Member)
    const existingTempMember = await this.prisma.tempMember.findUnique({
      where: { username: createTempMemberDto.username },
    });

    if (existingTempMember) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }

    const existingMember = await this.prisma.member.findUnique({
      where: { username: createTempMemberDto.username },
    });

    if (existingMember) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }

    // 임시 회원 생성 (비밀번호는 평문으로 저장)
    return this.prisma.tempMember.create({
      data: {
        username: createTempMemberDto.username,
        password: createTempMemberDto.password, // 평문 저장
        name: createTempMemberDto.name,
        residentNumber: createTempMemberDto.residentNumber,
        phone: createTempMemberDto.phone,
        postalCode: createTempMemberDto.postalCode,
        address: createTempMemberDto.address,
        addressDetail: createTempMemberDto.addressDetail,
        bankName: createTempMemberDto.bankName,
        accountNumber: createTempMemberDto.accountNumber,
        accountHolder: createTempMemberDto.accountHolder,
        recommenderPhone: createTempMemberDto.recommenderPhone,
        sponsorPhone: createTempMemberDto.sponsorPhone,
        centerName: createTempMemberDto.centerName,
      },
    });
  }

  /**
   * 아이디 중복 체크
   */
  async checkUsername(username: string): Promise<{ available: boolean }> {
    const tempMember = await this.prisma.tempMember.findUnique({
      where: { username },
    });

    const member = await this.prisma.member.findUnique({
      where: { username: username },
    });

    return {
      available: !tempMember && !member,
    };
  }

  /**
   * 추천인/후원인 전화번호 검증 (뒷자리 4자리)
   */
  async verifyPhone(verifyPhoneDto: VerifyPhoneDto): Promise<{ valid: boolean; name?: string }> {
    const { phone, lastFourDigits } = verifyPhoneDto;

    // 전화번호 뒷자리 4자리 추출
    const phoneDigits = phone.replace(/\D/g, ''); // 숫자만 추출
    const actualLastFour = phoneDigits.slice(-4);

    if (actualLastFour !== lastFourDigits) {
      return { valid: false };
    }

    // Member 테이블에서 검색
    const member = await this.prisma.member.findFirst({
      where: { phone },
      select: { name: true },
    });

    if (member) {
      return { valid: true, name: member.name };
    }

    // TempMember 테이블에서 검색
    const tempMember = await this.prisma.tempMember.findFirst({
      where: { phone },
      select: { name: true },
    });

    if (tempMember) {
      return { valid: true, name: tempMember.name };
    }

    return { valid: false };
  }

  /**
   * 전화번호 존재 여부 확인 (내부용)
   */
  private async checkPhoneExists(phone: string): Promise<boolean> {
    const member = await this.prisma.member.findFirst({
      where: { phone },
    });

    if (member) return true;

    const tempMember = await this.prisma.tempMember.findFirst({
      where: { phone },
    });

    return !!tempMember;
  }

  /**
   * 임시 회원 목록 조회 (관리자용)
   */
  async findAll(isMigrated?: boolean): Promise<TempMember[]> {
    return this.prisma.tempMember.findMany({
      where: isMigrated !== undefined ? { isMigrated } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 임시 회원 상세 조회 (관리자용)
   */
  async findOne(id: number): Promise<TempMember> {
    const tempMember = await this.prisma.tempMember.findUnique({
      where: { id },
    });

    if (!tempMember) {
      throw new NotFoundException('임시 회원을 찾을 수 없습니다.');
    }

    return tempMember;
  }
}
