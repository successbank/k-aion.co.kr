import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IntegrityReport,
  IntegrityViolations,
  CircularReferenceViolation,
  OrphanNodeViolation,
  TeamLineViolation,
  SelfReferenceViolation,
  InactiveParentViolation,
  FixReport,
  FailedFix,
  ViolationType,
  TreeType,
} from './dto/integrity-report.dto';

@Injectable()
export class IntegrityCheckService {
  private readonly logger = new Logger(IntegrityCheckService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 전체 무결성 검사 실행
   * @param autoFix 자동 수정 여부
   * @returns 무결성 검사 리포트
   */
  async runFullIntegrityCheck(autoFix: boolean = false): Promise<IntegrityReport> {
    this.logger.log(`무결성 검사 시작 (자동 수정: ${autoFix})`);

    const totalMembers = await this.prisma.member.count({ where: { isActive: true } });

    // 모든 검사 병렬 실행
    const [
      circularReferences,
      orphanNodes,
      invalidTeamLines,
      selfReferences,
      inactiveParentReferences,
    ] = await Promise.all([
      this.checkCircularReferences(),
      this.checkOrphanNodes(),
      this.checkInvalidTeamLines(),
      this.checkSelfReferences(),
      this.checkInactiveParentReferences(),
    ]);

    const violations: IntegrityViolations = {
      circularReferences,
      orphanNodes,
      invalidTeamLines,
      selfReferences,
      inactiveParentReferences,
    };

    const totalViolations =
      circularReferences.length +
      orphanNodes.length +
      invalidTeamLines.length +
      selfReferences.length +
      inactiveParentReferences.length;

    let fixes: FixReport | undefined;

    if (autoFix && totalViolations > 0) {
      fixes = await this.autoFixViolations(violations);
      this.logger.log(`자동 수정 완료: ${fixes.totalFixed}건 수정됨`);
    }

    const report: IntegrityReport = {
      executedAt: new Date().toISOString(),
      totalMembers,
      summary: {
        circularReferences: circularReferences.length,
        orphanNodes: orphanNodes.length,
        invalidTeamLines: invalidTeamLines.length,
        selfReferences: selfReferences.length,
        inactiveParentReferences: inactiveParentReferences.length,
        totalViolations,
      },
      violations,
      fixes,
      healthy: totalViolations === 0 || (fixes?.totalFixed === totalViolations),
    };

    this.logger.log(
      `무결성 검사 완료: 총 ${totalViolations}건 위반 발견 (건강: ${report.healthy})`,
    );

    return report;
  }

  /**
   * 순환 참조 검사
   * A→B→C→A 형태의 계보 루프 탐지
   */
  async checkCircularReferences(): Promise<CircularReferenceViolation[]> {
    const violations: CircularReferenceViolation[] = [];

    // 모든 회원 조회
    const members = await this.prisma.member.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sponsorId: true,
        recommenderId: true,
      },
    });

    const memberMap = new Map(members.map((m) => [m.id, m]));

    // 후원 계보 순환 검사
    const sponsorCycles = this.detectCycles(members, 'sponsorId', memberMap);
    for (const cycle of sponsorCycles) {
      const member = memberMap.get(cycle[0]);
      if (member) {
        violations.push({
          type: ViolationType.CIRCULAR_REFERENCE,
          memberId: member.id,
          memberName: member.name,
          description: `후원 계보 순환 참조: ${cycle.join(' → ')}`,
          cycle,
          treeType: 'sponsor',
        });
      }
    }

    // 추천 계보 순환 검사 비활성화 (추천계보 미사용으로 전환됨)
    // const recommenderCycles = this.detectCycles(members, 'recommenderId', memberMap);
    // for (const cycle of recommenderCycles) {
    //   ...
    // }

    return violations;
  }

  /**
   * 순환 참조 탐지 알고리즘 (Floyd's Cycle Detection)
   */
  private detectCycles(
    members: Array<{ id: number; sponsorId: number | null; recommenderId: number | null }>,
    field: 'sponsorId' | 'recommenderId',
    memberMap: Map<number, { id: number; name: string; sponsorId: number | null; recommenderId: number | null }>,
  ): number[][] {
    const cycles: number[][] = [];
    const visited = new Set<number>();
    const inStack = new Set<number>();

    for (const member of members) {
      if (!visited.has(member.id)) {
        const cycle = this.dfsDetectCycle(member.id, field, memberMap, visited, inStack, []);
        if (cycle.length > 0) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  /**
   * DFS를 이용한 순환 탐지
   */
  private dfsDetectCycle(
    nodeId: number,
    field: 'sponsorId' | 'recommenderId',
    memberMap: Map<number, { id: number; name: string; sponsorId: number | null; recommenderId: number | null }>,
    visited: Set<number>,
    inStack: Set<number>,
    path: number[],
  ): number[] {
    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const member = memberMap.get(nodeId);
    const parentId = member?.[field];

    if (parentId !== null && parentId !== undefined) {
      if (inStack.has(parentId)) {
        // 순환 발견
        const cycleStart = path.indexOf(parentId);
        return [...path.slice(cycleStart), parentId];
      }
      if (!visited.has(parentId) && memberMap.has(parentId)) {
        const cycle = this.dfsDetectCycle(parentId, field, memberMap, visited, inStack, path);
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }

    inStack.delete(nodeId);
    path.pop();
    return [];
  }

  /**
   * 고아 노드 검사
   * 존재하지 않는 회원 ID 참조 탐지
   */
  async checkOrphanNodes(): Promise<OrphanNodeViolation[]> {
    const violations: OrphanNodeViolation[] = [];

    // 존재하지 않는 sponsorId 참조
    const orphanSponsors = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; sponsor_id: number }>
    >`
      SELECT m.id, m.name, m.sponsor_id
      FROM members m
      WHERE m.is_active = true
        AND m.sponsor_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM members s WHERE s.id = m.sponsor_id)
    `;

    for (const orphan of orphanSponsors) {
      violations.push({
        type: ViolationType.ORPHAN_NODE,
        memberId: orphan.id,
        memberName: orphan.name,
        description: `존재하지 않는 후원인 ID 참조: ${orphan.sponsor_id}`,
        fieldName: 'sponsorId',
        invalidReferenceId: orphan.sponsor_id,
      });
    }

    // 존재하지 않는 recommenderId 참조
    const orphanRecommenders = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; recommender_id: number }>
    >`
      SELECT m.id, m.name, m.recommender_id
      FROM members m
      WHERE m.is_active = true
        AND m.recommender_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM members r WHERE r.id = m.recommender_id)
    `;

    for (const orphan of orphanRecommenders) {
      violations.push({
        type: ViolationType.ORPHAN_NODE,
        memberId: orphan.id,
        memberName: orphan.name,
        description: `존재하지 않는 추천인 ID 참조: ${orphan.recommender_id}`,
        fieldName: 'recommenderId',
        invalidReferenceId: orphan.recommender_id,
      });
    }

    return violations;
  }

  /**
   * 유효하지 않은 팀라인 검사
   * teamLine이 1, 2, 3 이외의 값인 경우 탐지
   */
  async checkInvalidTeamLines(): Promise<TeamLineViolation[]> {
    const violations: TeamLineViolation[] = [];

    const invalidTeamLines = await this.prisma.member.findMany({
      where: {
        isActive: true,
        teamLine: {
          notIn: [1, 2, 3],
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        teamLine: true,
      },
    });

    for (const member of invalidTeamLines) {
      violations.push({
        type: ViolationType.INVALID_TEAM_LINE,
        memberId: member.id,
        memberName: member.name,
        description: `유효하지 않은 팀라인 값: ${member.teamLine} (허용값: 1, 2, 3)`,
        currentValue: member.teamLine!,
      });
    }

    return violations;
  }

  /**
   * 자기 참조 검사
   * sponsorId = id 또는 recommenderId = id인 경우 탐지
   */
  async checkSelfReferences(): Promise<SelfReferenceViolation[]> {
    const violations: SelfReferenceViolation[] = [];

    // sponsorId = id 검사
    const selfSponsors = await this.prisma.$queryRaw<Array<{ id: number; name: string }>>`
      SELECT id, name FROM members
      WHERE is_active = true AND sponsor_id = id
    `;

    for (const member of selfSponsors) {
      violations.push({
        type: ViolationType.SELF_REFERENCE,
        memberId: member.id,
        memberName: member.name,
        description: `자기 자신을 후원인으로 참조`,
        fieldName: 'sponsorId',
      });
    }

    // recommenderId = id 검사
    const selfRecommenders = await this.prisma.$queryRaw<Array<{ id: number; name: string }>>`
      SELECT id, name FROM members
      WHERE is_active = true AND recommender_id = id
    `;

    for (const member of selfRecommenders) {
      violations.push({
        type: ViolationType.SELF_REFERENCE,
        memberId: member.id,
        memberName: member.name,
        description: `자기 자신을 추천인으로 참조`,
        fieldName: 'recommenderId',
      });
    }

    return violations;
  }

  /**
   * 비활성 상위자 참조 검사
   * isActive=false인 상위자를 참조하는 경우 탐지
   */
  async checkInactiveParentReferences(): Promise<InactiveParentViolation[]> {
    const violations: InactiveParentViolation[] = [];

    // 비활성 후원인 참조
    const inactiveSponsors = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; sponsor_id: number; sponsor_name: string }>
    >`
      SELECT m.id, m.name, s.id as sponsor_id, s.name as sponsor_name
      FROM members m
      JOIN members s ON m.sponsor_id = s.id
      WHERE m.is_active = true AND s.is_active = false
    `;

    for (const member of inactiveSponsors) {
      violations.push({
        type: ViolationType.INACTIVE_PARENT,
        memberId: member.id,
        memberName: member.name,
        description: `비활성 후원인 참조: ${member.sponsor_name} (ID: ${member.sponsor_id})`,
        fieldName: 'sponsorId',
        parentId: member.sponsor_id,
        parentName: member.sponsor_name,
      });
    }

    // 비활성 추천인 참조
    const inactiveRecommenders = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; recommender_id: number; recommender_name: string }>
    >`
      SELECT m.id, m.name, r.id as recommender_id, r.name as recommender_name
      FROM members m
      JOIN members r ON m.recommender_id = r.id
      WHERE m.is_active = true AND r.is_active = false
    `;

    for (const member of inactiveRecommenders) {
      violations.push({
        type: ViolationType.INACTIVE_PARENT,
        memberId: member.id,
        memberName: member.name,
        description: `비활성 추천인 참조: ${member.recommender_name} (ID: ${member.recommender_id})`,
        fieldName: 'recommenderId',
        parentId: member.recommender_id,
        parentName: member.recommender_name,
      });
    }

    return violations;
  }

  /**
   * 자동 수정 실행
   */
  async autoFixViolations(violations: IntegrityViolations): Promise<FixReport> {
    const fixedByType: Record<string, number> = {
      [ViolationType.CIRCULAR_REFERENCE]: 0,
      [ViolationType.ORPHAN_NODE]: 0,
      [ViolationType.INVALID_TEAM_LINE]: 0,
      [ViolationType.SELF_REFERENCE]: 0,
      [ViolationType.INACTIVE_PARENT]: 0,
    };
    const failedFixes: FailedFix[] = [];
    let totalFixed = 0;

    // 트랜잭션으로 모든 수정 실행
    await this.prisma.$transaction(async (tx) => {
      // 1. 순환 참조 수정 - 루프의 마지막 노드 sponsorId/recommenderId를 null로
      for (const violation of violations.circularReferences) {
        try {
          // 순환의 마지막 노드 (cycle 배열에서 마지막에서 두 번째)
          const lastNodeId = violation.cycle[violation.cycle.length - 2];
          const updateData =
            violation.treeType === 'sponsor'
              ? { sponsorId: null, teamLine: null }
              : { recommenderId: null };

          await tx.member.update({
            where: { id: lastNodeId },
            data: updateData,
          });

          fixedByType[ViolationType.CIRCULAR_REFERENCE]++;
          totalFixed++;
          this.logger.log(
            `순환 참조 수정: 회원 ID ${lastNodeId}의 ${violation.treeType}Id를 null로 설정`,
          );
        } catch (error) {
          failedFixes.push({
            memberId: violation.memberId,
            memberName: violation.memberName,
            violationType: ViolationType.CIRCULAR_REFERENCE,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 2. 고아 노드 수정 - 존재하지 않는 참조를 null로
      for (const violation of violations.orphanNodes) {
        try {
          const updateData =
            violation.fieldName === 'sponsorId'
              ? { sponsorId: null, teamLine: null }
              : { recommenderId: null };

          await tx.member.update({
            where: { id: violation.memberId },
            data: updateData,
          });

          fixedByType[ViolationType.ORPHAN_NODE]++;
          totalFixed++;
          this.logger.log(
            `고아 노드 수정: 회원 ID ${violation.memberId}의 ${violation.fieldName}를 null로 설정`,
          );
        } catch (error) {
          failedFixes.push({
            memberId: violation.memberId,
            memberName: violation.memberName,
            violationType: ViolationType.ORPHAN_NODE,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 3. 유효하지 않은 팀라인 수정 - teamLine을 null로
      for (const violation of violations.invalidTeamLines) {
        try {
          await tx.member.update({
            where: { id: violation.memberId },
            data: { teamLine: null },
          });

          fixedByType[ViolationType.INVALID_TEAM_LINE]++;
          totalFixed++;
          this.logger.log(
            `유효하지 않은 팀라인 수정: 회원 ID ${violation.memberId}의 teamLine을 null로 설정`,
          );
        } catch (error) {
          failedFixes.push({
            memberId: violation.memberId,
            memberName: violation.memberName,
            violationType: ViolationType.INVALID_TEAM_LINE,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 4. 자기 참조 수정 - sponsorId/recommenderId를 null로
      for (const violation of violations.selfReferences) {
        try {
          const updateData =
            violation.fieldName === 'sponsorId'
              ? { sponsorId: null, teamLine: null }
              : { recommenderId: null };

          await tx.member.update({
            where: { id: violation.memberId },
            data: updateData,
          });

          fixedByType[ViolationType.SELF_REFERENCE]++;
          totalFixed++;
          this.logger.log(
            `자기 참조 수정: 회원 ID ${violation.memberId}의 ${violation.fieldName}를 null로 설정`,
          );
        } catch (error) {
          failedFixes.push({
            memberId: violation.memberId,
            memberName: violation.memberName,
            violationType: ViolationType.SELF_REFERENCE,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // 5. 비활성 상위자 참조 수정 - sponsorId/recommenderId를 null로
      for (const violation of violations.inactiveParentReferences) {
        try {
          const updateData =
            violation.fieldName === 'sponsorId'
              ? { sponsorId: null, teamLine: null }
              : { recommenderId: null };

          await tx.member.update({
            where: { id: violation.memberId },
            data: updateData,
          });

          fixedByType[ViolationType.INACTIVE_PARENT]++;
          totalFixed++;
          this.logger.log(
            `비활성 상위자 참조 수정: 회원 ID ${violation.memberId}의 ${violation.fieldName}를 null로 설정`,
          );
        } catch (error) {
          failedFixes.push({
            memberId: violation.memberId,
            memberName: violation.memberName,
            violationType: ViolationType.INACTIVE_PARENT,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    return {
      totalFixed,
      fixedByType,
      failedFixes,
    };
  }

  /**
   * 무결성 검사 이력 저장
   */
  async saveCheckHistory(
    report: IntegrityReport,
    adminId?: number,
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        memberId: adminId || 1, // 시스템 자동 실행 시 기본 admin ID
        action: 'INTEGRITY_CHECK',
        targetType: 'SYSTEM',
        targetId: null,
        details: {
          executedAt: report.executedAt,
          totalMembers: report.totalMembers,
          summary: { ...report.summary },
          healthy: report.healthy,
          wasAutoFixed: !!report.fixes,
          fixedCount: report.fixes?.totalFixed || 0,
        } as any,
      },
    });
  }

  /**
   * 무결성 검사 이력 조회
   */
  async getCheckHistory(params: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: number;
      executedAt: string;
      executedBy: { id: number; name: string } | null;
      totalMembers: number;
      totalViolations: number;
      wasAutoFixed: boolean;
      fixedCount: number;
      healthy: boolean;
    }>;
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: {
          action: 'INTEGRITY_CHECK',
          targetType: 'SYSTEM',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          member: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          action: 'INTEGRITY_CHECK',
          targetType: 'SYSTEM',
        },
      }),
    ]);

    const data = logs.map((log) => {
      const details = log.details as Record<string, any> | null;
      return {
        id: log.id,
        executedAt: details?.executedAt || log.createdAt.toISOString(),
        executedBy: log.member ? { id: log.member.id, name: log.member.name } : null,
        totalMembers: details?.totalMembers || 0,
        totalViolations: details?.summary?.totalViolations || 0,
        wasAutoFixed: details?.wasAutoFixed || false,
        fixedCount: details?.fixedCount || 0,
        healthy: details?.healthy || false,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
