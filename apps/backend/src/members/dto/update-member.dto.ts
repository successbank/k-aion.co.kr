import { PartialType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberGrade } from '@prisma/client';

/**
 * 후원인 변경 시 하위 조직 처리 전략
 */
export enum DownlineStrategy {
  /** 하위 조직 함께 이동 (기본값) - 트리 구조상 자동으로 따라감 */
  MOVE_WITH = 'MOVE_WITH',
  /** 기존 상위자에게 재배치 - 직속 하위 회원만 이동 대상의 기존 후원인에게 재배치 */
  REASSIGN = 'REASSIGN',
  /** 하위 조직 분리 (최상위로) - 직속 하위 회원의 sponsorId를 null로 설정 */
  DETACH = 'DETACH',
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  // password는 별도의 비밀번호 변경 API에서만 처리하므로 여기서는 제외
  password?: never;

  @ApiProperty({
    description: '회원 등급 (ADMIN 전용)',
    enum: MemberGrade,
    required: false,
  })
  @IsOptional()
  @IsEnum(MemberGrade)
  grade?: MemberGrade;

  @ApiProperty({
    description: '활성화 상태',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: '후원인 변경 시 하위 조직 처리 전략',
    enum: DownlineStrategy,
    default: DownlineStrategy.MOVE_WITH,
    required: false,
    example: DownlineStrategy.MOVE_WITH,
  })
  @IsOptional()
  @IsEnum(DownlineStrategy)
  downlineStrategy?: DownlineStrategy;
}
