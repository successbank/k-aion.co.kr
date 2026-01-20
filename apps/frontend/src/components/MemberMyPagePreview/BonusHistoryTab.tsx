'use client';

import { useState, useEffect } from 'react';
import { Table, Tag, Spin, Empty, Select, Statistic, Row, Col, Card } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { apiClient } from '@/services/api';
import { BonusTypeLabels, BonusTypeColors, BonusStatusLabels } from '@/types/bonuses';

interface BonusHistoryTabProps {
  memberId: number;
}

interface Bonus {
  id: number;
  bonusType: string;
  amount: number;
  status: string;
  description?: string;
  calculationBasis?: string;
  weekCode: string;
  createdAt: string;
  sale?: {
    id: number;
    saleCode: string;
    totalPrice: number;
    totalPv: number;
    seller?: {
      id: number;
      name: string;
    };
  };
}

interface BonusesResponse {
  data: Bonus[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 인정매출/판권 구분
const getRecognitionType = (bonusType: string): 'GRADE' | 'LICENSE' | null => {
  if (['SHARING'].includes(bonusType)) {
    return 'GRADE';
  }
  if (['LICENSE', 'LICENSE_MANAGEMENT'].includes(bonusType)) {
    return 'LICENSE';
  }
  return null;
};

export function BonusHistoryTab({ memberId }: BonusHistoryTabProps) {
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<{
    totalAmount: number;
    byType: Record<string, number>;
  }>({ totalAmount: 0, byType: {} });

  const loadBonuses = async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(pagination.pageSize),
      };
      if (selectedType) {
        params.bonusType = selectedType;
      }

      const response = await apiClient.get<BonusesResponse>(
        `/v1/bonuses?memberId=${memberId}`,
        params,
      );
      setBonuses(response.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.meta.total,
      });

      // 통계 계산
      const totalAmount = response.data.reduce((sum, b) => sum + b.amount, 0);
      const byType = response.data.reduce(
        (acc, b) => {
          acc[b.bonusType] = (acc[b.bonusType] || 0) + b.amount;
          return acc;
        },
        {} as Record<string, number>,
      );
      setStats({ totalAmount, byType });
    } catch (error) {
      console.error('Failed to load bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBonuses();
  }, [memberId, selectedType]);

  const columns = [
    {
      title: '유형',
      dataIndex: 'bonusType',
      key: 'bonusType',
      width: 180,
      render: (type: string) => {
        const recognitionType = getRecognitionType(type);
        return (
          <div>
            <Tag color={BonusTypeColors[type as keyof typeof BonusTypeColors] || 'default'}>
              {BonusTypeLabels[type as keyof typeof BonusTypeLabels] || type}
            </Tag>
            {recognitionType && (
              <Tag
                color={recognitionType === 'GRADE' ? 'purple' : 'magenta'}
                style={{ marginLeft: 4 }}
              >
                {recognitionType === 'GRADE' ? '인정매출' : '인정판권'}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>
          {amount.toLocaleString()}원
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag
          color={
            status === 'PAID'
              ? 'success'
              : status === 'CONFIRMED'
                ? 'processing'
                : status === 'CANCELLED'
                  ? 'default'
                  : 'warning'
          }
        >
          {BonusStatusLabels[status as keyof typeof BonusStatusLabels] || status}
        </Tag>
      ),
    },
    {
      title: '주차',
      dataIndex: 'weekCode',
      key: 'weekCode',
      width: 100,
    },
    {
      title: '일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  if (loading && bonuses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 보너스 통계 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="총 보너스"
              value={stats.totalAmount}
              prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
              suffix="원"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={16}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>유형별 합계</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(stats.byType)
                .slice(0, 4)
                .map(([type, amount]) => (
                  <Tag
                    key={type}
                    color={BonusTypeColors[type as keyof typeof BonusTypeColors] || 'default'}
                  >
                    {BonusTypeLabels[type as keyof typeof BonusTypeLabels] || type}:{' '}
                    {amount.toLocaleString()}원
                  </Tag>
                ))}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 필터 */}
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="보너스 유형 필터"
          allowClear
          style={{ width: 200 }}
          value={selectedType}
          onChange={setSelectedType}
        >
          <Select.Option value="SALES">판매수당</Select.Option>
          <Select.Option value="SALES_MANAGEMENT">육성장려금</Select.Option>
          <Select.Option value="LICENSE">판권수당</Select.Option>
          <Select.Option value="LICENSE_MANAGEMENT">판권육성수당</Select.Option>
          <Select.Option value="SHARING">직급수당</Select.Option>
          <Select.Option value="BRANCH_OPERATION">운영자금</Select.Option>
        </Select>
      </div>

      {/* 보너스 테이블 */}
      {bonuses.length === 0 ? (
        <Empty description="보너스 내역이 없습니다" />
      ) : (
        <Table
          columns={columns}
          dataSource={bonuses}
          rowKey="id"
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showTotal: (total) => `총 ${total}건`,
          }}
          onChange={(p) => loadBonuses(p.current || 1)}
        />
      )}
    </div>
  );
}

export default BonusHistoryTab;
