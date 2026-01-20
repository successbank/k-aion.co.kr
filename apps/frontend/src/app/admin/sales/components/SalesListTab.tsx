'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Descriptions,
  Tag,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;

interface Sale {
  id: number;
  sellerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitPv: number;
  totalPv: number;
  status: 'PENDING' | 'CONFIRMED' | 'SETTLED' | 'CANCELLED';
  weekCode: string;
  soldAt: string;
  confirmedAt?: string;
  confirmedBy?: number;
  cancelledAt?: string;
  cancelledBy?: number;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: number;
    name: string;
    email: string | null;
    grade: string;
  };
  product?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function SalesListTab() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Filters
  const [sellerIdFilter, setSellerIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [weekCodeSearch, setWeekCodeSearch] = useState<string>('');

  useEffect(() => {
    fetchSales();
  }, [pagination.current, pagination.pageSize, sellerIdFilter, statusFilter, weekCodeSearch]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/sales', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          sellerId: sellerIdFilter || undefined,
          status: statusFilter || undefined,
          weekCode: weekCodeSearch || undefined,
        },
      });

      setSales(data.data || []);
      setPagination({
        ...pagination,
        total: data.total || 0,
      });
    } catch (error: any) {
      message.error('판매 목록 조회 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailModalVisible(true);
  };

  const handleConfirm = async (saleId: number) => {
    if (!user) {
      message.error('로그인이 필요합니다.');
      return;
    }

    Modal.confirm({
      title: '판매 확정',
      content: '이 판매를 확정하시겠습니까? 확정 후에는 취소할 수 없습니다.',
      okText: '확정',
      cancelText: '취소',
      onOk: async () => {
        try {
          await api.post(`/v1/sales/${saleId}/confirm?userId=${user.id}`);
          message.success('판매가 확정되었습니다.');
          fetchSales();
        } catch (error: any) {
          message.error('판매 확정 실패: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const handleCancel = async (saleId: number) => {
    if (!user) {
      message.error('로그인이 필요합니다.');
      return;
    }

    Modal.confirm({
      title: '판매 취소',
      content: '이 판매를 취소하시겠습니까?',
      okText: '취소',
      cancelText: '닫기',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.post(`/v1/sales/${saleId}/cancel?userId=${user.id}`);
          message.success('판매가 취소되었습니다.');
          fetchSales();
        } catch (error: any) {
          message.error('판매 취소 실패: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const getStatusTag = (status: Sale['status']) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: '대기' },
      CONFIRMED: { color: 'processing', text: '확정' },
      SETTLED: { color: 'success', text: '정산완료' },
      CANCELLED: { color: 'default', text: '취소' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<Sale> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '판매자',
      key: 'seller',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.seller?.name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.seller?.grade || '-'}</div>
        </div>
      ),
    },
    {
      title: '제품',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.product?.name || '-'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.product?.code || '-'}</div>
        </div>
      ),
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right',
    },
    {
      title: '판매금액',
      key: 'totalPrice',
      width: 120,
      align: 'right',
      render: (_, record) => `₩${(record.totalPrice || 0).toLocaleString()}`,
    },
    {
      title: 'PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      width: 100,
      align: 'right',
      render: (pv) => (pv || 0).toLocaleString(),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: '정산주차',
      dataIndex: 'weekCode',
      key: 'weekCode',
      width: 100,
    },
    {
      title: '판매일',
      dataIndex: 'soldAt',
      key: 'soldAt',
      width: 120,
      render: (date) => (date ? new Date(date).toLocaleDateString('ko-KR') : '-'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            상세
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(record.id)}
              >
                확정
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record.id)}
              >
                취소
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="판매자 ID 검색"
              value={sellerIdFilter}
              onChange={(e) => setSellerIdFilter(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              style={{ width: '100%' }}
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
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="정산주차 검색 (예: 2025-52)"
              value={weekCodeSearch}
              onChange={(e) => setWeekCodeSearch(e.target.value)}
              onSearch={fetchSales}
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Button icon={<ReloadOutlined />} onClick={fetchSales} style={{ width: '100%' }}>
              새로고침
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={sales}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
          },
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="판매 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            닫기
          </Button>,
        ]}
        width={700}
      >
        {selectedSale && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="판매 ID" span={2}>
              {selectedSale.id}
            </Descriptions.Item>
            <Descriptions.Item label="판매자 이름">
              {selectedSale.seller?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="판매자 등급">
              {selectedSale.seller?.grade || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="제품명">
              {selectedSale.product?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="제품코드">
              {selectedSale.product?.code || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="수량">{selectedSale.quantity}</Descriptions.Item>
            <Descriptions.Item label="단가">
              ₩{(selectedSale.unitPrice || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="판매금액">
              ₩{(selectedSale.totalPrice || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="단위 PV">
              {(selectedSale.unitPv || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="총 PV">
              {(selectedSale.totalPv || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="상태" span={2}>
              {getStatusTag(selectedSale.status)}
            </Descriptions.Item>
            <Descriptions.Item label="정산주차" span={2}>
              {selectedSale.weekCode}
            </Descriptions.Item>
            <Descriptions.Item label="판매일" span={2}>
              {selectedSale.soldAt ? new Date(selectedSale.soldAt).toLocaleString('ko-KR') : '-'}
            </Descriptions.Item>
            {selectedSale.confirmedAt && (
              <Descriptions.Item label="확정일" span={2}>
                {new Date(selectedSale.confirmedAt).toLocaleString('ko-KR')}
              </Descriptions.Item>
            )}
            {selectedSale.cancelledAt && (
              <>
                <Descriptions.Item label="취소일" span={2}>
                  {new Date(selectedSale.cancelledAt).toLocaleString('ko-KR')}
                </Descriptions.Item>
                {selectedSale.cancelReason && (
                  <Descriptions.Item label="취소사유" span={2}>
                    {selectedSale.cancelReason}
                  </Descriptions.Item>
                )}
              </>
            )}
            <Descriptions.Item label="등록일" span={2}>
              {new Date(selectedSale.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
