import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsNumber,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '아이디 (영문 소문자 시작, 영문/숫자/특수문자(_,-) 사용)',
    example: 'testuser',
    minLength: 4,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력해주세요' })
  @MinLength(4, { message: '아이디는 최소 4글자 이상이어야 합니다' })
  @MaxLength(50, { message: '아이디는 최대 50글자까지 가능합니다' })
  @Matches(/^[a-z][a-z0-9_-]{3,49}$/, {
    message: '아이디는 영문 소문자로 시작하며, 영문/숫자/언더스코어/하이픈만 사용 가능합니다',
  })
  username: string;

  @ApiProperty({
    description: '비밀번호 (최소 4자)',
    example: '1234',
    minLength: 4,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
  password: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다' })
  name: string;

  @ApiProperty({
    description: '전화번호 (010-1234-5678 또는 01012345678 형식)',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다' })
  @Matches(/^01[0-9](-\d{3,4}-\d{4}|\d{7,8})$/, {
    message: '전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678 또는 01012345678)',
  })
  phone: string;

  @ApiProperty({
    description: '추천인 ID',
    example: 1,
  })
  @IsNotEmpty({ message: '추천인을 선택해주세요' })
  @IsNumber()
  recommenderId: number;

  @ApiProperty({
    description: '후원인 ID',
    example: 1,
  })
  @IsNotEmpty({ message: '후원인을 선택해주세요' })
  @IsNumber()
  sponsorId: number;

  @ApiProperty({
    description: '센터명',
    example: '서울센터',
  })
  @IsNotEmpty({ message: '센터를 입력해주세요' })
  @IsString()
  @MaxLength(100, { message: '센터명은 최대 100글자까지 가능합니다' })
  centerName: string;

  @ApiPropertyOptional({
    description: '주소',
    example: '서울특별시 강남구',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: '상세 주소',
    example: '테헤란로 123, 456호',
  })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({
    description: '우편번호',
    example: '06234',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;
}
