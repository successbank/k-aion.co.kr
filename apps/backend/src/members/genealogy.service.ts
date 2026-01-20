import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberGrade } from '@prisma/client';

/**
 * 계보 관리 서비스 (신규 등급 체계)
 * 추천계보(1:N) 및 후원계보(3팀) 관리
 */
@Injectable()
export class GenealogyService {
  private readonly logger = new Logger(GenealogyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 후원인의 다음 사용 가능한 팀 라인 추천
   * 균형 있는 팀 배치를 위해 가장 적은 인원의 팀 라인 반환
   */
  async suggestTeamLine(sponsorId: number): Promise<number> {
    const teamCounts = await Promise.all(
      [1, 2, 3].map(async (teamLine) => {
        const count = await this.prisma.member.count({
          where: {
            sponsorId,
            teamLine,
            isActive: true,
          },
        });

        return { teamLine, count };
      }),
    );

    // 가장 적은 인원의 팀 라인 반환
    teamCounts.sort((a, b) => a.count - b.count);
    return teamCounts[0].teamLine;
  }

  /**
   * 팀별 회원 수 조회
   */
  async getTeamStatistics(sponsorId: number) {
    const teamStats = await Promise.all(
      [1, 2, 3].map(async (teamLine) => {
        const members = await this.prisma.member.findMany({
          where: {
            sponsorId,
            teamLine,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            cumulativePv: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        const totalPv = members.reduce((sum, m) => sum + m.cumulativePv, 0);

        // 등급별 분포
        const gradeDistribution = members.reduce(
          (acc, m) => {
            acc[m.grade] = (acc[m.grade] || 0) + 1;
            return acc;
          },
          {} as Record<MemberGrade, number>,
        );

        return {
          teamLine,
          memberCount: members.length,
          totalPv,
          gradeDistribution,
          members,
        };
      }),
    );

    const totalMembers = teamStats.reduce((sum, t) => sum + t.memberCount, 0);
    const totalPv = teamStats.reduce((sum, t) => sum + t.totalPv, 0);

    return {
      sponsorId,
      totalMembers,
      totalPv,
      teams: teamStats,
    };
  }

  /**
   * 추천계보 통계
   * @deprecated 추천계보는 더 이상 사용하지 않습니다. 후원계보(getTeamStatistics)를 사용하세요.
   */
  async getRecommenderStatistics(recommenderId: number) {
    // 추천계보는 더 이상 사용하지 않음 - 빈 결과 반환
    this.logger.warn(
      `[DEPRECATED] getRecommenderStatistics 호출됨 (recommenderId: ${recommenderId}). 추천계보는 더 이상 사용하지 않습니다.`,
    );

    return {
      recommenderId,
      totalRecommendees: 0,
      totalPv: 0,
      gradeDistribution: {} as Record<MemberGrade, number>,
      recommendees: [],
    };
  }

  /**
   * 계보 트리 조회 (재귀, 지정된 깊이까지)
   */
  async getGenealogyTree(
    memberId: number,
    depth: number = 100,
    treeType: 'sponsor' | 'recommender' = 'sponsor',
  ): Promise<any> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        cumulativePv: true,
        teamLine: true,
        centerName: true,
      },
    });

    if (!member) {
      throw new BadRequestException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    if (depth === 0) {
      return member;
    }

    const children = await this.getDirectDownline(memberId, treeType);

    const childrenWithTree = await Promise.all(
      children.map(async (child) => {
        return this.getGenealogyTree(child.id, depth - 1, treeType);
      }),
    );

    return {
      ...member,
      children: childrenWithTree,
    };
  }

  /**
   * 직계 하위 회원 조회 (1단계만)
   */
  private async getDirectDownline(memberId: number, treeType: 'sponsor' | 'recommender') {
    const whereClause =
      treeType === 'sponsor' ? { sponsorId: memberId } : { recommenderId: memberId };

    return this.prisma.member.findMany({
      where: {
        ...whereClause,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        cumulativePv: true,
        teamLine: true,
        centerName: true,
      },
      orderBy:
        treeType === 'sponsor' ? [{ teamLine: 'asc' }, { createdAt: 'asc' }] : { createdAt: 'asc' },
    });
  }

  /**
   * 전체 하위 조직 PV 합계 (모든 depth)
   */
  async calculateTotalDownlinePv(
    memberId: number,
    treeType: 'sponsor' | 'recommender' = 'sponsor',
  ): Promise<{ totalPv: number; memberCount: number }> {
    const allDownline = await this.getAllDownlineRecursive(memberId, treeType);

    const totalPv = allDownline.reduce((sum, m) => sum + m.cumulativePv, 0);

    return {
      totalPv,
      memberCount: allDownline.length,
    };
  }

  /**
   * 모든 하위 회원 재귀 조회 (Private)
   */
  private async getAllDownlineRecursive(
    memberId: number,
    treeType: 'sponsor' | 'recommender',
    visited: Set<number> = new Set(),
  ): Promise<Array<{ id: number; cumulativePv: number }>> {
    // 무한 루프 방지
    if (visited.has(memberId)) {
      return [];
    }
    visited.add(memberId);

    const directChildren = await this.getDirectDownline(memberId, treeType);

    let allDownline: Array<{ id: number; cumulativePv: number }> = directChildren.map((c) => ({
      id: c.id,
      cumulativePv: c.cumulativePv,
    }));

    for (const child of directChildren) {
      const childDownline = await this.getAllDownlineRecursive(child.id, treeType, visited);
      allDownline = allDownline.concat(childDownline);
    }

    return allDownline;
  }

  /**
   * 팀 라인 재배치 (균형 맞추기)
   * 가장 많은 팀에서 가장 적은 팀으로 회원 이동
   */
  async rebalanceTeams(sponsorId: number): Promise<{
    rebalanced: number;
    beforeCounts: Record<number, number>;
    afterCounts: Record<number, number>;
  }> {
    const teamCounts = await Promise.all(
      [1, 2, 3].map(async (teamLine) => {
        const members = await this.prisma.member.findMany({
          where: {
            sponsorId,
            teamLine,
            isActive: true,
          },
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'desc' }, // 최근 가입자부터
        });

        return { teamLine, count: members.length, members };
      }),
    );

    const beforeCounts = teamCounts.reduce(
      (acc, t) => {
        acc[t.teamLine] = t.count;
        return acc;
      },
      {} as Record<number, number>,
    );

    // 가장 많은 팀과 가장 적은 팀 찾기
    teamCounts.sort((a, b) => b.count - a.count);
    const maxTeam = teamCounts[0];
    const minTeam = teamCounts[2];

    const diff = maxTeam.count - minTeam.count;
    if (diff <= 1) {
      this.logger.log(`후원인 ID ${sponsorId}: 팀 균형이 이미 맞춰져 있습니다`);
      return {
        rebalanced: 0,
        beforeCounts,
        afterCounts: beforeCounts,
      };
    }

    // 차이의 절반만큼 이동 (완전 균형)
    const moveCount = Math.floor(diff / 2);
    const membersToMove = maxTeam.members.slice(0, moveCount);

    // 트랜잭션으로 이동
    await this.prisma.$transaction(
      membersToMove.map((m) =>
        this.prisma.member.update({
          where: { id: m.id },
          data: { teamLine: minTeam.teamLine },
        }),
      ),
    );

    const afterCounts = {
      ...beforeCounts,
      [maxTeam.teamLine]: maxTeam.count - moveCount,
      [minTeam.teamLine]: minTeam.count + moveCount,
    };

    this.logger.log(
      `후원인 ID ${sponsorId}: ${moveCount}명 이동 (${maxTeam.teamLine}팀 → ${minTeam.teamLine}팀)`,
    );

    return {
      rebalanced: moveCount,
      beforeCounts,
      afterCounts,
    };
  }

