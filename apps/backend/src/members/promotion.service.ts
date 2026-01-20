import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberGrade } from '@prisma/client';

/**
 * 승급 조건 서비스
 *
 * 승급 규칙:
 * 1. MEMBER → AGENT: 누적 PV >= 2,000,000
 * 2. AGENT → MANAGER: 직접 후원 회원 중 AGENT 이상 15명
 * 3. MANAGER → BRANCH_CHIEF: 직접 후원 회원 중 MANAGER 이상 4명
 * 4. BRANCH_CHIEF → DIVISION_CHIEF: 직접 후원 회원 중 BRANCH_CHIEF 이상 5명
 * 5. DIVISION_CHIEF → ADMIN: 수동 승급 (시스템 관리자만)
 */
@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 회원의 승급 가능 여부 확인
   */
  async checkPromotionEligibility(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        grade: true,
        cumulativePv: true,
        agentPromotedAt: true,
      },
    });

    if (!member) {
      return { eligible: false, currentGrade: MemberGrade.MEMBER };
    }

    // 현재 등급에 따른 승급 조건 확인
    switch (member.grade) {
      case MemberGrade.MEMBER:
        return this.checkMemberToAgent(member);

      case MemberGrade.AGENT:
        return this.checkAgentToManager(member.id);

      case MemberGrade.MANAGER:
        return this.checkManagerToBranchChief(member.id);

      case MemberGrade.BRANCH_CHIEF:
        return this.checkBranchChiefToDivisionChief(member.id);

      case MemberGrade.DIVISION_CHIEF:
        return this.checkDivisionChiefToCenter(member.id);

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
   * MEMBER → AGENT 승급 조건 확인
   * 조건: 누적 PV >= 2,000,000
   */
  private async checkMemberToAgent(member: {
    id: number;
    cumulativePv: number;
    agentPromotedAt: Date | null;
  }): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    const eligible = member.cumulativePv >= 2000000 && !member.agentPromotedAt;

    return {
      eligible,
      currentGrade: MemberGrade.MEMBER,
      nextGrade: eligible ? MemberGrade.AGENT : undefined,
      criteria: `누적 PV 2,000,000 이상 (현재: ${member.cumulativePv.toLocaleString()})`,
    };
  }

  /**
   * AGENT → MANAGER 승급 조건 확인
   * 조건: 직접 후원 회원 중 AGENT 이상 15명
   */
  private async checkAgentToManager(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    // 직접 후원 회원 중 AGENT 이상 등급 회원 수 확인
    const agentCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId,
        grade: {
          in: [
            MemberGrade.AGENT,
            MemberGrade.MANAGER,
            MemberGrade.BRANCH_CHIEF,
            MemberGrade.DIVISION_CHIEF,
            MemberGrade.CENTER,
          ],
        },
        isActive: true,
      },
    });

    const eligible = agentCount >= 15;

    return {
      eligible,
      currentGrade: MemberGrade.AGENT,
      nextGrade: eligible ? MemberGrade.MANAGER : undefined,
      criteria: `직접 후원 AGENT 이상 15명 필요 (현재: ${agentCount}명)`,
    };
  }

  /**
   * MANAGER → BRANCH_CHIEF 승급 조건 확인
   * 조건: 직접 후원 회원 중 MANAGER 이상 4명
   */
  private async checkManagerToBranchChief(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    // 직접 후원 회원 중 MANAGER 이상 등급 회원 수 확인
    const managerCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId,
        grade: {
          in: [
            MemberGrade.MANAGER,
            MemberGrade.BRANCH_CHIEF,
            MemberGrade.DIVISION_CHIEF,
            MemberGrade.CENTER,
          ],
        },
        isActive: true,
      },
    });

    const eligible = managerCount >= 4;

    return {
      eligible,
      currentGrade: MemberGrade.MANAGER,
      nextGrade: eligible ? MemberGrade.BRANCH_CHIEF : undefined,
      criteria: `직접 후원 MANAGER 이상 4명 필요 (현재: ${managerCount}명)`,
    };
  }

  /**
   * BRANCH_CHIEF → DIVISION_CHIEF 승급 조건 확인
   * 조건: 직접 후원 회원 중 BRANCH_CHIEF 이상 5명
   */
  private async checkBranchChiefToDivisionChief(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    // 직접 후원 회원 중 BRANCH_CHIEF 이상 등급 회원 수 확인
    const branchChiefCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId,
        grade: {
          in: [MemberGrade.BRANCH_CHIEF, MemberGrade.DIVISION_CHIEF, MemberGrade.CENTER],
        },
        isActive: true,
      },
    });

    const eligible = branchChiefCount >= 5;

    return {
      eligible,
      currentGrade: MemberGrade.BRANCH_CHIEF,
      nextGrade: eligible ? MemberGrade.DIVISION_CHIEF : undefined,
      criteria: `직접 후원 BRANCH_CHIEF 이상 5명 필요 (현재: ${branchChiefCount}명)`,
    };
  }

  /**
   * DIVISION_CHIEF → CENTER 승급 조건 확인
   * 조건: 직접 후원 회원 중 DIVISION_CHIEF 이상 5명
   */
  private async checkDivisionChiefToCenter(memberId: number): Promise<{
    eligible: boolean;
    currentGrade: MemberGrade;
    nextGrade?: MemberGrade;
    criteria?: string;
  }> {
    // 직접 후원 회원 중 DIVISION_CHIEF 이상 등급 회원 수 확인
    const divisionChiefCount = await this.prisma.member.count({
      where: {
        sponsorId: memberId,
        grade: {
          in: [MemberGrade.DIVISION_CHIEF, MemberGrade.CENTER],
        },
        isActive: true,
      },
    });

    const eligible = divisionChiefCount >= 5;

    return {
      eligible,
      currentGrade: MemberGrade.DIVISION_CHIEF,
      nextGrade: eligible ? MemberGrade.CENTER : undefined,
      criteria: `직접 후원 DIVISION_CHIEF 이상 5명 필요 (현재: ${divisionChiefCount}명)`,
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
      message: `승급 완료: ${eligibility.nextGrade}`,
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

    // ADMIN 제외한 모든 활성 회원 조회
    const members = await this.prisma.member.findMany({
      where: {
        isActive: true,
        grade: { not: MemberGrade.ADMIN },
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
}
