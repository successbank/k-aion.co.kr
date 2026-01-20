import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  MinLength,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberGrade } from '@prisma/client';

export class CreateMemberDto {
  @ApiProperty({ description: '아이디', example: 'admin' })
  @IsString()
  @Length(4, 50, { message: '아이디는 4-50자 사이여야 합니다' })
  username: string;

  @ApiProperty({ description: '이메일', example: 'user@kaion.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email?: string;

  @ApiProperty({ description: '비밀번호', example: '1234' })
  @IsString()
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
  password: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  @IsString()
  @Length(2, 100, { message: '이름은 2-100자 사이여야 합니다' })
  name: string;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9](-?\d{3,4}-?\d{4}|\d{7,8})$/, {
    message: '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678 또는 01012345678)',
  })
  phone?: string;

  @ApiProperty({ description: '생년월일', example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString({}, { message: '유효한 날짜 형식(YYYY-MM-DD)을 입력해주세요' })
  birthDate?: string;

  @ApiProperty({
    description: '회원 등급',
    enum: MemberGrade,
    example: MemberGrade.MEMBER,
    required: false,
  })
  @IsOptional()
  @IsEnum(MemberGrade, { message: '유효한 등급을 선택해주세요' })
  grade?: MemberGrade;

  @ApiProperty({ description: '추천인 ID', example: 1, required: false })
  @IsOptional()
  @IsInt()
  recommenderId?: number;

  @ApiProperty({ description: '후원인 ID', example: 1, required: false })
  @IsOptional()
  @IsInt()
  sponsorId?: number;

  @ApiProperty({
    description: '팀 라인 (1, 2, 3)',
    example: 1,
    minimum: 1,
    maximum: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  teamLine?: number;

  @ApiProperty({ description: '은행명', example: '국민은행', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: '계좌번호', example: '123-456-789012', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ description: '예금주명', example: '홍길동', required: false })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiProperty({ description: '우편번호', example: '06234', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: '주소', example: '서울시 강남구 테헤란로 123', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: '상세주소', example: '456호', required: false })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiProperty({ description: '소속 센터명', example: '강남센터', required: false })
  @IsOptional()
  @IsString()
  centerName?: string;
}
