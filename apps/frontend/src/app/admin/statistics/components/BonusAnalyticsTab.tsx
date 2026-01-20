'use client';

import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, DatePicker, Button, Space, Tag, message } from 'antd';
import {
  GiftOutlined,
  TeamOutlined,
  CalculatorOutlined,
  TrophyOutlined,
  ReloadOutlined,
  PieChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

interface BonusData {
  id: number;
  memberId: number;
  bonusType: string;
  amount: number;
  weekCode: string;
  status: string;
  member?: {
    id: number;
    name: string;
    grade: string;
  };
}

interface BonusTypeStats {
  type: string;
  typeName: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface GradeStats {
  grade: string;
  gradeName: string;
  count: number;
  totalAmount: number;
}

const BONUS_TYPE_LABELS: Record<string, string> = {
  SALES: '판매 보너스',
  SALES_MANAGEMENT: '판매 관리 보너스',
  LICENSE: '판권 보너스',
  LICENSE_MANAGEMENT: '판권 관리 보너스',
  SHARING: '공유 보너스',
  BRANCH_OPERATION: '센터 운영 보너스',
};

const BONUS_COLORS: Record<string, string> = {
  SALES: '#E53935',
  SALES_MANAGEMENT: '#1890ff',
  LICENSE: '#722ed1',
  LICENSE_MANAGEMENT: '#eb2f96',
  SHARING: '#faad14',
  BRANCH_OPERATION: '#13c2c2',
};

const GRADE_LABELS: Record<string, string> = {
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
  CENTER: '센터',
  ADMIN: '관리자',
};

const GRADE_COLORS: Record<string, string> = {
  MEMBER: '#8c8c8c',
  AGENT: '#faad14',
  MANAGER: '#52c41a',
  BRANCH_CHIEF: '#1890ff',
  DIVISION_CHIEF: '#722ed1',
  CENTER: '#eb2f96',
  ADMIN: '#f5222d',
};

export default function BonusAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [bonusesData, setBonusesData] = useState<BonusData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(90, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchBonusesData();
  }, []);

  const fetchBonusesData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/bonuses?limit=5000');
      setBonusesData(data?.data || []);
    } catch (error: any) {
      message.error('보너스 데이터 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // KPI calculations
  const totalBonusAmount = useMemo(
    () => bonusesData.reduce((sum, b) => sum + (b.amount || 0), 0),
    [bonusesData],
  );

  const uniqueMemberCount = useMemo(
    () => new Set(bonusesData.map((b) => b.memberId)).size,
    [bonusesData],
  );

  const averageBonus = useMemo(
    () => (bonusesData.length > 0 ? Math.round(totalBonusAmount / bonusesData.length) : 0),
    [totalBonusAmount, bonusesData],
  );

  // Status distribution
  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, CONFIRMED: 0, PAID: 0 };
    bonusesData.forEach((b) => {
      if (counts[b.status as keyof typeof counts] !== undefined) {
        counts[b.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [bonusesData]);

  // Bonus type distribution
  const bonusTypeStats = useMemo(() => {
    const typeMap: Record<string, { count: number; totalAmount: number }> = {};
    bonusesData.forEach((b) => {
      if (!typeMap[b.bonusType]) {
        typeMap[b.bonusType] = { count: 0, totalAmount: 0 };
      }
      typeMap[b.bonusType].count += 1;
      typeMap[b.bonusType].totalAmount += b.amount || 0;
    });

    const total = Object.values(typeMap).reduce((sum, t) => sum + t.totalAmount, 0);

    return Object.entries(typeMap).map(([type, stats]) => ({
      type,
      typeName: BONUS_TYPE_LABELS[type] || type,
      count: stats.count,
      totalAmount: stats.totalAmount,
      percentage: total > 0 ? (stats.totalAmount / total) * 100 : 0,
    }));
  }, [bonusesData]);

  // Pie chart data
  const bonusPieData = useMemo(
    () =>
      bonusTypeStats.map((stat) => ({
        name: stat.typeName,
        value: stat.totalAmount,
        type: stat.type,
      })),
    [bonusTypeStats],
  );

  // Grade distribution
  const gradeStats = useMemo(() => {
    const gradeMap: Record<string, { count: number; totalAmount: number }> = {};
    bonusesData.forEach((b) => {
      const grade = b.member?.grade || 'UNKNOWN';
      if (!gradeMap[grade]) {
        gradeMap[grade] = { count: 0, totalAmount: 0 };
      }
      gradeMap[grade].count += 1;
      gradeMap[grade].totalAmount += b.amount || 0;
    });

    // ADMIN은 시스템 운영자이므로 통계에서 제외
    const gradeOrder = ['MEMBER', 'AGENT', 'MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF', 'CENTER'];
    return gradeOrder
      .filter((g) => gradeMap[g])
      .map((grade) => ({
        grade,
        gradeName: GRADE_LABELS[grade] || grade,
        count: gradeMap[grade].count,
        totalAmount: gradeMap[grade].totalAmount,
      }));
  }, [bonusesData]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const weekMap: Record<string, number> = {};
    bonusesData.forEach((b) => {
      weekMap[b.weekCode] = (weekMap[b.weekCode] || 0) + b.amount;
    });
    return Object.entries(weekMap)
      .map(([week, amount]) => ({ week, amount }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [bonusesData]);

  // Quick date range buttons
  const setQuickRange = (days: number | 'year') => {
    if (days === 'year') {
      setDateRange([dayjs().startOf('year'), dayjs()]);
    } else {
      setDateRange([dayjs().subtract(days, 'day'), dayjs()]);
    }
  };

  const bonusTypeColumns: ColumnsType<BonusTypeStats> = [
    {
      title: '보너스 유형',
      dataIndex: 'typeName',
      key: 'typeName',
      render: (name, record) => <Tag color={BONUS_COLORS[record.type] || '#8c8c8c'}>{name}</Tag>,
    },
    {
      title: '지급 건수',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (val) => `${val.toLocaleString()}건`,
    },
    {
      title: '총 금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (val) => `₩${val.toLocaleString()}`,
    },
    {
      title: '비율',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right',
      render: (val) => `${val.toFixed(1)}%`,
    },
  ];

  return (
    <div>
      {/* Filter Bar */}
      <Card style={{ marginBottom: 20 }}>
        <Space size="middle" wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            format="YYYY-MM-DD"
          />
          <Button onClick={() => setQuickRange(7)}>최근 7일</Button>
          <Button onClick={() => setQuickRange(30)}>최근 30일</Button>
          <Button onClick={() => setQuickRange(90)}>최근 90일</Button>
          <Button onClick={() => setQuickRange('year')}>올해</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchBonusesData}>
            새로고침
          </Button>
        </Space>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="총 보너스 지급액"
              value={totalBonusAmount}
              prefix={<GiftOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="수혜 회원 수"
              value={uniqueMemberCount}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="평균 보너스"
              value={averageBonus}
              prefix={<CalculatorOutlined />}
              suffix="원"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Status Cards */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ background: '#fff7e6', border: 'none' }} loading={loading}>
            <Statistic
              title={<span style={{ color: '#faad14' }}>대기중</span>}
              value={statusCounts.PENDING}
              prefix={<ClockCircleOutlined />}
              suffix="건"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ background: '#f0f5ff', border: 'none' }} loading={loading}>
            <Statistic
              title={<span style={{ color: '#1890ff' }}>확정됨</span>}
              value={statusCounts.CONFIRMED}
              prefix={<CheckCircleOutlined />}
              suffix="건"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ background: '#f6ffed', border: 'none' }} loading={loading}>
            <Statistic
              title={<span style={{ color: '#52c41a' }}>지급완료</span>}
              value={statusCounts.PAID}
              prefix={<WalletOutlined />}
              suffix="건"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#722ed1' }} />
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
                    <Cell key={`cell-${index}`} fill={BONUS_COLORS[entry.type] || '#8c8c8c'} />
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
                <span>주차별 보너스 추이</span>
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
                  dataKey="amount"
                  name="보너스"
                  stroke="#1890ff"
                  strokeWidth={3}
                  dot={{ fill: '#1890ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#52c41a' }} />
                <span>등급별 보너스 지급 현황</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis
                  type="category"
                  dataKey="gradeName"
                  tick={{ fill: '#8c8c8c', fontSize: 12 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}원`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="totalAmount" name="보너스">
                  {gradeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || '#8c8c8c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="보너스 유형별 상세" loading={loading}>
            <Table
              columns={bonusTypeColumns}
              dataSource={bonusTypeStats}
              rowKey="type"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
