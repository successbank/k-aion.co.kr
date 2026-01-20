import type { TreeMember, OrgChartNode } from './types';

/**
 * TreeMember 데이터를 react-d3-tree의 RawNodeDatum 형식으로 변환
 * @param member 변환할 회원 데이터
 * @returns react-d3-tree 형식의 노드 데이터
 */
export function transformToOrgChartData(member: TreeMember): OrgChartNode {
  return {
    name: member.name,
    attributes: {
      id: member.id,
      email: member.email ?? '',
      username: member.username,
      grade: member.grade,
      cumulativePv: member.cumulativePv,
      centerName: member.centerName,
    },
    children:
      member.children?.length > 0 ? member.children.map(transformToOrgChartData) : undefined,
  };
}

/**
 * 회원 등급별 색상 매핑 (신규 등급 체계)
 */
export const gradeColors: Record<string, string> = {
  ADMIN: '#ff4d4f',
  CENTER: '#eb2f96',
  BRANCH_MANAGER: '#faad14',
  TEAM_LEADER: '#52c41a',
  SALESPERSON: '#1890ff',
};

/**
 * 회원 등급별 라벨 매핑 (신규 등급 체계)
 */
export const gradeLabels: Record<string, string> = {
  ADMIN: '관리자',
  CENTER: '센터',
  BRANCH_MANAGER: '지사장',
  TEAM_LEADER: '팀장',
  SALESPERSON: '판매원',
};
