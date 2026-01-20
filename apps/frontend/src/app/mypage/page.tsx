'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  Button,
  Tag,
  Avatar,
  Space,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Tabs,
  Table,
  Empty,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  BankOutlined,
  HomeOutlined,
  TeamOutlined,
  LogoutOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { profileService, MyProfile, UpdateProfileRequest } from '@/services/profile.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

const { Title, Text } = Typography;

// 판매 내역 인터페이스
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
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function MyPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSection, setEditSection] = useState<'basic' | 'address' | 'bank'>('basic');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 판매 내역 관련 state
  const [activeTab, setActiveTab] = useState('profile');
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPagination, setSalesPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 프로필 조회
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      message.error('프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 판매 내역 조회
  const fetchMySales = async (page = 1, pageSize = 10) => {
    if (!profile) return;

    setSalesLoading(true);
    try {
      const { data } = await api.get('/v1/sales', {
        params: {
          sellerId: profile.id,
          page,
          limit: pageSize,
        },
      });

      setSales(data.data || []);
      setSalesPagination({
        current: page,
        pageSize,
        total: data.total || 0,
      });
    } catch (error: any) {
      console.error('Failed to fetch sales:', error);
      message.error('판매 내역을 불러오는데 실패했습니다.');
    } finally {
      setSalesLoading(false);
    }
  };

  // 탭 변경 핸들러 (판매 내역은 lazy loading)
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'sales' && sales.length === 0 && profile) {
      fetchMySales();
    }
  };

  // 수정 모달 열기
  const openEditModal = (section: 'basic' | 'address' | 'bank') => {
    if (!profile) return;

    setEditSection(section);

    if (section === 'basic') {
      form.setFieldsValue({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
    } else if (section === 'address') {
      form.setFieldsValue({
        postalCode: profile.postalCode,
        address: profile.address,
        addressDetail: profile.addressDetail,
      });
    } else if (section === 'bank') {
      form.setFieldsValue({
        bankName: profile.bankName,
        accountNumber: profile.accountNumber,
        accountHolder: profile.accountHolder,
      });
    }

    setEditModalVisible(true);
  };

  // 프로필 수정
  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await profileService.updateMyProfile(values);
      message.success('정보가 수정되었습니다.');
      setEditModalVisible(false);
      fetchProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      message.error(error.message || '정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    Modal.confirm({
      title: '로그아웃',
      content: '정말 로그아웃 하시겠습니까?',
      okText: '로그아웃',
      cancelText: '취소',
      onOk: () => {
        authService.logout();
        logout();
        router.push('/login');
      },
    });
  };

  // 등급 표시
  const getGradeTag = (grade: string) => {
    const label = MemberGradeLabels[grade as keyof typeof MemberGradeLabels] || grade;
    const color = MemberGradeColors[grade as keyof typeof MemberGradeColors] || 'default';
    return <Tag color={color}>{label}</Tag>;
  };

  // 판매 상태 태그
  const getSaleStatusTag = (status: Sale['status']) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: '대기' },
      CONFIRMED: { color: 'processing', text: '확정' },
      SETTLED: { color: 'success', text: '정산완료' },
      CANCELLED: { color: 'default', text: '취소' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 판매 내역 테이블 컬럼
  const salesColumns: ColumnsType<Sale> = [
    {
      title: '판매일',
      dataIndex: 'soldAt',
      key: 'soldAt',
      width: 110,
      render: (date) => (date ? new Date(date).toLocaleDateString('ko-KR') : '-'),
    },
    {
      title: '제품명',
      key: 'product',
      ellipsis: true,
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
      width: 70,
      align: 'right',
    },
    {
      title: '판매금액',
      key: 'totalPrice',
      width: 110,
      align: 'right',
      render: (_, record) => `₩${(record.totalPrice || 0).toLocaleString()}`,
    },
    {
      title: 'PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      width: 80,
      align: 'right',
      render: (pv) => (pv || 0).toLocaleString(),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => getSaleStatusTag(status),
    },
  ];

  // 프로필 탭 렌더링
  const renderProfileTab = () => (
    <>
      {/* 기본 정보 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            기본 정보
          </Space>
        }
        extra={
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal('basic')}>
            수정
          </Button>
        }
        style={{ marginBottom: '16px' }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="아이디">{profile?.username}</Descriptions.Item>
          <Descriptions.Item label="이메일">{profile?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="전화번호">{profile?.phone || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 조직 정보 */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            조직 정보
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="추천인">
            {profile?.recommender ? (
              <Space>
                <Text>{profile.recommender.name}</Text>
                <Text type="secondary">(@{profile.recommender.username})</Text>
                {getGradeTag(profile.recommender.grade)}
              </Space>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="후원인">
            {profile?.sponsor ? (
              <Space>
                <Text>{profile.sponsor.name}</Text>
                <Text type="secondary">(@{profile.sponsor.username})</Text>
                {getGradeTag(profile.sponsor.grade)}
              </Space>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="소속팀">
            {profile?.teamLine ? `${profile.teamLine}팀` : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 주소 정보 */}
      <Card
        title={
          <Space>
            <HomeOutlined />
            주소 정보
          </Space>
        }
        extra={
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal('address')}>
            수정
          </Button>
        }
        style={{ marginBottom: '16px' }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="우편번호">{profile?.postalCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="주소">{profile?.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="상세주소">{profile?.addressDetail || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 계좌 정보 */}
      <Card
        title={
          <Space>
            <BankOutlined />
            계좌 정보
          </Space>
        }
        extra={
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal('bank')}>
            수정
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="은행">{profile?.bankName || '-'}</Descriptions.Item>
          <Descriptions.Item label="계좌번호">{profile?.accountNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="예금주">{profile?.accountHolder || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 하단 버튼 */}
      <Row gutter={16}>
        <Col span={12}>
          <Button block icon={<LockOutlined />} onClick={() => router.push('/mypage/password')}>
            비밀번호 변경
          </Button>
        </Col>
        <Col span={12}>
          <Button block danger icon={<LogoutOutlined />} onClick={handleLogout}>
            로그아웃
          </Button>
        </Col>
      </Row>
    </>
  );

  // 판매 내역 탭 렌더링
  const renderSalesTab = () => (
    <div>
      {sales.length === 0 && !salesLoading ? (
        <Empty description="판매 내역이 없습니다" style={{ padding: '40px 0' }} />
      ) : (
        <Table
          columns={salesColumns}
          dataSource={sales}
          rowKey="id"
          loading={salesLoading}
          pagination={{
            ...salesPagination,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
            onChange: (page, pageSize) => {
              fetchMySales(page, pageSize || 10);
            },
          }}
          size="small"
        />
      )}
    </div>
  );

  // 수정 폼 필드 렌더링
  const renderEditFormFields = () => {
    if (editSection === 'basic') {
      return (
        <>
          <Form.Item
            name="name"
            label="이름"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input placeholder="이름" />
          </Form.Item>
          <Form.Item
            name="email"
            label="이메일"
            rules={[{ type: 'email', message: '올바른 이메일 형식이 아닙니다' }]}
          >
            <Input placeholder="이메일" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="전화번호"
            rules={[
              {
                pattern: /^01[0-9](-\d{3,4}-\d{4}|\d{7,8})$/,
                message: '010-1234-5678 또는 01012345678 형식으로 입력해주세요',
              },
            ]}
          >
            <Input placeholder="010-1234-5678 또는 01012345678" />
          </Form.Item>
        </>
      );
    } else if (editSection === 'address') {
      return (
        <>
          <Form.Item name="postalCode" label="우편번호">
            <Input placeholder="우편번호" />
          </Form.Item>
          <Form.Item name="address" label="주소">
            <Input placeholder="주소" />
          </Form.Item>
          <Form.Item name="addressDetail" label="상세주소">
            <Input placeholder="상세주소" />
          </Form.Item>
        </>
      );
    } else {
      return (
        <>
          <Form.Item name="bankName" label="은행명">
            <Input placeholder="은행명" />
          </Form.Item>
          <Form.Item name="accountNumber" label="계좌번호">
            <Input placeholder="계좌번호" />
          </Form.Item>
          <Form.Item name="accountHolder" label="예금주">
            <Input placeholder="예금주" />
          </Form.Item>
        </>
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text>프로필 정보를 불러올 수 없습니다.</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <UserOutlined /> 마이페이지
      </Title>

      {/* 프로필 헤더 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#E53935' }} />
          </Col>
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                {profile.name}
              </Title>
              <Space>
                {getGradeTag(profile.grade)}
                <Text type="secondary">@{profile.username}</Text>
              </Space>
              <Text type="secondary">
                가입일: {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical">
              <Text strong>누적 PV</Text>
              <Text style={{ fontSize: '18px', color: '#E53935' }}>
                {profile.cumulativePv.toLocaleString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 탭 구조 */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'profile',
            label: (
              <span>
                <UserOutlined /> 내 정보
              </span>
            ),
            children: renderProfileTab(),
          },
          {
            key: 'sales',
            label: (
              <span>
                <ShoppingOutlined /> 내 판매 내역
              </span>
            ),
            children: renderSalesTab(),
          },
        ]}
      />

      {/* 수정 모달 */}
      <Modal
        title={
          editSection === 'basic'
            ? '기본 정보 수정'
            : editSection === 'address'
              ? '주소 정보 수정'
              : '계좌 정보 수정'
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderEditFormFields()}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>취소</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                저장
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
