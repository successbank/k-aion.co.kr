import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CheckUsernameDto {
  @ApiProperty({
    description: '중복 확인할 아이디',
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
}
