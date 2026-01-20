'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  FileExcelOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  BonusType,
  BonusStatus,
  BonusTypeLabels,
  BonusStatusLabels,
  BonusTypeColors,
  BonusStatusColors,
} from '@/types/bonuses';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 보너스 응답 타입
interface BonusData {
  id: number;
  memberId: number;
  bonusType: BonusType;
  amount: number;
  description?: string;
  weekCode: string;
  status: BonusStatus;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: number;
    name: string;
    grade: string;
  };
}

// 요약 통계 타입
interface BonusSummary {
  totalAmount: number;
  totalCount: number;
  byType: { bonusType: BonusType; amount: number; count: number }[];
  byStatus: { status: BonusStatus; amount: number; count: number }[];
}

export default function BonusHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState<BonusData[]>([]);
  const [summary, setSummary] = useState<BonusSummary | null>(null);

  // 필터 상태
  const [selectedWeekCode, setSelectedWeekCode] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<BonusStatus | undefined>(undefined);
  const [selectedBonusType, setSelectedBonusType] = useState<BonusType | undefined>(undefined);

  // 동적 주차 목록 생성 (최근 12주)
  const weekOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const today = dayjs();
    for (let i = 0; i < 12; i++) {
      const week = today.subtract(i * 7, 'day');
      const year = week.year();
      const weekNum = week.week();
      const weekCode = `${year}-${String(weekNum).padStart(2, '0')}`;
      if (!options.find((o) => o.value === weekCode)) {
        options.push({ value: weekCode, label: weekCode });
      }
    }
    return options;
  }, []);

  useEffect(() => {
    fetchBonusData();
  }, [selectedWeekCode, selectedStatus, selectedBonusType]);

  const fetchBonusData = async () => {
    try {
      setLoading(true);

      // 전체 보너스 목록 조회 (관리자용)
      const params: any = { limit: 1000 };
      if (selectedWeekCode) params.weekCode = selectedWeekCode;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedBonusType) params.bonusType = selectedBonusType;

      const response = await api.get('/v1/bonuses', { params });
      const bonusesData: BonusData[] = response.data?.data || [];
      setBonuses(bonusesData);

      // 요약 통계 계산 (클라이언트 사이드)
      const byTypeMap = new Map<BonusType, { amount: number; count: number }>();
      const byStatusMap = new Map<BonusStatus, { amount: number; count: number }>();
      let totalAmount = 0;

      bonusesData.forEach((bonus) => {
        totalAmount += bonus.amount;

        // 유형별 집계
        const typeEntry = byTypeMap.get(bonus.bonusType) || { amount: 0, count: 0 };
        typeEntry.amount += bonus.amount;
        typeEntry.count += 1;
        byTypeMap.set(bonus.bonusType, typeEntry);

        // 상태별 집계
        const statusEntry = byStatusMap.get(bonus.status) || { amount: 0, count: 0 };
        statusEntry.amount += bonus.amount;
        statusEntry.count += 1;
        byStatusMap.set(bonus.status, statusEntry);
      });

      setSummary({
        totalAmount,
        totalCount: bonusesData.length,
        byType: Array.from(byTypeMap.entries()).map(([bonusType, data]) => ({
          bonusType,
          ...data,
        })),
        byStatus: Array.from(byStatusMap.entries()).map(([status, data]) => ({
          status,
          ...data,
        })),
      });
    } catch (error: any) {
      console.error('보너스 데이터 조회 실패:', error);
      message.error(error.response?.data?.message || '보너스 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSelectedWeekCode(undefined);
    setSelectedStatus(undefined);
    setSelectedBonusType(undefined);
    fetchBonusData();
  };

  const handleExportExcel = () => {
    message.info('엑셀 다운로드 기능은 개발 중입니다.');
    // TODO: Implement Excel export
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<BonusData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '회원',
      dataIndex: ['member', 'name'],
      key: 'memberName',
      width: 100,
      render: (_: any, record: BonusData) => record.member?.name || `회원#${record.memberId}`,
    },
    {
      title: '보너스 유형',
      dataIndex: 'bonusType',
      key: 'bonusType',
      width: 140,
      render: (type: BonusType) => <Tag color={BonusTypeColors[type]}>{BonusTypeLabels[type]}</Tag>,
    },
    {
      title: '지급 금액',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#E53935', fontSize: '14px' }}>
          {amount.toLocaleString()}원
        </Text>
      ),
    },
    {
      title: '주차',
      dataIndex: 'weekCode',
      key: 'weekCode',
      width: 90,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: BonusStatus) => (
        <Tag color={BonusStatusColors[status]}>{BonusStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <DollarOutlined style={{ color: '#E53935' }} /> 보너스 이력 조회
          </Title>
          <Text type="secondary">내 보너스 지급 내역을 확인하세요</Text>
        </div>

        {/* 요약 통계 */}
        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="총 보너스 금액"
                  value={summary.totalAmount}
                  precision={0}
                  suffix="원"
                  valueStyle={{ color: '#E53935' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="총 보너스 건수"
                  value={summary.totalCount}
                  suffix="건"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="지급 완료"
                  value={summary.byStatus.find((s) => s.status === BonusStatus.PAID)?.count || 0}
                  suffix="건"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="대기 중"
                  value={summary.byStatus.find((s) => s.status === BonusStatus.PENDING)?.count || 0}
                  suffix="건"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 필터 및 액션 버튼 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="주차 선택"
              style={{ width: 150 }}
              allowClear
              value={selectedWeekCode}
              onChange={setSelectedWeekCode}
              options={weekOptions}
            />

            <Select
              placeholder="상태 선택"
              style={{ width: 120 }}
              allowClear
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              {Object.values(BonusStatus).map((status) => (
                <Select.Option key={status} value={status}>
                  {BonusStatusLabels[status]}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="보너스 유형"
              style={{ width: 180 }}
              allowClear
              value={selectedBonusType}
              onChange={setSelectedBonusType}
            >
              {Object.values(BonusType).map((type) => (
                <Select.Option key={type} value={type}>
                  {BonusTypeLabels[type]}
                </Select.Option>
              ))}
            </Select>

            <Button type="default" icon={<ReloadOutlined />} onClick={handleRefresh}>
              초기화
            </Button>

            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              엑셀 다운로드
            </Button>
          </Space>
        </Card>

        {/* 보너스 테이블 */}
        <Card>
          <Table
            columns={columns}
            dataSource={bonuses}
            loading={{
              spinning: loading,
              indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />,
              tip: '보너스 데이터를 불러오는 중...',
            }}
            rowKey="id"
            pagination={{
              total: bonuses.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}건`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 안내 메시지 */}
        {!loading && bonuses.length === 0 && (
          <Alert
            message="보너스 내역이 없습니다"
            description="조회 조건에 맞는 보너스 내역이 없습니다. 필터를 변경해보세요."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
