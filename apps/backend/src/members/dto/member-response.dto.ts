import { ApiProperty } from '@nestjs/swagger';
import { MemberGrade } from '@prisma/client';

export class MemberResponseDto {
  @ApiProperty({ description: '회원 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '이메일', example: 'user@kaion.com' })
  email: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '생년월일', example: '1990-01-01', nullable: true })
  birthDate: Date | null;

  @ApiProperty({ description: '회원 등급', enum: MemberGrade, example: MemberGrade.SALESPERSON })
  grade: MemberGrade;

  @ApiProperty({ description: '추천인 ID', example: 1, nullable: true })
  recommenderId: number | null;

  @ApiProperty({ description: '후원인 ID', example: 1, nullable: true })
  sponsorId: number | null;

  @ApiProperty({ description: '팀 라인', example: 1, nullable: true })
  teamLine: number | null;

  @ApiProperty({ description: '누적 PV', example: 500000 })
  cumulativePv: number;

  @ApiProperty({ description: '에이전트 승급일', example: '2024-06-01', nullable: true })
  agentPromotedAt: Date | null;

  @ApiProperty({ description: '은행명', example: '국민은행', nullable: true })
  bankName: string | null;

  @ApiProperty({ description: '계좌번호', example: '123-456-789012', nullable: true })
  accountNumber: string | null;

  @ApiProperty({ description: '예금주명', example: '홍길동', nullable: true })
  accountHolder: string | null;

  @ApiProperty({ description: '우편번호', example: '06234', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123', nullable: true })
  address: string | null;

  @ApiProperty({ description: '상세주소', example: '456호', nullable: true })
  addressDetail: string | null;

  @ApiProperty({ description: '활성 상태', example: true })
  isActive: boolean;

  @ApiProperty({ description: '이메일 인증 여부', example: false })
  emailVerified: boolean;

  @ApiProperty({ description: '생성일', example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2025-01-01T00:00:00Z' })
  updatedAt: Date;
}
