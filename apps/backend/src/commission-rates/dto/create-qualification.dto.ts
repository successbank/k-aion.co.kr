import { IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { MemberGrade, QualificationType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQualificationDto {
  @ApiProperty({
    enum: QualificationType,
    description: '자격 조건 유형',
    example: QualificationType.MINIMUM_GRADE,
  })
  @IsEnum(QualificationType)
  qualificationType: QualificationType;

  @ApiPropertyOptional({
    enum: MemberGrade,
    description: '필요한 최소 등급',
    example: MemberGrade.AGENT,
  })
  @IsOptional()
  @IsEnum(MemberGrade)
  requiredGrade?: MemberGrade;

  @ApiPropertyOptional({
    description: '필요한 인원 수',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  requiredCount?: number;

  @ApiPropertyOptional({
    description: '필요한 팀 수',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  requiredTeamCount?: number;

  @ApiPropertyOptional({
    description: '팀당 최소 인원',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minMembersPerTeam?: number;

  @ApiPropertyOptional({
    description: '사무실 필요 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresOffice?: boolean = false;

  @ApiPropertyOptional({
    description: '세미나 필요 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresSeminar?: boolean = false;

  @ApiPropertyOptional({
    description: '법인 필요 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresCorporation?: boolean = false;

  @ApiPropertyOptional({
    description: 'TV 필요 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresTV?: boolean = false;
}
