import type { RawNodeDatum } from 'react-d3-tree';

/**
 * 회원 등급
 */
export enum MemberGrade {
  ADMIN = 'ADMIN',
  CENTER = 'CENTER',
  DIVISION_CHIEF = 'DIVISION_CHIEF',
  BRANCH_CHIEF = 'BRANCH_CHIEF',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
  MEMBER = 'MEMBER',
}

/**
 * 트리 회원 데이터 (API 응답 형식)
 */
export interface TreeMember {
  id: number;
  name: string;
  email: string | null;
  username?: string;
  grade: string;
  cumulativePv?: number;
  centerName?: string | null;
  children: TreeMember[];
}

/**
 * 조직도 노드 데이터 (react-d3-tree 형식)
 */
export interface OrgChartNode {
  name: string;
  attributes: {
    id: number;
    email: string;
    username?: string;
    grade: string;
    cumulativePv?: number;
    centerName?: string | null;
  };
  children?: OrgChartNode[];
}

/**
 * OrganizationChart 컴포넌트 Props
 */
export interface OrganizationChartProps {
  data: TreeMember | null;
  onNodeClick?: (member: TreeMember) => void;
  initialDepth?: number;
  height?: number | string;
}

/**
 * ChartControls 컴포넌트 Props
 */
export interface ChartControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}
