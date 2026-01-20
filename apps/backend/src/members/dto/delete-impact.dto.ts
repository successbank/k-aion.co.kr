import { ApiProperty } from '@nestjs/swagger';

export class DownlineMemberDto {
  @ApiProperty({ description: '회원 ID' })
  id: number;

  @ApiProperty({ description: '회원 이름' })
  name: string;

  @ApiProperty({ description: '회원 등급' })
  grade: string;

  @ApiProperty({ description: '팀 라인', required: false })
  teamLine?: number;
}

export class DeleteImpactResponseDto {
  @ApiProperty({ description: '삭제 대상 회원 ID' })
  memberId: number;

  @ApiProperty({ description: '삭제 대상 회원 이름' })
  memberName: string;

  @ApiProperty({ description: '삭제 대상 회원 등급' })
  memberGrade: string;

  @ApiProperty({ description: '삭제 가능 여부' })
  canDelete: boolean;

  @ApiProperty({ description: '삭제 불가 사유', required: false })
  blockReason?: string;

  @ApiProperty({ description: '직속 후원 하위 회원 수 (sponsorees)' })
  directSponsoreeCount: number;

  @ApiProperty({ description: '직속 추천 하위 회원 수 (recommendees)' })
  directRecommendeeCount: number;

  @ApiProperty({ description: '전체 후원계보 하위 회원 수 (재귀)' })
  totalSponsorDescendantCount: number;

  @ApiProperty({ description: '전체 추천계보 하위 회원 수 (재귀)' })
  totalRecommenderDescendantCount: number;

  @ApiProperty({ description: '관련 판매 건수' })
  salesCount: number;

  @ApiProperty({ description: '관련 수당 건수' })
  bonusCount: number;

  @ApiProperty({ description: '관련 세미나 건수 (주최)' })
  seminarCount: number;

  @ApiProperty({ description: '상위 후원인 ID (재할당 시 기본 대상)', required: false })
  sponsorId?: number;

  @ApiProperty({ description: '상위 후원인 이름', required: false })
  sponsorName?: string;

  @ApiProperty({ description: '직속 후원 하위 회원 목록 (최대 10명)', type: [DownlineMemberDto] })
  directSponsorees: DownlineMemberDto[];

  @ApiProperty({ description: '직속 추천 하위 회원 목록 (최대 10명)', type: [DownlineMemberDto] })
  directRecommendees: DownlineMemberDto[];
}
