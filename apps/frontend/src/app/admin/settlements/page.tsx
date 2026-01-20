'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Statistic,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { settlementsApi } from '@/lib/api';
import {
  Settlement,
  SettlementStatus,
  getStatusKorean,
  SETTLEMENT_STATUS_COLORS,
  getBonusTypeKorean,
} from '@/types/settlement';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchSettlements();
  }, [page]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await settlementsApi.getList({ page, limit: 10 });
      setSettlements(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch settlements:', error);
      message.error('정산 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (id: number) => {
    try {
      await settlementsApi.calculate(id);
      message.success('정산 계산이 완료되었습니다.');
      fetchSettlements();
    } catch (error: any) {
      message.error('정산 계산에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleConfirm = async (id: number) => {
    Modal.confirm({
      title: '정산 확정',
      content: '이 정산을 확정하시겠습니까? 확정 후에는 취소할 수 없습니다.',
      okText: '확정',
      cancelText: '취소',
      onOk: async () => {
        try {
          await settlementsApi.confirm(id);
          message.success('정산이 확정되었습니다.');
          fetchSettlements();
        } catch (error: any) {
          message.error('정산 확정에 실패했습니다: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const handlePay = async (id: number) => {
    Modal.confirm({
      title: '정산 지급',
      content: '이 정산을 지급 처리하시겠습니까?',
      okText: '지급',
      cancelText: '취소',
      onOk: async () => {
        try {
          await settlementsApi.pay(id);
          message.success('정산이 지급 처리되었습니다.');
          fetchSettlements();
        } catch (error: any) {
          message.error('정산 지급에 실패했습니다: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const showDetail = async (settlement: Settlement) => {
    try {
      const response = await settlementsApi.getDetail(settlement.id);
      setSelectedSettlement(response.data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error('정산 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '주차 코드',
      dataIndex: 'weekCode',
      key: 'weekCode',
      width: 120,
    },
    {
      title: '정산 기간',
      key: 'period',
      width: 200,
      render: (_: any, record: Settlement) => {
        const start = new Date(record.startDate).toLocaleDateString('ko-KR');
        const end = new Date(record.endDate).toLocaleDateString('ko-KR');
        return `${start} ~ ${end}`;
      },
    },
    {
      title: '총 판매액',
      dataIndex: 'totalSales',
      key: 'totalSales',
      width: 140,
      render: (value: number) => `₩${value.toLocaleString()}`,
    },
    {
      title: '총 PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      width: 120,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '총 보너스',
      dataIndex: 'totalBonuses',
      key: 'totalBonuses',
      width: 140,
      render: (value: number) => `₩${value.toLocaleString()}`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SettlementStatus) => (
        <Tag color={SETTLEMENT_STATUS_COLORS[status]}>
          {getStatusKorean(status)}
        </Tag>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 240,
      render: (_: any, record: Settlement) => (
        <Space size="small">
          <Button size="small" onClick={() => showDetail(record)}>
            상세
          </Button>
          {record.status === SettlementStatus.OPEN && (
            <Button size="small" type="primary" onClick={() => handleCalculate(record.id)}>
              계산
            </Button>
          )}
          {record.status === SettlementStatus.CALCULATED && (
            <Button size="small" type="primary" onClick={() => handleConfirm(record.id)}>
              확정
            </Button>
          )}
          {record.status === SettlementStatus.CONFIRMED && (
            <Button size="small" danger onClick={() => handlePay(record.id)}>
              지급
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 통계 계산
  const stats = {
    totalSettlements: total,
    openCount: settlements.filter((s) => s.status === SettlementStatus.OPEN).length,
    confirmedCount: settlements.filter((s) => s.status === SettlementStatus.CONFIRMED).length,
    paidCount: settlements.filter((s) => s.status === SettlementStatus.PAID).length,
  };

  return (
    <DashboardLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 통계 카드 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="전체 정산"
                value={stats.totalSettlements}
                suffix="건"
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#7CB342' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="진행 중"
                value={stats.openCount}
                suffix="건"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="확정됨"
                value={stats.confirmedCount}
                suffix="건"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="지급 완료"
                value={stats.paidCount}
                suffix="건"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 정산 목록 테이블 */}
        <Card title="정산 내역">
          <Table
            columns={columns}
            dataSource={settlements}
            loading={loading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: 10,
              total: total,
              onChange: (newPage) => setPage(newPage),
              showSizeChanger: false,
              showTotal: (total) => `총 ${total}건`,
            }}
          />
        </Card>

        {/* 상세 모달 */}
        <Modal
          title={`정산 상세 - ${selectedSettlement?.weekCode}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              닫기
            </Button>,
          ]}
          width={700}
        >
          {selectedSettlement && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card size="small" title="정산 정보">
                <p><strong>주차 코드:</strong> {selectedSettlement.weekCode}</p>
                <p><strong>정산 기간:</strong> {new Date(selectedSettlement.startDate).toLocaleDateString('ko-KR')} ~ {new Date(selectedSettlement.endDate).toLocaleDateString('ko-KR')}</p>
                <p><strong>상태:</strong> <Tag color={SETTLEMENT_STATUS_COLORS[selectedSettlement.status]}>{getStatusKorean(selectedSettlement.status)}</Tag></p>
                {selectedSettlement.calculatedAt && (
                  <p><strong>계산 일시:</strong> {new Date(selectedSettlement.calculatedAt).toLocaleString('ko-KR')}</p>
                )}
                {selectedSettlement.confirmedAt && (
                  <p><strong>확정 일시:</strong> {new Date(selectedSettlement.confirmedAt).toLocaleString('ko-KR')}</p>
                )}
                {selectedSettlement.paidAt && (
                  <p><strong>지급 일시:</strong> {new Date(selectedSettlement.paidAt).toLocaleString('ko-KR')}</p>
                )}
              </Card>

              <Card size="small" title="집계 정보">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="총 판매액" value={selectedSettlement.totalSales} prefix="₩" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="총 PV" value={selectedSettlement.totalPv} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="총 보너스" value={selectedSettlement.totalBonuses} prefix="₩" />
                  </Col>
                </Row>
              </Card>

              {selectedSettlement.bonusesByType && selectedSettlement.bonusesByType.length > 0 && (
                <Card size="small" title="보너스 타입별 집계">
                  <Table
                    size="small"
                    dataSource={selectedSettlement.bonusesByType}
                    columns={[
                      {
                        title: '보너스 유형',
                        dataIndex: 'bonusType',
                        key: 'bonusType',
                        render: (type) => getBonusTypeKorean(type),
                      },
                      {
                        title: '금액',
                        dataIndex: 'totalAmount',
                        key: 'totalAmount',
                        render: (value: number) => `₩${value.toLocaleString()}`,
                      },
                      {
                        title: '건수',
                        dataIndex: 'count',
                        key: 'count',
                        render: (value: number) => `${value}건`,
                      },
                    ]}
                    pagination={false}
                    rowKey="bonusType"
                  />
                </Card>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </DashboardLayout>
  );
}
