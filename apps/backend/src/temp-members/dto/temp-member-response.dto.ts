import { ApiProperty } from '@nestjs/swagger';

export class TempMemberResponseDto {
  @ApiProperty({ description: '임시회원 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '아이디', example: 'user123' })
  username: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '주민번호', example: '900101-1234567' })
  residentNumber: string;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678' })
  phone: string;

  @ApiProperty({ description: '우편번호', example: '06234', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123', nullable: true })
  address: string | null;

  @ApiProperty({ description: '상세주소', example: '456호', nullable: true })
  addressDetail: string | null;

  @ApiProperty({ description: '은행명', example: '국민은행', nullable: true })
  bankName: string | null;

  @ApiProperty({ description: '계좌번호', example: '123-456-789012', nullable: true })
  accountNumber: string | null;

  @ApiProperty({ description: '예금주명', example: '홍길동', nullable: true })
  accountHolder: string | null;

  @ApiProperty({ description: '추천인 전화번호', example: '010-1234-5678', nullable: true })
  recommenderPhone: string | null;

  @ApiProperty({ description: '후원인 전화번호', example: '010-9876-5432', nullable: true })
  sponsorPhone: string | null;

  @ApiProperty({ description: '소속지점(센터)', example: '서울지점', nullable: true })
  centerName: string | null;

  @ApiProperty({ description: '실제 시스템으로 이전 여부', example: false })
  isMigrated: boolean;

  @ApiProperty({ description: '생성일', example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2025-01-01T00:00:00Z' })
  updatedAt: Date;
}
