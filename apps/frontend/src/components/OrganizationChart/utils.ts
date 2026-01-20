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
 * 회원 등급별 색상 매핑
 */
export const gradeColors: Record<string, string> = {
  ADMIN: '#ff4d4f',
  CENTER: '#eb2f96',
  DIVISION_CHIEF: '#fa8c16',
  BRANCH_CHIEF: '#faad14',
  MANAGER: '#52c41a',
  AGENT: '#1890ff',
  MEMBER: '#8c8c8c',
};

/**
 * 회원 등급별 라벨 매핑
 */
export const gradeLabels: Record<string, string> = {
  ADMIN: '최고관리자',
  CENTER: '센터',
  DIVISION_CHIEF: '본부장',
  BRANCH_CHIEF: '지부장',
  MANAGER: '매니저',
  AGENT: '에이전트',
  MEMBER: '회원',
};
