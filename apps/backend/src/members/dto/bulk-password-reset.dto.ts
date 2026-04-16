import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Equals, IsOptional } from 'class-validator';

/**
 * 전체 회원 비밀번호 일괄 초기화 DTO
 * ADMIN 전용: ADMIN을 제외한 모든 활성 회원의 비밀번호를 "12341234"로 초기화
 */
export class BulkPasswordResetDto {
  @ApiProperty({
    description: '확인 문자열 (RESET_ALL_PASSWORDS 입력 필수)',
    example: 'RESET_ALL_PASSWORDS',
  })
  @IsString()
  @IsNotEmpty({ message: '확인 문자열을 입력해주세요' })
  @Equals('RESET_ALL_PASSWORDS', {
    message: '확인 문자열이 일치하지 않습니다. RESET_ALL_PASSWORDS를 입력해주세요.',
  })
  confirmationText: string;

  @ApiPropertyOptional({
    description: '초기화 사유 (선택)',
    example: '신규 시스템 이전으로 인한 비밀번호 초기화',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * 전체 회원 비밀번호 일괄 초기화 응답 DTO
 */
export class BulkPasswordResetResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '결과 메시지', example: '243명의 회원 비밀번호가 초기화되었습니다' })
  message: string;

  @ApiProperty({ description: '초기화된 회원 수', example: 243 })
  resetCount: number;

  @ApiProperty({ description: '제외된 ADMIN 회원 수', example: 1 })
  excludedAdminCount: number;

  @ApiProperty({ description: '초기화된 비밀번호', example: '12341234' })
  newPassword: string;

  @ApiProperty({ description: '실행 시각', example: '2026-01-21T12:00:00Z' })
  executedAt: string;
}
