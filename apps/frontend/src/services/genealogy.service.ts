import { apiClient } from './api';

export interface Member {
  id: number;
  name: string;
  email: string;
  grade: string;
  children: Member[];
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  teamLine1Count: number;
  teamLine2Count: number;
  teamLine3Count: number;
  totalTeamPV: number;
}

export interface RecommenderStats {
  totalRecommended: number;
  directRecommended: number;
  indirectRecommended: number;
  totalRecommenderPV: number;
}

export interface GenealogyTreeResponse {
  member: Member;
  depth: number;
  type: 'recommender' | 'sponsor';
}

class GenealogyService {
  /**
   * 계보 트리 조회 (추천 또는 후원)
   * @param memberId 회원 ID
   * @param depth 조회 깊이 (기본 3단계)
   * @param type 계보 타입 ('recommender' | 'sponsor')
   */
  async getGenealogyTree(
    memberId: number,
    depth: number = 100,
    type: 'recommender' | 'sponsor' = 'recommender',
  ): Promise<Member> {
    return apiClient.get<Member>(`/v1/members/${memberId}/genealogy-tree`, {
      depth: String(depth),
      type,
    });
  }

  /**
   * 팀 통계 조회 (후원 계보 기준)
   * @param memberId 회원 ID
   */
  async getTeamStats(memberId: number): Promise<TeamStats> {
    return apiClient.get<TeamStats>(`/v1/members/${memberId}/team-stats`);
  }

  /**
   * 추천 통계 조회
   * @param memberId 회원 ID
   */
  async getRecommenderStats(memberId: number): Promise<RecommenderStats> {
    return apiClient.get<RecommenderStats>(`/v1/members/${memberId}/recommender-stats`);
  }

  /**
   * 상위 라인 조회
   * @param memberId 회원 ID
   * @param depth 조회 깊이 (기본 5단계)
   * @param type 계보 타입 ('recommender' | 'sponsor')
   */
  async getUpline(
    memberId: number,
    depth: number = 100,
    type: 'recommender' | 'sponsor' = 'recommender',
  ): Promise<Member[]> {
    return apiClient.get<Member[]>(`/v1/members/${memberId}/upline`, {
      depth: String(depth),
      type,
    });
  }

  /**
   * 최적 팀 라인 제안
   * @param memberId 회원 ID
   */
  async suggestTeamLine(memberId: number): Promise<{ suggestedTeamLine: number }> {
    return apiClient.post<{ suggestedTeamLine: number }>(
      `/v1/members/${memberId}/suggest-team-line`,
    );
  }

  /**
   * ADMIN 전용: 전체 조직 계보 조회
   * @param type 계보 타입 ('recommender' | 'sponsor')
   * @param depth 조회 깊이 (기본 10단계)
   */
  async getAllOrganizationTrees(
    type: 'recommender' | 'sponsor',
    depth: number = 100,
  ): Promise<{ treeType: string; totalRoots: number; trees: Member[] }> {
    return apiClient.get<{ treeType: string; totalRoots: number; trees: Member[] }>(
      `/v1/members/genealogy/all-trees`,
      { type, depth: String(depth) },
    );
  }
}

export const genealogyService = new GenealogyService();
