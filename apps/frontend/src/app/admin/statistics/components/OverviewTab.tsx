'use client';

import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Typography } from 'antd';
import {
  DollarOutlined,
  GiftOutlined,
  TeamOutlined,
  UserAddOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
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
import { api } from '@/lib/api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SaleData {
  id: number;
  totalPrice: number;
  totalPv: number;
  soldAt: string;
  weekCode: string;
  status: string;
}

interface BonusData {
  id: number;
  bonusType: string;
  amount: number;
  weekCode: string;
  status: string;
}

interface SettlementData {
  id: number;
  weekCode: string;
  totalSales: number;
  totalPv: number;
  totalBonuses: number;
  status: string;
}

interface MemberData {
  id: number;
  grade: string;
  isActive: boolean;
  createdAt: string;
  cumulativePv: number;
}

// StatCard component
const StatCard = ({
  title,
  value,
  suffix,
  icon,
  iconBg,
  loading,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}) => (
  <Card
    style={{
      border: 'none',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    }}
    bodyStyle={{ padding: 24 }}
  >
    {loading ? (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin />
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: 13, fontWeight: 500 }}>{title}</Text>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#1a1f2e' }}>
              {value.toLocaleString()}
            </span>
            {suffix && <span style={{ fontSize: 14, color: '#8c8c8c' }}>{suffix}</span>}
          </div>
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
    )}
  </Card>
);

export default function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [bonusesData, setBonusesData] = useState<BonusData[]>([]);
  const [settlementsData, setSettlementsData] = useState<SettlementData[]>([]);
  const [membersData, setMembersData] = useState<MemberData[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [salesRes, bonusesRes, settlementsRes, membersRes] = await Promise.all([
        api.get('/v1/sales?limit=2000'),
        api.get('/v1/bonuses?limit=2000'),
        api.get('/v1/settlements?limit=100'),
        api.get('/v1/members?limit=3000'),
      ]);

      setSalesData(salesRes.data?.data || []);
      setBonusesData(bonusesRes.data?.data || []);
      setSettlementsData(settlementsRes.data?.data || []);
      setMembersData(membersRes.data?.data || []);
    } catch (error: any) {
      message.error('데이터 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ADMIN 제외된 회원 데이터 (통계 계산용)
  const filteredMembersData = useMemo(
    () => membersData.filter((m) => m.grade !== 'ADMIN'),
    [membersData],
  );

  // Calculate KPIs
  const totalSales = useMemo(
    () => salesData.reduce((sum, s) => sum + (s.totalPrice || 0), 0),
    [salesData],
  );

  const totalBonuses = useMemo(
    () => bonusesData.reduce((sum, b) => sum + (b.amount || 0), 0),
    [bonusesData],
  );

  const activeMembers = useMemo(
    () => filteredMembersData.filter((m) => m.isActive).length,
    [filteredMembersData],
  );

  const newMembersThisMonth = useMemo(() => {
    const startOfMonth = dayjs().startOf('month');
    return filteredMembersData.filter((m) => dayjs(m.createdAt).isAfter(startOfMonth)).length;
  }, [filteredMembersData]);

  // Settlement status counts
  const settlementStatusCounts = useMemo(() => {
    const counts = { OPEN: 0, CALCULATING: 0, CALCULATED: 0, CONFIRMED: 0, PAID: 0, CLOSED: 0 };
    settlementsData.forEach((s) => {
      if (counts[s.status as keyof typeof counts] !== undefined) {
        counts[s.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [settlementsData]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const weekMap: Record<string, { week: string; sales: number; bonuses: number }> = {};

    salesData.forEach((s) => {
      if (!weekMap[s.weekCode]) {
        weekMap[s.weekCode] = { week: s.weekCode, sales: 0, bonuses: 0 };
      }
      weekMap[s.weekCode].sales += s.totalPrice || 0;
    });

    bonusesData.forEach((b) => {
      if (!weekMap[b.weekCode]) {
        weekMap[b.weekCode] = { week: b.weekCode, sales: 0, bonuses: 0 };
      }
      weekMap[b.weekCode].bonuses += b.amount || 0;
    });

    return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  }, [salesData, bonusesData]);

  // Daily sales data
  const dailySalesData = useMemo(() => {
    const dayMap: Record<string, { date: string; amount: number }> = {};

    salesData.forEach((s) => {
      const date = s.soldAt?.split('T')[0] || '';
      if (!date) return;
      if (!dayMap[date]) {
        dayMap[date] = { date, amount: 0 };
      }
      dayMap[date].amount += s.totalPrice || 0;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [salesData]);

  return (
    <div>
      {/* KPI Cards */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="총 매출액"
            value={totalSales}
            suffix="원"
            icon={<DollarOutlined />}
            iconBg="linear-gradient(135deg, #E53935 0%, #C62828 100%)"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="총 보너스 지급액"
            value={totalBonuses}
            suffix="원"
            icon={<GiftOutlined />}
            iconBg="linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="활성 회원 수"
            value={activeMembers}
            suffix="명"
            icon={<TeamOutlined />}
            iconBg="linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="이번 달 신규 회원"
            value={newMembersThisMonth}
            suffix="명"
            icon={<UserAddOutlined />}
            iconBg="linear-gradient(135deg, #FF7043 0%, #E64A19 100%)"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#E53935' }} />
                <span>주차별 매출/보너스 추이</span>
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
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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

        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>정산 상태 현황</span>
              </div>
            }
            loading={loading}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card size="small" style={{ background: '#f0f5ff', border: 'none' }}>
                  <Statistic
                    title={<span style={{ color: '#1890ff' }}>진행중</span>}
                    value={settlementStatusCounts.OPEN + settlementStatusCounts.CALCULATING}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#fff7e6', border: 'none' }}>
                  <Statistic
                    title={<span style={{ color: '#fa8c16' }}>계산완료</span>}
                    value={settlementStatusCounts.CALCULATED}
                    prefix={<SyncOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#f6ffed', border: 'none' }}>
                  <Statistic
                    title={<span style={{ color: '#52c41a' }}>확정됨</span>}
                    value={settlementStatusCounts.CONFIRMED}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#f9f0ff', border: 'none' }}>
                  <Statistic
                    title={<span style={{ color: '#722ed1' }}>지급완료</span>}
                    value={settlementStatusCounts.PAID + settlementStatusCounts.CLOSED}
                    prefix={<WalletOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Daily Sales Chart */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
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
                  <linearGradient id="colorSalesOverview" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorSalesOverview)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
