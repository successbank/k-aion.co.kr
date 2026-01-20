'use client';

import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, Progress, Button, message, Tag } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  UserAddOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

interface MemberData {
  id: number;
  name: string;
  username: string;
  grade: string;
  isActive: boolean;
  createdAt: string;
  cumulativePv: number;
}

interface GradeStats {
  grade: string;
  gradeName: string;
  count: number;
  percentage: number;
  avgPv: number;
}

interface MonthlyJoinData {
  month: string;
  count: number;
}

interface PvRangeData {
  range: string;
  count: number;
}

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

// ADMIN은 시스템 운영자이므로 회원 통계에서 제외
const GRADE_ORDER = ['MEMBER', 'AGENT', 'MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF', 'CENTER'];

export default function MemberAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [membersData, setMembersData] = useState<MemberData[]>([]);

  useEffect(() => {
    fetchMembersData();
  }, []);

  const fetchMembersData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/members?limit=5000');
      setMembersData(data?.data || []);
    } catch (error: any) {
      message.error('회원 데이터 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ADMIN 제외된 회원 데이터 (통계 계산용)
  const filteredMembersData = useMemo(
    () => membersData.filter((m) => m.grade !== 'ADMIN'),
    [membersData],
  );

  // KPI calculations
  const totalMembers = filteredMembersData.length;

  const activeMembers = useMemo(
    () => filteredMembersData.filter((m) => m.isActive).length,
    [filteredMembersData],
  );

  const newMembersThisMonth = useMemo(() => {
    const startOfMonth = dayjs().startOf('month');
    return filteredMembersData.filter((m) => dayjs(m.createdAt).isAfter(startOfMonth)).length;
  }, [filteredMembersData]);

  const avgCumulativePv = useMemo(() => {
    if (filteredMembersData.length === 0) return 0;
    const total = filteredMembersData.reduce((sum, m) => sum + (m.cumulativePv || 0), 0);
    return Math.round(total / filteredMembersData.length);
  }, [filteredMembersData]);

  // Grade distribution
  const gradeStats = useMemo(() => {
    const gradeMap: Record<string, { count: number; totalPv: number }> = {};
    filteredMembersData.forEach((m) => {
      if (!gradeMap[m.grade]) {
        gradeMap[m.grade] = { count: 0, totalPv: 0 };
      }
      gradeMap[m.grade].count += 1;
      gradeMap[m.grade].totalPv += m.cumulativePv || 0;
    });

    return GRADE_ORDER.filter((g) => gradeMap[g]).map((grade) => ({
      grade,
      gradeName: GRADE_LABELS[grade] || grade,
      count: gradeMap[grade].count,
      percentage: totalMembers > 0 ? (gradeMap[grade].count / totalMembers) * 100 : 0,
      avgPv:
        gradeMap[grade].count > 0 ? Math.round(gradeMap[grade].totalPv / gradeMap[grade].count) : 0,
    }));
  }, [filteredMembersData, totalMembers]);

  // Pie chart data
  const gradePieData = useMemo(
    () =>
      gradeStats.map((stat) => ({
        name: stat.gradeName,
        value: stat.count,
        grade: stat.grade,
      })),
    [gradeStats],
  );

  // Monthly join trend (last 12 months)
  const monthlyJoinData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const now = dayjs();
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = now.subtract(i, 'month').format('YYYY-MM');
      monthMap[month] = 0;
    }

    filteredMembersData.forEach((m) => {
      const month = dayjs(m.createdAt).format('YYYY-MM');
      if (monthMap[month] !== undefined) {
        monthMap[month] += 1;
      }
    });

    return Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredMembersData]);

  // PV distribution
  const pvRangeData = useMemo(() => {
    const ranges = [
      { range: '0-10만', min: 0, max: 100000 },
      { range: '10만-50만', min: 100000, max: 500000 },
      { range: '50만-100만', min: 500000, max: 1000000 },
      { range: '100만-500만', min: 1000000, max: 5000000 },
      { range: '500만+', min: 5000000, max: Infinity },
    ];

    return ranges.map((r) => ({
      range: r.range,
      count: filteredMembersData.filter((m) => m.cumulativePv >= r.min && m.cumulativePv < r.max)
        .length,
    }));
  }, [filteredMembersData]);

  const gradeColumns: ColumnsType<GradeStats> = [
    {
      title: '등급',
      dataIndex: 'gradeName',
      key: 'gradeName',
      render: (name, record) => <Tag color={GRADE_COLORS[record.grade] || '#8c8c8c'}>{name}</Tag>,
    },
    {
      title: '회원 수',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (val) => `${val.toLocaleString()}명`,
    },
    {
      title: '비율',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'right',
      render: (val) => `${val.toFixed(1)}%`,
    },
    {
      title: '평균 PV',
      dataIndex: 'avgPv',
      key: 'avgPv',
      align: 'right',
      render: (val) => val.toLocaleString(),
    },
  ];

  return (
    <div>
      {/* Refresh Button */}
      <div style={{ marginBottom: 20, textAlign: 'right' }}>
        <Button icon={<ReloadOutlined />} onClick={fetchMembersData}>
          새로고침
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="전체 회원 수"
              value={totalMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#7CB342' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="활성 회원 수"
              value={activeMembers}
              prefix={<UserOutlined />}
              suffix="명"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="이번 달 신규"
              value={newMembersThisMonth}
              prefix={<UserAddOutlined />}
              suffix="명"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="평균 누적 PV"
              value={avgCumulativePv}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Grade Distribution Row */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#722ed1' }} />
                <span>등급별 회원 분포</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || '#8c8c8c'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}명`}
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
          <Card title="등급별 회원 현황" loading={loading} style={{ height: '100%' }}>
            <Row gutter={[12, 12]}>
              {gradeStats.map((stat) => (
                <Col xs={12} sm={8} key={stat.grade}>
                  <div
                    style={{
                      padding: '16px',
                      background: '#fafafa',
                      borderRadius: 12,
                      textAlign: 'center',
                    }}
                  >
                    <Progress
                      type="circle"
                      percent={stat.percentage}
                      size={60}
                      strokeColor={GRADE_COLORS[stat.grade]}
                      format={() => (
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{stat.count}</span>
                      )}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Tag color={GRADE_COLORS[stat.grade]}>{stat.gradeName}</Tag>
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                      {stat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartOutlined style={{ color: '#7CB342' }} />
                <span>월별 가입 추이 (최근 12개월)</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyJoinData}>
                <defs>
                  <linearGradient id="colorMemberJoin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB342" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#7CB342" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                />
                <YAxis tick={{ fill: '#8c8c8c', fontSize: 11 }} tickLine={{ stroke: '#f0f0f0' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}명`}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="가입자 수"
                  stroke="#7CB342"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMemberJoin)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#1890ff' }} />
                <span>PV 분포 현황</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pvRangeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                />
                <YAxis tick={{ fill: '#8c8c8c', fontSize: 11 }} tickLine={{ stroke: '#f0f0f0' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}명`}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" name="회원 수" fill="#1890ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Grade Details Table */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24}>
          <Card title="등급별 회원 상세" loading={loading}>
            <Table
              columns={gradeColumns}
              dataSource={gradeStats}
              rowKey="grade"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
