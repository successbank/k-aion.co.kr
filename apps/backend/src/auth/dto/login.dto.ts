import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '아이디',
    example: 'admin',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력해주세요' })
  @MaxLength(50, { message: '아이디는 최대 50글자까지 가능합니다' })
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: '1234',
    minLength: 4,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
  password: string;
}
