'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  DatePicker,
  Select,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Input,
  message,
} from 'antd';
import {
  DollarOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import bonusesService from '@/services/bonuses.service';
import {
  BonusType,
  BonusStatus,
  BonusTypeLabels,
  BonusStatusLabels,
  BonusTypeColors,
  BonusStatusColors,
} from '@/types/bonuses';
import type { BonusResponseDto, BonusListParams } from '@/services/bonuses.service';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function BonusesPage() {
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState<BonusResponseDto[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // 필터 상태
  const [filters, setFilters] = useState<BonusListParams>({
    page: 1,
    limit: 20,
  });

  // 통계 데이터
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  });

  useEffect(() => {
    fetchBonuses();
  }, [filters]);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const response = await bonusesService.findAll(filters);
      setBonuses(response.data);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });

      // 통계 계산
      calculateStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch bonuses:', error);
      message.error(error.response?.data?.message || '보너스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: BonusResponseDto[]) => {
    const total = data.reduce((sum, b) => sum + b.amount, 0);
    const pending = data
      .filter((b) => b.status === BonusStatus.PENDING)
      .reduce((sum, b) => sum + b.amount, 0);
    const confirmed = data
      .filter((b) => b.status === BonusStatus.CONFIRMED)
      .reduce((sum, b) => sum + b.amount, 0);
    const paid = data
      .filter((b) => b.status === BonusStatus.PAID)
      .reduce((sum, b) => sum + b.amount, 0);

    setStats({ total, pending, approved: confirmed, paid });
  };

  const handleTableChange = (newPagination: any) => {
    setFilters({
      ...filters,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleFilterChange = (key: keyof BonusListParams, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로
    });
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: 20 });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '보너스 유형',
      dataIndex: 'bonusType',
      key: 'bonusType',
      render: (type: BonusType) => (
        <Tag color={BonusTypeColors[type]}>{BonusTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#E53935' }}>
          {amount.toLocaleString()}원
        </span>
      ),
      sorter: (a: BonusResponseDto, b: BonusResponseDto) => a.amount - b.amount,
    },
    {
      title: '회원 ID',
      dataIndex: 'memberId',
      key: 'memberId',
    },
    {
      title: '판매 ID',
      dataIndex: 'saleId',
      key: 'saleId',
      render: (saleId: number | null) => saleId || '-',
    },
    {
      title: '주차',
      dataIndex: 'weekCode',
      key: 'weekCode',
      render: (weekCode: string) => <Tag>{weekCode}</Tag>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: BonusStatus) => (
        <Tag color={BonusStatusColors[status]}>{BonusStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
      sorter: (a: BonusResponseDto, b: BonusResponseDto) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>보너스 관리</Title>
        <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 보너스"
              value={stats.total}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#E53935' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="대기중"
              value={stats.pending}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="승인됨"
              value={stats.approved}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지급 완료"
              value={stats.paid}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 필터 */}
      <Card className="mb-4">
        <Space wrap>
          <Input
            placeholder="회원 ID 검색"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) =>
              handleFilterChange('memberId', e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <Input
            placeholder="주차 코드 (예: 2025-52)"
            style={{ width: 180 }}
            onChange={(e) => handleFilterChange('weekCode', e.target.value || undefined)}
          />
          <Select
            placeholder="보너스 유형"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => handleFilterChange('bonusType', value)}
          >
            {Object.entries(BonusTypeLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="상태"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value)}
          >
            {Object.entries(BonusStatusLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            초기화
          </Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Table
        columns={columns}
        dataSource={bonuses}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </DashboardLayout>
  );
}
