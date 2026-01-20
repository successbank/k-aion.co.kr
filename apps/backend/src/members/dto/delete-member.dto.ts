import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';

export enum DownlineHandlingStrategy {
  BLOCK = 'BLOCK', // 하위 회원 있으면 삭제 차단
  REASSIGN = 'REASSIGN', // 하위 회원을 상위 후원인/추천인에게 재할당
  ORPHAN = 'ORPHAN', // 하위 회원의 후원인/추천인을 null로 설정
}

export class DeleteMemberDto {
  @ApiProperty({
    enum: DownlineHandlingStrategy,
    description: '하위 회원 처리 전략',
    example: DownlineHandlingStrategy.BLOCK,
  })
  @IsEnum(DownlineHandlingStrategy)
  downlineStrategy: DownlineHandlingStrategy;

  @ApiPropertyOptional({
    description: '재할당 대상 회원 ID (REASSIGN 전략 시, null이면 삭제 대상의 상위자에게 재할당)',
  })
  @IsOptional()
  @IsNumber()
  reassignToId?: number;

  @ApiPropertyOptional({
    description: '삭제 사유',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteMemberResponseDto {
  @ApiProperty({ description: '결과 메시지' })
  message: string;

  @ApiProperty({ description: '삭제된 회원 ID' })
  deletedMemberId: number;

  @ApiProperty({ description: '삭제된 회원 이름' })
  deletedMemberName: string;

  @ApiProperty({ description: '처리된 하위 회원 수' })
  handledDownlineCount: number;

  @ApiProperty({ enum: DownlineHandlingStrategy, description: '적용된 처리 전략' })
  strategy: DownlineHandlingStrategy;
}
