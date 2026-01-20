'use client';

import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Progress,
  Tag,
  List,
  Avatar,
  Spin,
} from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  RiseOutlined,
  LineChartOutlined,
  CrownOutlined,
  PieChartOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  profileService,
  MyProfile,
  MyPerformance,
  MyOrganization,
  AdminStats,
} from '@/services/profile.service';

const { Title, Text } = Typography;

// 에이전트 승급 기준 PV
const AGENT_TARGET_PV = 2000000;

// 등급별 한글 라벨
const GRADE_LABELS: Record<string, string> = {
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
  CENTER: '센터장',
  ADMIN: '관리자',
};

// 대시보드 통계 타입
interface DashboardStats {
  cumulativePv: number;
  thisMonthSales: number;
  thisMonthSalesAmount: number;
  thisMonthSalesPv: number;
  thisMonthBonus: number;
  teamMembers: number;
  agentProgress: number;
  recentSales: MyPerformance['recentSales'];
  recentBonuses: MyPerformance['recentBonuses'];
  bonusesByType: MyPerformance['monthly']['bonuses']['byType'];
  teamStats: MyOrganization['sponsorTree']['teamStats'];
  recommendees: MyOrganization['recommenderTree']['recommendees'];
  totalRecommendees: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const userGrade = user?.grade || 'MEMBER';

  // API 데이터 상태
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    profile: MyProfile | null;
    performance: MyPerformance | null;
    organization: MyOrganization | null;
  }>({ profile: null, performance: null, organization: null });

  // API 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profile, performance, organization] = await Promise.all([
          profileService.getMyProfile(),
          profileService.getMyPerformance(),
          profileService.getMyOrganization(100), // 충분한 depth로 전체 조직 조회
        ]);
        setDashboardData({ profile, performance, organization });
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // API 데이터에서 stats 계산
  const stats = useMemo<DashboardStats | null>(() => {
    const { profile, performance, organization } = dashboardData;
    if (!profile || !performance || !organization) {
      return null;
    }

    return {
      cumulativePv: profile.cumulativePv,
      thisMonthSales: performance.monthly.sales.count,
      thisMonthSalesAmount: performance.monthly.sales.totalAmount,
      thisMonthSalesPv: performance.monthly.sales.totalPv,
      thisMonthBonus: performance.monthly.bonuses.totalAmount,
      teamMembers: organization.sponsorTree.totalCount,
      agentProgress: Math.min(100, (profile.cumulativePv / AGENT_TARGET_PV) * 100),
      recentSales: performance.recentSales,
      recentBonuses: performance.recentBonuses,
      bonusesByType: performance.monthly.bonuses.byType,
      teamStats: organization.sponsorTree.teamStats,
      recommendees: organization.recommenderTree.recommendees,
      totalRecommendees: organization.recommenderTree.totalCount,
    };
  }, [dashboardData]);

  // 로딩 상태
  if (loading) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <Spin size="large" tip="대시보드 데이터를 불러오는 중..." />
        </div>
      </DashboardLayout>
    );
  }

  // 데이터 로드 실패 시 기본값 사용
  const safeStats: DashboardStats = stats || {
    cumulativePv: 0,
    thisMonthSales: 0,
    thisMonthSalesAmount: 0,
    thisMonthSalesPv: 0,
    thisMonthBonus: 0,
    teamMembers: 0,
    agentProgress: 0,
    recentSales: [],
    recentBonuses: [],
    bonusesByType: [],
    teamStats: [],
    recommendees: [],
    totalRecommendees: 0,
  };

  return (
    <DashboardLayout>
      {/* 등급별 대시보드 렌더링 */}
      {userGrade === 'MEMBER' && <MemberDashboard stats={safeStats} user={user} />}
      {userGrade === 'AGENT' && <AgentDashboard stats={safeStats} user={user} />}
      {userGrade === 'MANAGER' && <ManagerDashboard stats={safeStats} user={user} />}
      {userGrade === 'BRANCH_CHIEF' && <BranchChiefDashboard stats={safeStats} user={user} />}
      {userGrade === 'DIVISION_CHIEF' && <DivisionChiefDashboard stats={safeStats} user={user} />}
      {userGrade === 'CENTER' && <DivisionChiefDashboard stats={safeStats} user={user} />}
      {userGrade === 'ADMIN' && <AdminDashboard stats={safeStats} user={user} />}
    </DashboardLayout>
  );
}

/**
 * MEMBER (회원) 대시보드
 */
function MemberDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  const progressPercent = Math.round(stats.agentProgress);
  const remainingPercent = 100 - progressPercent;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '회원'}님! 👋
        </Title>
        <Text type="secondary">
          {progressPercent >= 100
            ? '에이전트 승급 조건을 달성했습니다!'
            : `에이전트 승급까지 ${remainingPercent}% 남았습니다!`}
        </Text>
      </div>

      {/* 승급 진행률 */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
        }}
      >
        <div style={{ color: '#fff' }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              display: 'block',
              marginBottom: 12,
            }}
          >
            에이전트 승급 진행률
          </Text>
          <Progress
            percent={progressPercent}
            strokeColor="#FFF"
            trailColor="rgba(255,255,255,0.2)"
            format={(percent) => `${percent}%`}
          />
          <Text style={{ color: '#fff', fontSize: 14, display: 'block', marginTop: 8 }}>
            누적 PV: {stats.cumulativePv.toLocaleString()} / {AGENT_TARGET_PV.toLocaleString()}
          </Text>
        </div>
      </Card>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="누적 PV"
              value={stats.cumulativePv}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 판매"
              value={stats.thisMonthSales}
              prefix={<ShoppingOutlined />}
              suffix="건"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 수당"
              value={stats.thisMonthBonus}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="내 팀원"
              value={stats.teamMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 최근 판매 내역 */}
      <Card title="최근 판매 내역" style={{ marginTop: 24 }}>
        {stats.recentSales.length > 0 ? (
          <List
            dataSource={stats.recentSales.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.product.name}
                  description={`${item.totalPrice.toLocaleString()}원 (PV: ${item.totalPv.toLocaleString()}) · ${item.saleDate.split('T')[0]}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">최근 판매 내역이 없습니다.</Text>
        )}
      </Card>
    </div>
  );
}

/**
 * AGENT (에이전트) 대시보드
 */
function AgentDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  // 수당 유형별 금액 계산
  const salesBonus = stats.bonusesByType.find((b) => b.type === 'SALES')?.amount || 0;
  const referralBonus =
    stats.bonusesByType.find((b) => b.type === 'REFERRAL' || b.type === 'SALES_MANAGEMENT')
      ?.amount || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '에이전트'}님! 🚀
        </Title>
        <Text type="secondary">매니저 승급까지 조금만 더 노력하세요!</Text>
      </div>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="누적 PV"
              value={stats.cumulativePv}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="추천 회원 수"
              value={stats.totalRecommendees}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="직접판매 수당"
              value={salesBonus}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="추천 수당"
              value={referralBonus}
              prefix={<RiseOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 추천 회원 현황 */}
      <Card title="추천 회원 현황" style={{ marginTop: 24 }}>
        {stats.recommendees.length > 0 ? (
          <Table
            dataSource={stats.recommendees
              .slice(0, 10)
              .map((m, idx) => ({ ...m, key: m.id || idx }))}
            columns={[
              { title: '이름', dataIndex: 'name', key: 'name' },
              {
                title: '등급',
                dataIndex: 'grade',
                key: 'grade',
                render: (grade: string) => (
                  <Tag
                    color={grade === 'AGENT' ? 'gold' : grade === 'MANAGER' ? 'blue' : 'default'}
                  >
                    {GRADE_LABELS[grade] || grade}
                  </Tag>
                ),
              },
              {
                title: '누적 PV',
                dataIndex: 'cumulativePv',
                key: 'cumulativePv',
                render: (pv: number) => pv.toLocaleString(),
              },
              {
                title: '가입일',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => date?.split('T')[0] || '-',
              },
            ]}
            pagination={false}
            size="small"
          />
        ) : (
          <Text type="secondary">추천 회원이 없습니다.</Text>
        )}
      </Card>
    </div>
  );
}

/**
 * MANAGER (매니저) 대시보드
 */
function ManagerDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  // 팀별 통계 집계
  const totalTeamPv = stats.teamStats.reduce((sum, t) => sum + t.totalPv, 0);
  const positionBonus =
    stats.bonusesByType.find((b) => b.type === 'POSITION' || b.type === 'MANAGER')?.amount || 0;

  // 팀 라인 정렬 (PV 기준 내림차순)
  const sortedTeams = [...stats.teamStats].sort((a, b) => b.totalPv - a.totalPv);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '매니저'}님! 💼
        </Title>
        <Text type="secondary">팀을 이끌어 지부장으로 성장하세요!</Text>
      </div>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="팀원 수"
              value={stats.teamMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="팀 총 PV"
              value={totalTeamPv}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 수당"
              value={stats.thisMonthBonus}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="직급 수당"
              value={positionBonus}
              prefix={<RiseOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 팀별 실적 */}
      <Card title="팀별 실적" style={{ marginTop: 24 }}>
        {sortedTeams.length > 0 ? (
          <Row gutter={16}>
            {sortedTeams.slice(0, 3).map((team, idx) => (
              <Col span={8} key={team.teamLine}>
                <Card>
                  <Statistic title={`${team.teamLine}팀`} value={team.count} suffix="명" />
                  <Text type="secondary">PV: {team.totalPv.toLocaleString()}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Text type="secondary">팀 데이터가 없습니다.</Text>
        )}
      </Card>
    </div>
  );
}

/**
 * BRANCH_CHIEF (지부장) 대시보드
 */
function BranchChiefDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  // 지부 총 PV 계산
  const totalBranchPv = stats.teamStats.reduce((sum, t) => sum + t.totalPv, 0);
  const leadershipBonus =
    stats.bonusesByType.find((b) => b.type === 'LEADERSHIP' || b.type === 'BRANCH_CHIEF')?.amount ||
    0;

  // 매니저별 데이터 (팀 라인 기준)
  const sortedTeams = [...stats.teamStats].sort((a, b) => b.totalPv - a.totalPv);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '지부장'}님! 🏆
        </Title>
        <Text type="secondary">지부를 이끌어 본부장으로 도약하세요!</Text>
      </div>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지부 총 인원"
              value={stats.teamMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지부 총 PV"
              value={totalBranchPv}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 수당"
              value={stats.thisMonthBonus}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="리더십 수당"
              value={leadershipBonus}
              prefix={<CrownOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 팀별 실적 */}
      <Card title="팀별 실적 Top 5" style={{ marginTop: 24 }}>
        {sortedTeams.length > 0 ? (
          <Table
            dataSource={sortedTeams.slice(0, 5).map((team, idx) => ({
              key: team.teamLine,
              rank: idx + 1,
              name: `${team.teamLine}팀`,
              members: team.count,
              pv: team.totalPv,
            }))}
            columns={[
              { title: '순위', dataIndex: 'rank', key: 'rank' },
              { title: '팀', dataIndex: 'name', key: 'name' },
              {
                title: '인원',
                dataIndex: 'members',
                key: 'members',
                render: (val: number) => `${val}명`,
              },
              {
                title: '총 PV',
                dataIndex: 'pv',
                key: 'pv',
                render: (val: number) => val.toLocaleString(),
              },
            ]}
            pagination={false}
            size="small"
          />
        ) : (
          <Text type="secondary">팀 데이터가 없습니다.</Text>
        )}
      </Card>
    </div>
  );
}

/**
 * DIVISION_CHIEF (본부장) 대시보드
 */
function DivisionChiefDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  // 본부 총 PV 계산
  const totalDivisionPv = stats.teamStats.reduce((sum, t) => sum + t.totalPv, 0);
  const licenseBonus =
    stats.bonusesByType.find((b) => b.type === 'LICENSE' || b.type === 'DIVISION_CHIEF')?.amount ||
    0;

  // 팀별 데이터 정렬
  const sortedTeams = [...stats.teamStats].sort((a, b) => b.totalPv - a.totalPv);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '본부장'}님! 👑
        </Title>
        <Text type="secondary">본부 전체를 이끄는 리더십을 발휘하세요!</Text>
      </div>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="본부 총 인원"
              value={stats.teamMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="본부 총 PV"
              value={totalDivisionPv}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="이번 달 수당"
              value={stats.thisMonthBonus}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="판권 보너스"
              value={licenseBonus}
              prefix={<CrownOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 팀별 실적 */}
      <Card title="팀별 실적" style={{ marginTop: 24 }}>
        {sortedTeams.length > 0 ? (
          <Table
            dataSource={sortedTeams.map((team, idx) => ({
              key: team.teamLine,
              name: `${team.teamLine}팀`,
              members: team.count,
              pv: team.totalPv,
            }))}
            columns={[
              { title: '팀', dataIndex: 'name', key: 'name' },
              {
                title: '인원',
                dataIndex: 'members',
                key: 'members',
                render: (val: number) => `${val}명`,
              },
              {
                title: '총 PV',
                dataIndex: 'pv',
                key: 'pv',
                render: (val: number) => val.toLocaleString(),
              },
            ]}
            pagination={false}
            size="small"
          />
        ) : (
          <Text type="secondary">팀 데이터가 없습니다.</Text>
        )}
      </Card>
    </div>
  );
}

/**
 * ADMIN (최고관리자) 대시보드
 * GET /v1/members/admin-stats API를 사용하여 전체 시스템 통계를 조회합니다.
 */
function AdminDashboard({ stats, user }: { stats: DashboardStats; user: any }) {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [bonusesData, setBonusesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalBonuses: 0,
  });
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [salesResponse, bonusesResponse, adminStatsData] = await Promise.all([
        api.get('/v1/sales?page=1&limit=400'),
        api.get('/v1/bonuses?page=1&limit=400'),
        profileService.getAdminStats(),
      ]);

      const sales = salesResponse.data?.data || [];
      const bonuses = bonusesResponse.data?.data || [];

      setSalesData(sales);
      setBonusesData(bonuses);
      setAdminStats(adminStatsData);

      const totalSales = sales.reduce((sum: number, s: any) => sum + s.totalPrice, 0);
      const totalBonuses = bonuses.reduce((sum: number, b: any) => sum + b.amount, 0);

      setDashboardStats({ totalSales, totalBonuses });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 그래프 데이터 가공
  const bonusPieData = useMemo(() => {
    const bonusTypeLabels: Record<string, string> = {
      SALES: '판매 보너스',
      SALES_MANAGEMENT: '판매 관리 보너스',
      LICENSE: '판권 보너스',
      LICENSE_MANAGEMENT: '판권 관리 보너스',
      SHARING: '공유 보너스',
      BRANCH_OPERATION: '센터 운영 보너스',
    };

    const grouped = bonusesData.reduce(
      (acc, b) => {
        if (!acc[b.bonusType]) {
          acc[b.bonusType] = 0;
        }
        acc[b.bonusType] += b.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(grouped).map(([type, amount]) => ({
      name: bonusTypeLabels[type] || type,
      value: amount,
      type,
    }));
  }, [bonusesData]);

  const weeklyTrendData = useMemo(() => {
    type WeeklyData = { week: string; sales: number; bonuses: number };
    const salesByWeek = salesData.reduce(
      (acc, s) => {
        if (!acc[s.weekCode]) {
          acc[s.weekCode] = { week: s.weekCode, sales: 0, bonuses: 0 };
        }
        acc[s.weekCode].sales += s.totalPrice;
        return acc;
      },
      {} as Record<string, WeeklyData>,
    );

    bonusesData.forEach((b) => {
      if (!salesByWeek[b.weekCode]) {
        salesByWeek[b.weekCode] = { week: b.weekCode, sales: 0, bonuses: 0 };
      }
      salesByWeek[b.weekCode].bonuses += b.amount;
    });

    return (Object.values(salesByWeek) as WeeklyData[]).sort((a, b) =>
      a.week.localeCompare(b.week),
    );
  }, [salesData, bonusesData]);

  const dailySalesData = useMemo(() => {
    type DailyData = { date: string; amount: number };
    const grouped = salesData.reduce(
      (acc, s) => {
        const date = s.soldAt.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0 };
        }
        acc[date].amount += s.totalPrice;
        return acc;
      },
      {} as Record<string, DailyData>,
    );

    return (Object.values(grouped) as DailyData[]).sort((a, b) => a.date.localeCompare(b.date));
  }, [salesData]);

  const COLORS = {
    SALES: '#E53935',
    SALES_MANAGEMENT: '#1890ff',
    LICENSE: '#722ed1',
    LICENSE_MANAGEMENT: '#eb2f96',
    SHARING: '#faad14',
    BRANCH_OPERATION: '#13c2c2',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          안녕하세요, {user?.name || '관리자'}님! 🎯
        </Title>
        <Text type="secondary">전체 시스템을 관리하고 통제합니다.</Text>
      </div>

      {/* KPI 카드 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 회원"
              value={adminStats?.totalMembers ?? 0}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 판매액"
              value={dashboardStats.totalSales}
              prefix={<ShoppingOutlined />}
              suffix="원"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 보너스"
              value={dashboardStats.totalBonuses}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="제품 수"
              value={adminStats?.totalProducts ?? 0}
              prefix={<ShoppingOutlined />}
              suffix="개"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 그래프 Row 1: 보너스 유형별 분포 + 주차별 매출 추이 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#E53935' }} />
                <span>보너스 유형별 분포</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bonusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bonusPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.type as keyof typeof COLORS] || '#8c8c8c'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}원`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#1890ff' }} />
                <span>주차별 매출 & 보너스 추이</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                />
                <YAxis
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}원`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="매출"
                  stroke="#E53935"
                  strokeWidth={3}
                  dot={{ fill: '#E53935', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="bonuses"
                  name="보너스"
                  stroke="#1890ff"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#1890ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 그래프 Row 2: 일자별 매출 현황 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartOutlined style={{ color: '#E53935' }} />
                <span>일자별 매출 현황</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorSalesDashboard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E53935" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E53935" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                />
                <YAxis
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}원`}
                  labelFormatter={(label) => `날짜: ${label}`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="매출"
                  stroke="#E53935"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSalesDashboard)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 등급별 회원 분포 */}
      <Card title="등급별 회원 분포" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Card>
              <Statistic
                title="회원"
                value={adminStats?.gradeDistribution?.MEMBER ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="에이전트"
                value={adminStats?.gradeDistribution?.AGENT ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="매니저"
                value={adminStats?.gradeDistribution?.MANAGER ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="지부장"
                value={adminStats?.gradeDistribution?.BRANCH_CHIEF ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="본부장"
                value={adminStats?.gradeDistribution?.DIVISION_CHIEF ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="관리자"
                value={adminStats?.gradeDistribution?.ADMIN ?? 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
