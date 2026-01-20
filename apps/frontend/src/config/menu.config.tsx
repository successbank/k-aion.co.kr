/**
 * 등급별 메뉴 구성 설정 파일
 *
 * 각 회원 등급에 맞는 메뉴 구조를 정의합니다.
 * - ADMIN: 최고관리자
 * - DIVISION_CHIEF: 본부장
 * - BRANCH_CHIEF: 지부장
 * - MANAGER: 매니저
 * - AGENT: 에이전트
 * - MEMBER: 회원
 */

import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  CrownOutlined,
  PercentageOutlined,
  ControlOutlined,
  ApartmentOutlined,
  BookOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  CalculatorOutlined,
  ShopOutlined,
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

/**
 * 메뉴 그룹 헤더 생성 헬퍼
 */
function createMenuGroup(label: string, children: MenuItem[]): MenuItem {
  return {
    key: `${label}-section`,
    type: 'group',
    label: (
      <span
        style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
    ),
    children,
  };
}

/**
 * 공통 메뉴 아이템 (모든 등급)
 */
const commonMenuItems: MenuItem[] = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
];

/**
 * MEMBER (회원) 메뉴
 */
export const memberMenuItems: MenuItem[] = [
  createMenuGroup('메인 메뉴', [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
    { key: '/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
    { key: '/organization', icon: <ApartmentOutlined />, label: '내 조직도' },
    { key: '/products', icon: <ShoppingCartOutlined />, label: '제품 카탈로그' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * AGENT (에이전트) 메뉴
 */
export const agentMenuItems: MenuItem[] = [
  createMenuGroup('메인 메뉴', [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
    { key: '/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
    { key: '/organization', icon: <ApartmentOutlined />, label: '내 조직도' },
    { key: '/recommendees', icon: <TeamOutlined />, label: '추천 회원 관리' },
    { key: '/products', icon: <ShoppingCartOutlined />, label: '제품 카탈로그' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * MANAGER (매니저) 메뉴
 */
export const managerMenuItems: MenuItem[] = [
  createMenuGroup('메인 메뉴', [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
    { key: '/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
  ]),
  createMenuGroup('팀 관리', [
    { key: '/organization', icon: <ApartmentOutlined />, label: '조직도' },
    { key: '/team/members', icon: <TeamOutlined />, label: '팀원 관리' },
    { key: '/team/statistics', icon: <BarChartOutlined />, label: '팀 통계' },
  ]),
  createMenuGroup('제품', [
    { key: '/products', icon: <ShoppingCartOutlined />, label: '제품 카탈로그' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * BRANCH_CHIEF (지부장) 메뉴
 */
export const branchChiefMenuItems: MenuItem[] = [
  createMenuGroup('메인 메뉴', [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
    { key: '/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
  ]),
  createMenuGroup('지부 관리', [
    { key: '/organization', icon: <ApartmentOutlined />, label: '조직도' },
    { key: '/branch/members', icon: <TeamOutlined />, label: '지부 회원 관리' },
    { key: '/branch/statistics', icon: <BarChartOutlined />, label: '지부 통계' },
    { key: '/branch/seminars', icon: <BookOutlined />, label: '세미나 관리' },
  ]),
  createMenuGroup('제품', [
    { key: '/products', icon: <ShoppingCartOutlined />, label: '제품 카탈로그' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * DIVISION_CHIEF (본부장) 메뉴
 */
export const divisionChiefMenuItems: MenuItem[] = [
  createMenuGroup('메인 메뉴', [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
    { key: '/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
  ]),
  createMenuGroup('본부 관리', [
    { key: '/organization', icon: <ApartmentOutlined />, label: '조직도' },
    { key: '/division/members', icon: <TeamOutlined />, label: '본부 회원 관리' },
    { key: '/division/statistics', icon: <BarChartOutlined />, label: '본부 통계' },
    { key: '/division/seminars', icon: <BookOutlined />, label: '세미나 관리' },
    { key: '/division/performance', icon: <TrophyOutlined />, label: '실적 분석' },
  ]),
  createMenuGroup('제품', [
    { key: '/products', icon: <ShoppingCartOutlined />, label: '제품 카탈로그' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * ADMIN (최고관리자) 메뉴
 */
export const adminMenuItems: MenuItem[] = [
  createMenuGroup('대시보드', [
    { key: '/admin/dashboard', icon: <CrownOutlined />, label: '관리자 대시보드' },
  ]),
  createMenuGroup('회원 관리', [
    { key: '/admin/centers', icon: <ShopOutlined />, label: '센터 관리' },
    { key: '/admin/users', icon: <TeamOutlined />, label: '전체 회원 관리' },
    { key: '/admin/organization', icon: <ApartmentOutlined />, label: '조직도 관리' },
  ]),
  createMenuGroup('제품 & 판매', [
    { key: '/admin/products', icon: <ShoppingCartOutlined />, label: '제품 관리' },
    { key: '/admin/sales', icon: <ShoppingOutlined />, label: '판매 관리' },
  ]),
  createMenuGroup('수당 & 정산', [
    { key: '/admin/bonuses', icon: <DollarOutlined />, label: '수당 관리' },
    { key: '/admin/bonuses/history', icon: <FileTextOutlined />, label: '보너스 이력 조회' },
    { key: '/admin/settlements', icon: <FileTextOutlined />, label: '정산 관리' },
    { key: '/admin/commission-rates', icon: <PercentageOutlined />, label: '수당률 설정' },
    { key: '/admin/compensation-plan', icon: <TrophyOutlined />, label: '보상플랜' },
  ]),
  createMenuGroup('시뮬레이션', [
    { key: '/admin/bonus-simulator', icon: <CalculatorOutlined />, label: '실시간 보너스 계산' },
  ]),
  createMenuGroup('시스템 관리', [
    { key: '/admin/seminars', icon: <BookOutlined />, label: '세미나 관리' },
    { key: '/admin/integrity-check', icon: <SafetyOutlined />, label: '무결성 검사' },
    { key: '/admin/settings', icon: <ControlOutlined />, label: '시스템 설정' },
    { key: '/admin/logs', icon: <DatabaseOutlined />, label: '로그 관리' },
    { key: '/admin/backup', icon: <SafetyOutlined />, label: '백업/복구' },
  ]),
  createMenuGroup('내 정보', [
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
    { key: '/settings', icon: <SettingOutlined />, label: '설정' },
  ]),
];

/**
 * 등급별 메뉴 매핑
 */
export const menuByGrade: Record<string, MenuItem[]> = {
  MEMBER: memberMenuItems,
  AGENT: agentMenuItems,
  MANAGER: managerMenuItems,
  BRANCH_CHIEF: branchChiefMenuItems,
  DIVISION_CHIEF: divisionChiefMenuItems,
  ADMIN: adminMenuItems,
};

/**
 * 등급별 한글명
 */
export const gradeLabels: Record<string, string> = {
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
  CENTER: '센터',
  ADMIN: '최고관리자',
};

/**
 * 페이지 타이틀 매핑
 */
export const pageTitles: Record<string, string> = {
  '/admin/dashboard': '대시보드',
  '/sales': '판매 관리',
  '/bonuses': '수당 관리',
  '/organization': '조직도',
  '/recommendees': '추천 회원 관리',
  '/products': '제품 카탈로그',
  '/profile': '프로필',
  '/settings': '설정',

  // 팀 관리 (MANAGER)
  '/team/members': '팀원 관리',
  '/team/statistics': '팀 통계',

  // 지부 관리 (BRANCH_CHIEF)
  '/branch/members': '지부 회원 관리',
  '/branch/statistics': '지부 통계',
  '/branch/seminars': '세미나 관리',

  // 본부 관리 (DIVISION_CHIEF)
  '/division/members': '본부 회원 관리',
  '/division/statistics': '본부 통계',
  '/division/seminars': '세미나 관리',
  '/division/performance': '실적 분석',

  // 관리자 (ADMIN)
  '/admin/centers': '센터 관리',
  '/admin/users': '전체 회원 관리',
  '/admin/organization': '조직도 관리',
  '/admin/products': '제품 관리',
  '/admin/sales': '판매 관리',
  '/admin/bonuses': '수당 관리',
  '/admin/bonuses/history': '보너스 이력 조회',
  '/admin/settlements': '정산 관리',
  '/admin/commission-rates': '수당률 설정',
  '/admin/compensation-plan': '보상플랜',
  '/admin/bonus-simulator': '실시간 보너스 계산',
  '/admin/seminars': '세미나 관리',
  '/admin/integrity-check': '무결성 검사',
  '/admin/settings': '시스템 설정',
  '/admin/logs': '로그 관리',
  '/admin/backup': '백업/복구',
};
