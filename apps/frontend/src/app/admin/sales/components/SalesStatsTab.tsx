'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Table,
  Tag,
  message,
  Select,
  Button,
} from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Sale {
  id: number;
  totalPrice: number;
  totalPv: number;
  status: string;
  soldAt: string;
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

interface StatusStats {
  status: string;
  count: number;
  totalAmount: number;
  totalPv: number;
}

interface SellerStats {
  sellerId: number;
  sellerName: string;
  sellerCode: string;
  salesCount: number;
  totalAmount: number;
  totalPv: number;
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

export default function SalesStatsTab() {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Computed statistics
  const [totalSales, setTotalSales] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPv, setTotalPv] = useState(0);
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, statusFilter]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Fetch all sales within date range
      const { data } = await api.get('/v1/sales', {
        params: {
          limit: 10000, // Get all sales for stats calculation
          status: statusFilter || undefined,
        },
      });

      const salesData = data.data || [];

      // Filter by date range on client side (API doesn't support date filter yet)
      const filteredSales = salesData.filter((sale: Sale) => {
        const saleDate = dayjs(sale.soldAt);
        return saleDate.isAfter(dateRange[0]) && saleDate.isBefore(dateRange[1].add(1, 'day'));
      });

      setSales(filteredSales);
      calculateStatistics(filteredSales);
    } catch (error: any) {
      message.error('판매 통계 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (salesData: Sale[]) => {
    // Total statistics
    setTotalSales(salesData.length);
    const totalAmountSum = salesData.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
    const totalPvSum = salesData.reduce((sum, sale) => sum + (sale.totalPv || 0), 0);
    setTotalAmount(totalAmountSum);
    setTotalPv(totalPvSum);

    // Status breakdown
    const statusMap = new Map<string, StatusStats>();
    salesData.forEach((sale) => {
      const existing = statusMap.get(sale.status) || {
        status: sale.status,
        count: 0,
        totalAmount: 0,
        totalPv: 0,
      };
      existing.count += 1;
      existing.totalAmount += sale.totalPrice || 0;
      existing.totalPv += sale.totalPv || 0;
      statusMap.set(sale.status, existing);
    });
    setStatusStats(Array.from(statusMap.values()));

    // Seller statistics
    const sellerMap = new Map<number, SellerStats>();
    salesData.forEach((sale) => {
      if (!sale.seller) return;
      const existing = sellerMap.get(sale.seller.id) || {
        sellerId: sale.seller.id,
        sellerName: sale.seller.name,
        sellerCode: sale.seller.grade || '',
        salesCount: 0,
        totalAmount: 0,
        totalPv: 0,
      };
      existing.salesCount += 1;
      existing.totalAmount += sale.totalPrice || 0;
      existing.totalPv += sale.totalPv || 0;
      sellerMap.set(sale.seller.id, existing);
    });
    const sortedSellers = Array.from(sellerMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    );
    setSellerStats(sortedSellers.slice(0, 10)); // Top 10 sellers

    // Product statistics
    const productMap = new Map<number, ProductStats>();
    salesData.forEach((sale) => {
      if (!sale.product) return;
      const existing = productMap.get(sale.product.id) || {
        productId: sale.product.id,
        productName: sale.product.name,
        productCode: sale.product.code,
        salesCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        totalPv: 0,
      };
      existing.salesCount += 1;
      existing.totalQuantity += sale.quantity || 1;
      existing.totalAmount += sale.totalPrice || 0;
      existing.totalPv += sale.totalPv || 0;
      productMap.set(sale.product.id, existing);
    });
    const sortedProducts = Array.from(productMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    );
    setProductStats(sortedProducts.slice(0, 10)); // Top 10 products
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'warning', text: '대기' },
      CONFIRMED: { color: 'processing', text: '확정' },
      SETTLED: { color: 'success', text: '정산완료' },
      CANCELLED: { color: 'default', text: '취소' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const statusColumns: ColumnsType<StatusStats> = [
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '건수',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (count) => (count || 0).toLocaleString(),
    },
    {
      title: '총 금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => `₩${(amount || 0).toLocaleString()}`,
    },
    {
      title: '총 PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right',
      render: (pv) => (pv || 0).toLocaleString(),
    },
  ];

  const sellerColumns: ColumnsType<SellerStats> = [
    {
      title: '순위',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold' }}>
          {index + 1}
          {index < 3 && <TrophyOutlined style={{ marginLeft: 4, color: '#faad14' }} />}
        </span>
      ),
    },
    {
      title: '판매자',
      key: 'seller',
      render: (_, record) => (
        <div>
          <div>{record.sellerName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.sellerCode}</div>
        </div>
      ),
    },
    {
      title: '판매건수',
      dataIndex: 'salesCount',
      key: 'salesCount',
      align: 'right',
      render: (count) => (count || 0).toLocaleString(),
    },
    {
      title: '총 판매금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => `₩${(amount || 0).toLocaleString()}`,
    },
    {
      title: '총 PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right',
      render: (pv) => (pv || 0).toLocaleString(),
    },
  ];

  const productColumns: ColumnsType<ProductStats> = [
    {
      title: '순위',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold' }}>
          {index + 1}
          {index < 3 && <TrophyOutlined style={{ marginLeft: 4, color: '#faad14' }} />}
        </span>
      ),
    },
    {
      title: '제품',
      key: 'product',
      render: (_, record) => (
        <div>
          <div>{record.productName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.productCode}</div>
        </div>
      ),
    },
    {
      title: '판매건수',
      dataIndex: 'salesCount',
      key: 'salesCount',
      align: 'right',
      render: (count) => (count || 0).toLocaleString(),
    },
    {
      title: '총 판매금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount) => `₩${(amount || 0).toLocaleString()}`,
    },
    {
      title: '총 PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right',
      render: (pv) => (pv || 0).toLocaleString(),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
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
          <Select
            style={{ width: 150 }}
            placeholder="상태 선택"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Option value="PENDING">대기</Option>
            <Option value="CONFIRMED">확정</Option>
            <Option value="SETTLED">정산완료</Option>
            <Option value="CANCELLED">취소</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchSalesData}>
            새로고침
          </Button>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="총 판매건수"
              value={totalSales}
              prefix={<ShoppingOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="총 판매금액"
              value={totalAmount}
              prefix={<DollarOutlined />}
              formatter={(value) => `₩${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="총 PV"
              value={totalPv}
              prefix={<ThunderboltOutlined />}
              formatter={(value) => Number(value).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      <Card title="상태별 통계" style={{ marginBottom: 16 }}>
        <Table
          columns={statusColumns}
          dataSource={statusStats}
          rowKey="status"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="TOP 10 판매자" style={{ marginBottom: 16 }}>
        <Table
          columns={sellerColumns}
          dataSource={sellerStats}
          rowKey="sellerId"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="TOP 10 제품">
        <Table
          columns={productColumns}
          dataSource={productStats}
          rowKey="productId"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
