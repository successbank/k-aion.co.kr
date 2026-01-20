'use client';

import { useEffect, useState } from 'react';
import {
  Table,
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
  Modal,
  Descriptions,
  DatePicker,
} from 'antd';
import {
  DollarOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
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
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AdminBonusesPage() {
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

  // 모달 상태
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<BonusResponseDto | null>(null);

  // 통계 데이터
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    paid: 0,
    byType: {} as Record<BonusType, number>,
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

    // 유형별 통계
    const byType: Record<BonusType, number> = {} as Record<BonusType, number>;
    Object.values(BonusType).forEach((type) => {
      byType[type] = data
        .filter((b) => b.bonusType === type)
        .reduce((sum, b) => sum + b.amount, 0);
    });

    setStats({ total, pending, confirmed, paid, byType });
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

  const handleViewDetail = (bonus: BonusResponseDto) => {
    setSelectedBonus(bonus);
    setDetailModalVisible(true);
  };

  // 엑셀 다운로드
  const handleExportExcel = () => {
    try {
      if (bonuses.length === 0) {
        message.warning('내보낼 데이터가 없습니다.');
        return;
      }

      // 데이터 변환
      const excelData = bonuses.map((bonus) => ({
        ID: bonus.id,
        '회원 ID': bonus.memberId,
        '판매 ID': bonus.saleId || '-',
        '보너스 유형': BonusTypeLabels[bonus.bonusType],
        '금액 (원)': bonus.amount,
        '주차': bonus.weekCode,
        상태: BonusStatusLabels[bonus.status],
        설명: bonus.description || '-',
        생성일: new Date(bonus.createdAt).toLocaleString('ko-KR'),
      }));

      // 통계 시트 데이터
      const statsData = [
        ['보너스 통계 보고서'],
        ['생성일시', new Date().toLocaleString('ko-KR')],
        [''],
        ['총 보너스 금액', stats.total.toLocaleString() + '원'],
        ['대기중', stats.pending.toLocaleString() + '원'],
        ['확정됨', stats.confirmed.toLocaleString() + '원'],
        ['지급완료', stats.paid.toLocaleString() + '원'],
        [''],
        ['유형별 통계'],
      ];

      // 유형별 통계 추가
      Object.entries(stats.byType).forEach(([type, amount]) => {
        statsData.push([BonusTypeLabels[type as BonusType], amount.toLocaleString() + '원']);
      });

      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 통계 시트
      const statsWS = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWS, '통계');

      // 보너스 목록 시트
      const bonusesWS = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, bonusesWS, '보너스 목록');

      // 파일 다운로드
      const fileName = `보너스_관리_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success('엑셀 파일이 다운로드되었습니다.');
    } catch (error: any) {
      console.error('Excel export error:', error);
      message.error('엑셀 내보내기에 실패했습니다.');
    }
  };

  const columns: ColumnsType<BonusResponseDto> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '회원 ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 100,
    },
    {
      title: '보너스 유형',
      dataIndex: 'bonusType',
      key: 'bonusType',
      width: 180,
      render: (type: BonusType) => (
        <Tag color={BonusTypeColors[type]}>{BonusTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#7CB342', fontSize: 15 }}>
          {(amount || 0).toLocaleString()}원
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '판매 ID',
      dataIndex: 'saleId',
      key: 'saleId',
      width: 100,
      render: (saleId: number | null) => saleId || '-',
    },
    {
      title: '주차',
      dataIndex: 'weekCode',
      key: 'weekCode',
      width: 120,
      render: (weekCode: string) => <Tag>{weekCode}</Tag>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: BonusStatus) => (
        <Tag color={BonusStatusColors[status]}>{BonusStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* 헤더 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <BarChartOutlined /> 보너스 관리 (관리자)
        </Title>
        <Button icon={<DownloadOutlined />} type="primary" onClick={handleExportExcel}>
          엑셀 다운로드
        </Button>
      </div>

      {/* 통계 카드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 보너스"
              value={stats.total}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#7CB342' }}
              formatter={(value) => Number(value).toLocaleString()}
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
              formatter={(value) => Number(value).toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="확정됨"
              value={stats.confirmed}
              prefix={<DollarOutlined />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => Number(value).toLocaleString()}
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
              formatter={(value) => Number(value).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      {/* 유형별 통계 */}
      <Card title="유형별 보너스 통계" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(stats.byType).map(([type, amount]) => (
            <Col key={type} xs={12} sm={8} md={6} lg={4}>
              <Card size="small">
                <Statistic
                  title={BonusTypeLabels[type as BonusType]}
                  value={amount}
                  suffix="원"
                  valueStyle={{ color: '#7CB342', fontSize: 16 }}
                  formatter={(value) => Number(value).toLocaleString()}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="회원 ID 검색"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) =>
              handleFilterChange('memberId', e.target.value ? Number(e.target.value) : undefined)
            }
            allowClear
          />
          <Input
            placeholder="주차 코드 (예: 2025-52)"
            style={{ width: 180 }}
            onChange={(e) => handleFilterChange('weekCode', e.target.value || undefined)}
            allowClear
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
          <Button type="primary" onClick={fetchBonuses}>
            조회
          </Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card>
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
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 상세 모달 */}
      <Modal
        title="보너스 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            닫기
          </Button>,
        ]}
        width={700}
      >
        {selectedBonus && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="보너스 ID">{selectedBonus.id}</Descriptions.Item>
            <Descriptions.Item label="회원 ID">{selectedBonus.memberId}</Descriptions.Item>
            <Descriptions.Item label="판매 ID">
              {selectedBonus.saleId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="정산 ID">
              {selectedBonus.settlementId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="보너스 유형">
              <Tag color={BonusTypeColors[selectedBonus.bonusType]}>
                {BonusTypeLabels[selectedBonus.bonusType]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="금액">
              <span style={{ fontWeight: 'bold', color: '#7CB342', fontSize: 18 }}>
                {(selectedBonus.amount || 0).toLocaleString()}원
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="주차" span={2}>
              <Tag>{selectedBonus.weekCode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="상태" span={2}>
              <Tag color={BonusStatusColors[selectedBonus.status]}>
                {BonusStatusLabels[selectedBonus.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="설명" span={2}>
              {selectedBonus.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="생성일" span={2}>
              {new Date(selectedBonus.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일" span={2}>
              {new Date(selectedBonus.updatedAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </DashboardLayout>
  );
}