  /**
   * 상위 라인 조회 (부모 → 조부모 → ...)
   */
  async getUpline(
    memberId: number,
    depth: number = 100,
    treeType: 'sponsor' | 'recommender' = 'sponsor',
  ): Promise<
    Array<{ id: number; name: string; email: string | null; grade: MemberGrade; level: number }>
  > {
    const upline: Array<{
      id: number;
      name: string;
      email: string | null;
      grade: MemberGrade;
      level: number;
    }> = [];

    let currentMember = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        sponsorId: true,
        recommenderId: true,
      },
    });

    if (!currentMember) {
      return upline;
    }

    for (let level = 1; level <= depth; level++) {
      const parentId =
        treeType === 'sponsor' ? currentMember!.sponsorId : currentMember!.recommenderId;

      if (!parentId) {
        break; // 더 이상 상위가 없음
      }

      const parent = await this.prisma.member.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          name: true,
          email: true,
          grade: true,
          sponsorId: true,
          recommenderId: true,
        },
      });

      if (!parent) {
        break;
      }

      upline.push({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        grade: parent.grade,
        level,
      });

      currentMember = parent;
    }

    return upline;
  }

  /**
   * 팀별 등급 통계 (신규 등급 체계)
   * 후원계보(SPONSOR) 기준 3팀의 등급별 회원 수 계산
   */
  async getTeamGradeStatisticsForQualification(sponsorId: number) {
    const teamStats = await Promise.all(
      [1, 2, 3].map(async (teamLine) => {
        const members = await this.prisma.member.findMany({
          where: {
            sponsorId,
            teamLine,
            isActive: true,
          },
          select: { grade: true },
        });

        return {
          teamLine,
          salespersonCount: members.filter((m) => m.grade === MemberGrade.SALESPERSON).length,
          teamLeaderCount: members.filter((m) => m.grade === MemberGrade.TEAM_LEADER).length,
          branchManagerCount: members.filter((m) => m.grade === MemberGrade.BRANCH_MANAGER).length,
          centerCount: members.filter((m) => m.grade === MemberGrade.CENTER).length,
        };
      }),
    );

    return {
      teams: teamStats,
      totals: {
        salespersonCount: teamStats.reduce((sum, t) => sum + t.salespersonCount, 0),
        teamLeaderCount: teamStats.reduce((sum, t) => sum + t.teamLeaderCount, 0),
        branchManagerCount: teamStats.reduce((sum, t) => sum + t.branchManagerCount, 0),
        centerCount: teamStats.reduce((sum, t) => sum + t.centerCount, 0),
      },
    };
  }

  /**
   * 제한된 계보도 조회 (1단계 위/아래만)
   * 마이페이지 프리뷰용
   */
  async getLimitedGenealogy(
    memberId: number,
    treeType: 'sponsor' | 'recommender' = 'sponsor',
  ): Promise<{
    treeType: 'sponsor' | 'recommender';
    upline: any;
    member: any;
    downline: any[];
    downlineCount: number;
  }> {
    // 대상 회원 조회
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        grade: true,
        cumulativePv: true,
        teamLine: true,
        centerName: true,
        phone: true,
        sponsorId: true,
        recommenderId: true,
        createdAt: true,
      },
    });

    if (!member) {
      throw new BadRequestException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    // 1단계 상위 회원 조회
    const parentId = treeType === 'sponsor' ? member.sponsorId : member.recommenderId;
    let upline: any = null;
    if (parentId) {
      upline = await this.prisma.member.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          grade: true,
          cumulativePv: true,
          teamLine: true,
          centerName: true,
          phone: true,
        },
      });
    }

    // 1단계 하위 회원 조회
    const whereClause =
      treeType === 'sponsor' ? { sponsorId: memberId } : { recommenderId: memberId };

    const downline = await this.prisma.member.findMany({
      where: {
        ...whereClause,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        grade: true,
        cumulativePv: true,
        teamLine: true,
        centerName: true,
        phone: true,
        createdAt: true,
      },
      orderBy:
        treeType === 'sponsor' ? [{ teamLine: 'asc' }, { createdAt: 'asc' }] : { createdAt: 'asc' },
    });

    return {
      treeType,
      upline,
      member,
      downline,
      downlineCount: downline.length,
    };
  }

  /**
   * ADMIN 전용: 모든 최상위 회원의 계보 조회
   */
  async getAllOrganizationTrees(
    treeType: 'sponsor' | 'recommender',
    depth: number = 100,
  ): Promise<any[]> {
    // 최상위 회원 조회 (sponsorId = NULL 또는 recommenderId = NULL)
    const whereClause =
      treeType === 'sponsor'
        ? { sponsorId: null, isActive: true }
        : { recommenderId: null, isActive: true };

    const topLevelMembers = await this.prisma.member.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        cumulativePv: true,
        teamLine: true,
        centerName: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 각 루트의 전체 트리 구축
    const trees = await Promise.all(
      topLevelMembers.map(async (root) => {
        return this.getGenealogyTree(root.id, depth, treeType);
      }),
    );

    return trees;
  }
}
