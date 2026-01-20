import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
  @ApiProperty({ description: '전화번호', example: '010-1234-5678' })
  @IsString()
  phone: string;

  @ApiProperty({ description: '전화번호 뒷자리 4자리', example: '5678' })
  @IsString()
  @Length(4, 4, { message: '전화번호 뒷자리는 4자리여야 합니다' })
  lastFourDigits: string;
}
