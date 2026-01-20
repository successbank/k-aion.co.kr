'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Tabs,
  Progress,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  PieChartOutlined,
  LineChartOutlined,
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
import { api } from '@/lib/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  monthlyCommissions: number;
  activeOrganizations: number;
  newUsersThisMonth: number;
  salesThisMonth: number;
  userGrowthRate: number;
  salesGrowthRate: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'sale' | 'commission';
  description: string;
  amount?: number;
  createdAt: string;
}

interface SaleData {
  id: number;
  totalPrice: number;
  soldAt: string;
  weekCode: string;
  seller: {
    grade: string;
  };
}

interface BonusData {
  id: number;
  bonusType: string;
  amount: number;
  weekCode: string;
  status: string;
}

interface MemberGradeStats {
  ADMIN: number;
  CENTER: number;
  DIVISION_CHIEF: number;
  BRANCH_CHIEF: number;
  MANAGER: number;
  AGENT: number;
  MEMBER: number;
}

interface BonusTypeStats {
  SALES: number;
  SALES_MANAGEMENT: number;
  LICENSE: number;
  LICENSE_MANAGEMENT: number;
  SHARING: number;
  BRANCH_OPERATION: number;
}

interface TopPerformer {
  rank: number;
  memberId: number;
  name: string;
  totalSales: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    monthlyCommissions: 0,
    activeOrganizations: 0,
    newUsersThisMonth: 0,
    salesThisMonth: 0,
    userGrowthRate: 0,
    salesGrowthRate: 0,
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [bonusesData, setBonusesData] = useState<BonusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeStats, setGradeStats] = useState<MemberGradeStats>({
    ADMIN: 0,
    CENTER: 0,
    DIVISION_CHIEF: 0,
    BRANCH_CHIEF: 0,
    MANAGER: 0,
    AGENT: 0,
    MEMBER: 0,
  });
  const [bonusTypeStats, setBonusTypeStats] = useState<BonusTypeStats>({
    SALES: 0,
    SALES_MANAGEMENT: 0,
    LICENSE: 0,
    LICENSE_MANAGEMENT: 0,
    SHARING: 0,
    BRANCH_OPERATION: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 등급 목록
      const grades = [
        'ADMIN',
        'CENTER',
        'DIVISION_CHIEF',
        'BRANCH_CHIEF',
        'MANAGER',
        'AGENT',
        'MEMBER',
      ];

      // 병렬 API 호출
      const [membersResponse, productsResponse, salesResponse, bonusesResponse, ...gradeResponses] =
        await Promise.all([
          api.get('/v1/members?page=1&limit=1'),
          api.get('/v1/products?page=1&limit=1'),
          api.get('/v1/sales?page=1&limit=1000'),
          api.get('/v1/bonuses?page=1&limit=1000'),
          ...grades.map((grade) => api.get(`/v1/members?grade=${grade}&page=1&limit=1`)),
        ]);

      const totalUsers = membersResponse.data?.meta?.total || 0;
      const totalProducts = productsResponse.data?.meta?.total || 0;
      const sales = salesResponse.data?.data || [];
      const bonuses = bonusesResponse.data?.data || [];

      setSalesData(sales);
      setBonusesData(bonuses);

      // 등급별 회원 수 설정
      const newGradeStats: MemberGradeStats = {
        ADMIN: 0,
        CENTER: 0,
        DIVISION_CHIEF: 0,
        BRANCH_CHIEF: 0,
        MANAGER: 0,
        AGENT: 0,
        MEMBER: 0,
      };
      grades.forEach((grade, idx) => {
        newGradeStats[grade as keyof MemberGradeStats] =
          gradeResponses[idx]?.data?.meta?.total || 0;
      });
      setGradeStats(newGradeStats);

      // 보너스 유형별 합계 계산
      const newBonusTypeStats: BonusTypeStats = {
        SALES: 0,
        SALES_MANAGEMENT: 0,
        LICENSE: 0,
        LICENSE_MANAGEMENT: 0,
        SHARING: 0,
        BRANCH_OPERATION: 0,
      };
      bonuses.forEach((b: BonusData) => {
        if (Object.hasOwn(newBonusTypeStats, b.bonusType)) {
          newBonusTypeStats[b.bonusType as keyof BonusTypeStats] += b.amount;
        }
      });
      setBonusTypeStats(newBonusTypeStats);

      // TOP 실적자 계산 (sellerId별 매출 집계)
      const salesBySeller: Record<number, { memberId: number; name: string; totalSales: number }> =
        {};
      sales.forEach((s: any) => {
        const sellerId = s.sellerId;
        if (!salesBySeller[sellerId]) {
          salesBySeller[sellerId] = {
            memberId: sellerId,
            name: s.seller?.name || `회원 ${sellerId}`,
            totalSales: 0,
          };
        }
        salesBySeller[sellerId].totalSales += s.totalPrice;
      });
      const sortedPerformers = Object.values(salesBySeller)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 3)
        .map((p, idx) => ({ ...p, rank: idx + 1 }));
      setTopPerformers(sortedPerformers);

      // 이번 달 통계 계산
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      const thisMonthSales = sales.filter((s: SaleData) => s.soldAt?.startsWith(thisMonth));
      const lastMonthSales = sales.filter((s: SaleData) => s.soldAt?.startsWith(lastMonthStr));
      const thisMonthTotal = thisMonthSales.reduce(
        (sum: number, s: SaleData) => sum + s.totalPrice,
        0,
      );
      const lastMonthTotal = lastMonthSales.reduce(
        (sum: number, s: SaleData) => sum + s.totalPrice,
        0,
      );

      const thisMonthBonuses = bonuses.filter((b: BonusData) => {
        const weekCode = b.weekCode || '';
        return weekCode.startsWith(thisMonth.replace('-', '-W'));
      });
      const totalBonuses = thisMonthBonuses.reduce(
        (sum: number, b: BonusData) => sum + b.amount,
        0,
      );

      // 성장률 계산
      const salesGrowthRate =
        lastMonthTotal > 0
          ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 1000) / 10
          : 0;

      setStats({
        totalUsers,
        totalProducts,
        monthlyCommissions: totalBonuses,
        activeOrganizations: newGradeStats.DIVISION_CHIEF + newGradeStats.BRANCH_CHIEF,
        newUsersThisMonth: 0, // 회원 생성일 필터링 필요 시 추가 API 호출 필요
        salesThisMonth: thisMonthTotal,
        userGrowthRate: 0,
        salesGrowthRate,
      });

      // 최근 활동 (판매 기준 최근 5건)
      const recentSales = sales.slice(0, 5).map((s: SaleData) => ({
        id: String(s.id),
        type: 'sale' as const,
        description: `제품 판매 발생 (${s.totalPrice.toLocaleString()}원)`,
        amount: s.totalPrice,
        createdAt: new Date(s.soldAt).toLocaleString('ko-KR'),
      }));

      setRecentActivities(recentSales);
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
    // 주차별 매출 & 보너스 집계
    const salesByWeek = salesData.reduce(
      (acc, s) => {
        if (!acc[s.weekCode]) {
          acc[s.weekCode] = { week: s.weekCode, sales: 0, bonuses: 0 };
        }
        acc[s.weekCode].sales += s.totalPrice;
        return acc;
      },
      {} as Record<string, { week: string; sales: number; bonuses: number }>,
    );

    const bonusesByWeek = bonusesData.reduce((acc, b) => {
      if (!salesByWeek[b.weekCode]) {
        salesByWeek[b.weekCode] = { week: b.weekCode, sales: 0, bonuses: 0 };
      }
      salesByWeek[b.weekCode].bonuses += b.amount;
      return salesByWeek;
    }, salesByWeek);

    return Object.values(bonusesByWeek).sort((a, b) => a.week.localeCompare(b.week));
  }, [salesData, bonusesData]);

  const dailySalesData = useMemo(() => {
    // 일자별 매출 집계
    const grouped = salesData.reduce(
      (acc, s) => {
        const date = s.soldAt.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0 };
        }
        acc[date].amount += s.totalPrice;
        return acc;
      },
      {} as Record<string, { date: string; amount: number }>,
    );

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [salesData]);

  const COLORS = {
    SALES: '#7CB342',
    SALES_MANAGEMENT: '#1890ff',
    LICENSE: '#722ed1',
    LICENSE_MANAGEMENT: '#eb2f96',
    SHARING: '#faad14',
    BRANCH_OPERATION: '#13c2c2',
  };

  const activityColumns = [
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = {
          user: 'blue',
          sale: 'green',
          commission: 'gold',
        };
        const labels = {
          user: '회원',
          sale: '판매',
          commission: '수당',
        };
        return (
          <Tag color={colors[type as keyof typeof colors]}>
            {labels[type as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: '내용',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount?: number) => (amount ? `${amount.toLocaleString()}원` : '-'),
    },
    {
      title: '일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'activities',
      label: '최근 활동',
      children: (
        <Table
          columns={activityColumns}
          dataSource={recentActivities}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'userRoles',
      label: '회원 등급 분포',
      children: (
        <div className="p-4">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="최고관리자"
                  value={gradeStats.ADMIN}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="센터"
                  value={gradeStats.CENTER}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="본부장"
                  value={gradeStats.DIVISION_CHIEF}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="지부장"
                  value={gradeStats.BRANCH_CHIEF}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="매니저"
                  value={gradeStats.MANAGER}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="에이전트"
                  value={gradeStats.AGENT}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="회원"
                  value={gradeStats.MEMBER}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'commissions',
      label: '수당 현황',
      children: (
        <div className="p-4">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="판매 보너스"
                  value={bonusTypeStats.SALES}
                  suffix="원"
                  valueStyle={{ color: '#7CB342' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="판매관리 보너스"
                  value={bonusTypeStats.SALES_MANAGEMENT}
                  suffix="원"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="판권 보너스"
                  value={bonusTypeStats.LICENSE}
                  suffix="원"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="판권관리 보너스"
                  value={bonusTypeStats.LICENSE_MANAGEMENT}
                  suffix="원"
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="공유 보너스"
                  value={bonusTypeStats.SHARING}
                  suffix="원"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="센터 운영 보너스"
                  value={bonusTypeStats.BRANCH_OPERATION}
                  suffix="원"
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  // 통계 카드 컴포넌트
  const StatCard = ({
    title,
    value,
    prefix,
    suffix,
    icon,
    iconBg,
    trend,
    trendValue,
    subText,
  }: {
    title: string;
    value: number | string;
    prefix?: string;
    suffix?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: 'up' | 'down';
    trendValue?: number;
    subText?: string;
  }) => (
    <Card
      style={{
        border: 'none',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: 13, fontWeight: 500 }}>{title}</Text>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {prefix && <span style={{ fontSize: 14, color: '#8c8c8c' }}>{prefix}</span>}
            <span style={{ fontSize: 28, fontWeight: 700, color: '#1a1f2e' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {suffix && <span style={{ fontSize: 14, color: '#8c8c8c' }}>{suffix}</span>}
          </div>
          {(trend || subText) && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {trend && trendValue !== undefined && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      trend === 'up' ? 'rgba(67, 160, 71, 0.1)' : 'rgba(229, 57, 53, 0.1)',
                    color: trend === 'up' ? '#43A047' : '#E53935',
                  }}
                >
                  {trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {trendValue}%
                </span>
              )}
              {subText && <Text style={{ color: '#8c8c8c', fontSize: 12 }}>{subText}</Text>}
            </div>
          )}
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#fff',
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      {/* 환영 메시지 섹션 */}
      <div
        style={{
          marginBottom: 28,
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
          borderRadius: 16,
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>안녕하세요, 관리자님!</h2>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 14 }}>
            오늘도 케이아이온과 함께 좋은 하루 되세요.
          </p>
        </div>
        <Button
          type="default"
          icon={<SettingOutlined />}
          onClick={() => (window.location.href = '/admin/settings')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          시스템 설정
        </Button>
      </div>

      {/* 주요 통계 */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="전체 회원"
            value={stats.totalUsers}
            suffix="명"
            icon={<UserOutlined />}
            iconBg="linear-gradient(135deg, #7CB342 0%, #558B2F 100%)"
            trend="up"
            trendValue={stats.userGrowthRate}
            subText={`이번 달 +${stats.newUsersThisMonth}명`}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="전체 제품"
            value={stats.totalProducts}
            suffix="개"
            icon={<ShoppingOutlined />}
            iconBg="linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="이번 달 수당"
            value={stats.monthlyCommissions}
            suffix="원"
            icon={<DollarOutlined />}
            iconBg="linear-gradient(135deg, #FF7043 0%, #E64A19 100%)"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="이번 달 매출"
            value={stats.salesThisMonth}
            suffix="원"
            icon={<ThunderboltOutlined />}
            iconBg="linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)"
            trend="up"
            trendValue={stats.salesGrowthRate}
          />
        </Col>
      </Row>

      {/* 그래프 Row 1: 보너스 유형별 분포 + 주차별 매출 추이 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#7CB342' }} />
                <span>보너스 유형별 분포</span>
              </div>
            }
            style={{ height: '100%' }}
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
            style={{ height: '100%' }}
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
                  stroke="#7CB342"
                  strokeWidth={3}
                  dot={{ fill: '#7CB342', r: 4 }}
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
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartOutlined style={{ color: '#7CB342' }} />
                <span>일자별 매출 현황</span>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB342" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#7CB342" stopOpacity={0.1} />
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
                  stroke="#7CB342"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 빠른 실적 요약 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <span>이번 달 TOP 실적자</span>
              </div>
            }
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topPerformers.length > 0 ? (
                topPerformers.map((item) => (
                  <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background:
                          item.rank === 1
                            ? 'linear-gradient(135deg, #faad14 0%, #d48806 100%)'
                            : '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.rank === 1 ? '#fff' : '#8c8c8c',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {item.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {item.totalSales.toLocaleString()}원
                      </div>
                    </div>
                    {item.rank === 1 && <FireOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                  </div>
                ))
              ) : (
                <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '20px 0' }}>
                  판매 데이터가 없습니다
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="회원 등급별 현황" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              {[
                {
                  label: '최고관리자',
                  value: gradeStats.ADMIN,
                  total: stats.totalUsers,
                  color: '#722ed1',
                },
                {
                  label: '센터',
                  value: gradeStats.CENTER,
                  total: stats.totalUsers,
                  color: '#eb2f96',
                },
                {
                  label: '본부장',
                  value: gradeStats.DIVISION_CHIEF,
                  total: stats.totalUsers,
                  color: '#1890ff',
                },
                {
                  label: '지부장',
                  value: gradeStats.BRANCH_CHIEF,
                  total: stats.totalUsers,
                  color: '#13c2c2',
                },
                {
                  label: '매니저',
                  value: gradeStats.MANAGER,
                  total: stats.totalUsers,
                  color: '#7CB342',
                },
                {
                  label: '에이전트',
                  value: gradeStats.AGENT,
                  total: stats.totalUsers,
                  color: '#1890ff',
                },
                {
                  label: '회원',
                  value: gradeStats.MEMBER,
                  total: stats.totalUsers,
                  color: '#faad14',
                },
              ].map((item) => (
                <Col span={12} key={item.label}>
                  <div
                    style={{
                      padding: '16px 20px',
                      background: '#fafafa',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <Progress
                      type="circle"
                      percent={Math.round((item.value / item.total) * 100)}
                      size={50}
                      strokeColor={item.color}
                      format={() => (
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{item.value}</span>
                      )}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        전체의 {((item.value / item.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 탭 메뉴 */}
      <Card style={{ marginTop: 20 }}>
        <Tabs defaultActiveKey="activities" items={tabItems} />
      </Card>
    </DashboardLayout>
  );
}
