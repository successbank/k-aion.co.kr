'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  DatePicker,
  Button,
  Space,
  Tag,
  message,
  Typography,
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ReloadOutlined,
  AreaChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
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
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface SaleData {
  id: number;
  totalPrice: number;
  totalPv: number;
  soldAt: string;
  weekCode: string;
  status: string;
  quantity: number;
  seller?: {
    id: number;
    name: string;
    grade: string;
  };
  product?: {
    id: number;
    name: string;
    code: string;
  };
}

interface ProductStats {
  productId: number;
  productName: string;
  productCode: string;
  salesCount: number;
  totalQuantity: number;
  totalAmount: number;
  totalPv: number;
}

interface SellerStats {
  sellerId: number;
  sellerName: string;
  sellerGrade: string;
  salesCount: number;
  totalAmount: number;
  totalPv: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#faad14',
  CONFIRMED: '#1890ff',
  SETTLED: '#52c41a',
  CANCELLED: '#8c8c8c',
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

export default function SalesAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(90, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/sales?limit=2000');
      setSalesData(data?.data || []);
    } catch (error: any) {
      message.error('판매 데이터 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Filter by date range
  const filteredSales = useMemo(() => {
    return salesData.filter((s) => {
      const saleDate = dayjs(s.soldAt);
      return (
        saleDate.isAfter(dateRange[0].startOf('day')) &&
        saleDate.isBefore(dateRange[1].endOf('day'))
      );
    });
  }, [salesData, dateRange]);

  // KPI calculations
  const totalAmount = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0),
    [filteredSales],
  );

  const totalPv = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (s.totalPv || 0), 0),
    [filteredSales],
  );

  const salesCount = filteredSales.length;

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const statusMap: Record<string, number> = {};
    filteredSales.forEach((s) => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    });
    const statusLabels: Record<string, string> = {
      PENDING: '대기',
      CONFIRMED: '확정',
      SETTLED: '정산완료',
      CANCELLED: '취소',
    };
    return Object.entries(statusMap).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      status,
    }));
  }, [filteredSales]);

  // Product ranking
  const productStats = useMemo(() => {
    const productMap: Record<number, ProductStats> = {};
    filteredSales.forEach((s) => {
      if (!s.product) return;
      if (!productMap[s.product.id]) {
        productMap[s.product.id] = {
          productId: s.product.id,
          productName: s.product.name,
          productCode: s.product.code,
          salesCount: 0,
          totalQuantity: 0,
          totalAmount: 0,
          totalPv: 0,
        };
      }
      productMap[s.product.id].salesCount += 1;
      productMap[s.product.id].totalQuantity += s.quantity || 1;
      productMap[s.product.id].totalAmount += s.totalPrice || 0;
      productMap[s.product.id].totalPv += s.totalPv || 0;
    });
    return Object.values(productMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [filteredSales]);

  // Seller ranking
  const sellerStats = useMemo(() => {
    const sellerMap: Record<number, SellerStats> = {};
    filteredSales.forEach((s) => {
      if (!s.seller) return;
      if (!sellerMap[s.seller.id]) {
        sellerMap[s.seller.id] = {
          sellerId: s.seller.id,
          sellerName: s.seller.name,
          sellerGrade: s.seller.grade,
          salesCount: 0,
          totalAmount: 0,
          totalPv: 0,
        };
      }
      sellerMap[s.seller.id].salesCount += 1;
      sellerMap[s.seller.id].totalAmount += s.totalPrice || 0;
      sellerMap[s.seller.id].totalPv += s.totalPv || 0;
    });
    return Object.values(sellerMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [filteredSales]);

  // Daily sales data for area chart
  const dailySalesData = useMemo(() => {
    const dayMap: Record<string, { date: string; amount: number; pv: number }> = {};
    filteredSales.forEach((s) => {
      const date = s.soldAt?.split('T')[0] || '';
      if (!date) return;
      if (!dayMap[date]) {
        dayMap[date] = { date, amount: 0, pv: 0 };
      }
      dayMap[date].amount += s.totalPrice || 0;
      dayMap[date].pv += s.totalPv || 0;
    });
    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Quick date range buttons
  const setQuickRange = (days: number | 'year') => {
    if (days === 'year') {
      setDateRange([dayjs().startOf('year'), dayjs()]);
    } else {
      setDateRange([dayjs().subtract(days, 'day'), dayjs()]);
    }
  };

  const productColumns: ColumnsType<ProductStats> = [
    {
      title: '순위',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold', color: index < 3 ? '#faad14' : '#8c8c8c' }}>
          {index + 1}
          {index < 3 && <TrophyOutlined style={{ marginLeft: 4 }} />}
        </span>
      ),
    },
    {
      title: '제품',
      key: 'product',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.productName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.productCode}</div>
        </div>
      ),
    },
    {
      title: '판매건수',
      dataIndex: 'salesCount',
      key: 'salesCount',
      align: 'right',
      render: (val) => `${val.toLocaleString()}건`,
    },
    {
      title: '총수량',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'right',
      render: (val) => val.toLocaleString(),
    },
    {
      title: '총매출',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (val) => `₩${val.toLocaleString()}`,
    },
    {
      title: '총PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right',
      render: (val) => val.toLocaleString(),
    },
  ];

  const sellerColumns: ColumnsType<SellerStats> = [
    {
      title: '순위',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold', color: index < 3 ? '#faad14' : '#8c8c8c' }}>
          {index + 1}
          {index < 3 && <TrophyOutlined style={{ marginLeft: 4 }} />}
        </span>
      ),
    },
    {
      title: '판매자',
      key: 'seller',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.sellerName}</div>
          <Tag color="blue">{GRADE_LABELS[record.sellerGrade] || record.sellerGrade}</Tag>
        </div>
      ),
    },
    {
      title: '판매건수',
      dataIndex: 'salesCount',
      key: 'salesCount',
      align: 'right',
      render: (val) => `${val.toLocaleString()}건`,
    },
    {
      title: '총매출',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (val) => `₩${val.toLocaleString()}`,
    },
    {
      title: '총PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right',
      render: (val) => val.toLocaleString(),
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
          <Button icon={<ReloadOutlined />} onClick={fetchSalesData}>
            새로고침
          </Button>
        </Space>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="총 매출액"
              value={totalAmount}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="총 PV"
              value={totalPv}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="판매 건수"
              value={salesCount}
              prefix={<ShoppingOutlined />}
              suffix="건"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AreaChartOutlined style={{ color: '#E53935' }} />
                <span>일별 매출 추이</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorSalesAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E53935" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E53935" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                />
                <YAxis
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  tickLine={{ stroke: '#f0f0f0' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()}${name === 'amount' ? '원' : ''}`,
                    name === 'amount' ? '매출' : 'PV',
                  ]}
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
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSalesAnalytics)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartOutlined style={{ color: '#1890ff' }} />
                <span>판매 상태별 분포</span>
              </div>
            }
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8c8c8c'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()}건`}
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
      </Row>

      {/* Rankings Tables */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="제품별 판매 순위 Top 10" loading={loading}>
            <Table
              columns={productColumns}
              dataSource={productStats}
              rowKey="productId"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="판매자별 실적 순위 Top 10" loading={loading}>
            <Table
              columns={sellerColumns}
              dataSource={sellerStats}
              rowKey="sellerId"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
