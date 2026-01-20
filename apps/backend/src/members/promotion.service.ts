import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberGrade } from '@prisma/client';

/**
 * 승급 조건 서비스 (신규 등급 체계)
 *
 * 승급 규칙:
 * 1. SALESPERSON → TEAM_LEADER: 직접 소개 판매원 10명 (한시적 3명)
 * 2. TEAM_LEADER → BRANCH_MANAGER: 직접 소개 팀장 10명 (한시적 3명)
 * 3. BRANCH_MANAGER → CENTER: 관리자 수동 지정
 * 4. CENTER → ADMIN: 시스템 관리자만 수동 처리
 */
@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 한시적 조건 활성화 여부 확인
   */
  private async isTemporaryConditionActive(): Promise<boolean> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'PROMOTION_TEMPORARY_CONDITION_ACTIVE' },
    });
    return config?.value === 'true';
  }

  /**
   * 승급에 필요한 인원 수 조회
   */
  private async getRequiredCount(gradeType: 'SALESPERSON_TO_TEAM_LEADER' | 'TEAM_LEADER_TO_BRANCH_MANAGER'): Promise<number> {
    const isTemporary = await this.isTemporaryConditionActive();
    if (isTemporary) {
      const configKey = gradeType === 'SALESPERSON_TO_TEAM_LEADER'
        ? 'SALESPERSON_TO_TEAM_LEADER_COUNT'
        : 'TEAM_LEADER_TO_BRANCH_MANAGER_COUNT';

      const config = await this.prisma.systemConfig.findUnique({
        where: { key: configKey },
      });
      return parseInt(config?.value || '3', 10);
    }
    return 10; // 정상 조건
  }

  /**
   * 회원의 승급 가능 여부 확인
   */
  async checkPromotionEligibility(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
    progress?: { current: number; required: number };
  }> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        grade: true,
        cumulativePv: true,
      },
    });

    if (!member) {
      return { eligible: false, currentGrade: MemberGrade.SALESPERSON };
    }

    // 현재 등급에 따른 승급 조건 확인
    switch (member.grade) {
      case MemberGrade.SALESPERSON:
        return this.checkSalespersonToTeamLeader(member.id);

      case MemberGrade.TEAM_LEADER:
        return this.checkTeamLeaderToBranchManager(member.id);

      case MemberGrade.BRANCH_MANAGER:
        return {
          eligible: false,
          currentGrade: member.grade,
          criteria: 'CENTER 승급은 관리자가 수동으로 지정합니다',
        };

      case MemberGrade.CENTER:
        return {
          eligible: false,
          currentGrade: member.grade,
          criteria: 'ADMIN 승급은 시스템 관리자만 수동으로 처리합니다',
        };

      case MemberGrade.ADMIN:
        return {
          eligible: false,
          currentGrade: member.grade,
          criteria: '이미 최고 등급입니다',
        };

      default:
        return { eligible: false, currentGrade: member.grade };
    }
  }

  /**
   * SALESPERSON → TEAM_LEADER 승급 조건 확인
   * 조건: 직속 후원 회원 중 판매원 10명 (한시적 3명)
   * (기존 추천계보에서 후원계보로 전환됨)
   */
  private async checkSalespersonToTeamLeader(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
    progress?: { current: number; required: number };
  }> {
    const requiredCount = await this.getRequiredCount('SALESPERSON_TO_TEAM_LEADER');

    // 직속 후원 회원 중 SALESPERSON 이상 등급 회원 수 확인 (후원계보로 전환)
    const salespersonCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId, // recommenderId → sponsorId 변경
        grade: {
          in: [
            MemberGrade.SALESPERSON,
            MemberGrade.TEAM_LEADER,
            MemberGrade.BRANCH_MANAGER,
            MemberGrade.CENTER,
          ],
        },
        isActive: true,
      },
    });

    const eligible = salespersonCount >= requiredCount;
    const isTemporary = await this.isTemporaryConditionActive();

    return {
      eligible,
      currentGrade: MemberGrade.SALESPERSON,
      nextGrade: eligible ? MemberGrade.TEAM_LEADER : undefined,
      criteria: `직속 후원 판매원 ${requiredCount}명 필요${isTemporary ? ' (한시적 조건)' : ''} (현재: ${salespersonCount}명)`,
      progress: { current: salespersonCount, required: requiredCount },
    };
  }

  /**
   * TEAM_LEADER → BRANCH_MANAGER 승급 조건 확인
   * 조건: 직속 후원 회원 중 팀장 10명 (한시적 3명)
   * (기존 추천계보에서 후원계보로 전환됨)
   */
  private async checkTeamLeaderToBranchManager(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
    progress?: { current: number; required: number };
  }> {
    const requiredCount = await this.getRequiredCount('TEAM_LEADER_TO_BRANCH_MANAGER');

    // 직속 후원 회원 중 TEAM_LEADER 이상 등급 회원 수 확인 (후원계보로 전환)
    const teamLeaderCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId, // recommenderId → sponsorId 변경
        grade: {
          in: [
            MemberGrade.TEAM_LEADER,
            MemberGrade.BRANCH_MANAGER,
            MemberGrade.CENTER,
          ],
        },
        isActive: true,
      },
    });

    const eligible = teamLeaderCount >= requiredCount;
    const isTemporary = await this.isTemporaryConditionActive();

    return {
      eligible,
      currentGrade: MemberGrade.TEAM_LEADER,
      nextGrade: eligible ? MemberGrade.BRANCH_MANAGER : undefined,
      criteria: `직속 후원 팀장 ${requiredCount}명 필요${isTemporary ? ' (한시적 조건)' : ''} (현재: ${teamLeaderCount}명)`,
      progress: { current: teamLeaderCount, required: requiredCount },
    };
  }

  /**
   * 자동 승급 처리
   * 승급 조건을 만족하면 자동으로 등급 상승
   */
  async promoteIfEligible(memberId: number): Promise<{
    promoted: boolean;
    previousGrade?: MemberGrade;
    newGrade?: MemberGrade;
    message?: string;
  }> {
    const eligibility = await this.checkPromotionEligibility(memberId);

    if (!eligibility.eligible || !eligibility.nextGrade) {
      return {
        promoted: false,
        message: eligibility.criteria || '승급 조건을 만족하지 않습니다',
      };
    }

    // 승급 처리
    await this.prisma.member.update({
      where: { id: memberId },
      data: { grade: eligibility.nextGrade },
      select: { id: true, name: true, email: true, grade: true },
    });

    this.logger.log(
      `회원 ID ${memberId} 자동 승급: ${eligibility.currentGrade} → ${eligibility.nextGrade}`,
    );

    return {
      promoted: true,
      previousGrade: eligibility.currentGrade,
      newGrade: eligibility.nextGrade,
      message: `승급 완료: ${this.getGradeKorean(eligibility.nextGrade)}`,
    };
  }

  /**
   * 전체 회원의 승급 가능 여부 일괄 확인 및 처리
   * 주기적으로 실행하여 자동 승급 처리
   */
  async processBatchPromotion(): Promise<{
    processed: number;
    promoted: number;
    details: Array<{
      memberId: number;
      name: string;
      previousGrade: MemberGrade;
      newGrade: MemberGrade;
    }>;
  }> {
    this.logger.log('일괄 승급 처리 시작...');

    // ADMIN, CENTER, BRANCH_MANAGER 제외한 모든 활성 회원 조회
    // (자동 승급 대상: SALESPERSON, TEAM_LEADER)
    const members = await this.prisma.member.findMany({
      where: {
        isActive: true,
        grade: {
          in: [MemberGrade.SALESPERSON, MemberGrade.TEAM_LEADER],
        },
      },
      select: { id: true, name: true, email: true, grade: true },
    });

    let promoted = 0;
    const details: Array<{
      memberId: number;
      name: string;
      previousGrade: MemberGrade;
      newGrade: MemberGrade;
    }> = [];

    for (const member of members) {
      const result = await this.promoteIfEligible(member.id);

      if (result.promoted && result.previousGrade && result.newGrade) {
        promoted++;
        details.push({
          memberId: member.id,
          name: member.name,
          previousGrade: result.previousGrade,
          newGrade: result.newGrade,
        });
      }
    }

    this.logger.log(`일괄 승급 처리 완료: ${promoted}/${members.length}명 승급`);

    return {
      processed: members.length,
      promoted,
      details,
    };
  }

  /**
   * 등급 한글명 변환
   */
  private getGradeKorean(grade: MemberGrade): string {
    const gradeNames: Record<MemberGrade, string> = {
      [MemberGrade.SALESPERSON]: '판매원',
      [MemberGrade.TEAM_LEADER]: '팀장',
      [MemberGrade.BRANCH_MANAGER]: '지사장',
      [MemberGrade.CENTER]: '센터',
      [MemberGrade.ADMIN]: '관리자',
    };
    return gradeNames[grade] || grade;
  }
}
