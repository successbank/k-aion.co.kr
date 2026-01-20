import { IsString, IsOptional, IsEmail, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '이름',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  @MaxLength(100, { message: '이름은 최대 100자까지 가능합니다' })
  name?: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'hong@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email?: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9](-\d{3,4}-\d{4}|\d{7,8})$/, {
    message: '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678 또는 01012345678)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '우편번호',
    example: '06234',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: '주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: '상세주소',
    example: '456호',
  })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({
    description: '은행명',
    example: '국민은행',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: '계좌번호',
    example: '123-456-789012',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: '예금주',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  accountHolder?: string;
}
