import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '사용자 정보',
    example: {
      id: 1,
      username: 'admin',
      email: 'admin@kaion.com',
      name: '최고관리자',
      grade: 'ADMIN',
      phone: '010-1234-5678',
    },
  })
  user: {
    id: number;
    username: string;
    email: string | null;
    name: string;
    grade: string;
    phone: string | null;
  };
}
