import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTempMemberDto {
  @ApiProperty({ description: '아이디', example: 'user123' })
  @IsString()
  @Length(4, 50, { message: '아이디는 4-50자 사이여야 합니다' })
  username: string;

  @ApiProperty({ description: '비밀번호 (평문)', example: 'password123' })
  @IsString()
  @Length(4, 50, { message: '비밀번호는 4-50자 사이여야 합니다' })
  password: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  @IsString()
  @Length(2, 100, { message: '이름은 2-100자 사이여야 합니다' })
  name: string;

  @ApiProperty({ description: '주민번호', example: '900101-1234567' })
  @IsString()
  @Matches(/^\d{6}-\d{7}$/, { message: '주민번호 형식이 올바르지 않습니다 (예: 900101-1234567)' })
  residentNumber: string;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678' })
  @IsString()
  @Length(10, 20, { message: '전화번호는 10-20자 사이여야 합니다' })
  phone: string;

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

  @ApiProperty({ description: '추천인 전화번호', example: '010-1234-5678', required: false })
  @IsOptional()
  @IsString()
  recommenderPhone?: string;

  @ApiProperty({ description: '후원인 전화번호', example: '010-9876-5432', required: false })
  @IsOptional()
  @IsString()
  sponsorPhone?: string;

  @ApiProperty({ description: '소속지점(센터)', example: '서울지점', required: false })
  @IsOptional()
  @IsString()
  centerName?: string;
}
