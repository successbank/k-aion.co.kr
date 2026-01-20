'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Select,
  Space,
  Descriptions,
  Divider,
  message,
  Alert,
  Row,
  Col,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

const { Option } = Select;
const { Title, Text } = Typography;

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pv: number;
  stock: number;
  isActive: boolean;
}

interface Member {
  id: number;
  username: string;
  name: string;
  email: string | null;
  grade: string;
  isActive: boolean;
  cumulativePv: number;
}

interface MemberSearchResponse {
  data: Member[];
  total: number;
}

interface RecognizedSale {
  id: number;
  saleCode: string;
  seller: Member;
  product: Product;
  quantity: number;
  totalPrice: number;
  totalPv: number;
  recognizedGrade: string;
  recognizedAt: string;
  recognizer: {
    id: number;
    name: string;
  };
  description: string;
}

interface RecognizedSaleTabProps {
  onSuccess?: () => void;
}

const gradeLabels: Record<string, string> = {
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
  CENTER: '센터',
  ADMIN: '최고관리자',
};

const gradeColors: Record<string, string> = {
  MEMBER: '#999999',
  AGENT: '#52c41a',
  MANAGER: '#1890ff',
  BRANCH_CHIEF: '#722ed1',
  DIVISION_CHIEF: '#fa8c16',
  CENTER: '#eb2f96',
  ADMIN: '#f5222d',
};

export default function RecognizedSaleTab({ onSuccess }: RecognizedSaleTabProps) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // 인정매출 목록
  const [recognizedSales, setRecognizedSales] = useState<RecognizedSale[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchProducts();
    fetchRecognizedSales();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/v1/products', {
        params: { isActive: true, limit: 1000 },
      });
      setProducts(data.data || []);
    } catch (error: any) {
      message.error('제품 목록 조회 실패');
    }
  };

  const fetchRecognizedSales = async (page = 1, pageSize = 10) => {
    setListLoading(true);
    try {
      const { data } = await api.get('/v1/sales/recognized', {
        params: { page, limit: pageSize },
      });
      setRecognizedSales(data.data || []);
      setPagination({
        current: data.page,
        pageSize: data.limit,
        total: data.total,
      });
    } catch (error: any) {
      message.error('인정매출 목록 조회 실패');
    } finally {
      setListLoading(false);
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchMembers = async (searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchValue || searchValue.length < 2) {
      setMembers([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setMemberSearchLoading(true);
      try {
        const { data } = await api.get<MemberSearchResponse>('/v1/members/search', {
          params: { search: searchValue, limit: 20 },
        });
        setMembers(data.data || []);
      } catch (error) {
        console.error('회원 검색 실패:', error);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 300);
  };

  const handleMemberSelect = (memberId: number) => {
    const member = members.find((m) => m.id === memberId);
    setSelectedMember(member || null);
    form.setFieldsValue({ memberId });
  };

  const handleProductChange = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    form.setFieldsValue({ productId });
  };

  const handleSubmit = async (values: any) => {
    if (!user?.id) {
      message.error('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/v1/sales/recognized?adminId=${user.id}`, {
        memberId: values.memberId,
        productId: values.productId,
        quantity: values.quantity || 1,
        targetGrade: values.targetGrade,
        description: values.description,
      });

      message.success('인정매출이 등록되었습니다.');
      form.resetFields();
      setSelectedMember(null);
      setSelectedProduct(null);
      fetchRecognizedSales();
      onSuccess?.();
    } catch (error: any) {
      message.error(error.response?.data?.message || '인정매출 등록 실패');
    } finally {
      setLoading(false);
    }
  };

  const quantity = Form.useWatch('quantity', form) || 1;
  const calculatedPrice = selectedProduct ? selectedProduct.price * quantity : 0;
  const calculatedPv = selectedProduct ? selectedProduct.pv * quantity : 0;

  const columns = [
    {
      title: '판매코드',
      dataIndex: 'saleCode',
      key: 'saleCode',
      width: 150,
    },
    {
      title: '대상 회원',
      key: 'member',
      render: (_: any, record: RecognizedSale) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.seller.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            @{record.seller.username}
          </Text>
        </Space>
      ),
    },
    {
      title: '제품',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: '수량',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
    },
    {
      title: '금액',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right' as const,
      render: (value: number) => `${value.toLocaleString()}원`,
    },
    {
      title: 'PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '지정 등급',
      dataIndex: 'recognizedGrade',
      key: 'recognizedGrade',
      render: (grade: string) => (
        <Tag color={gradeColors[grade] || 'default'}>{gradeLabels[grade] || grade}</Tag>
      ),
    },
    {
      title: '등록자',
      dataIndex: ['recognizer', 'name'],
      key: 'recognizer',
    },
    {
      title: '등록일시',
      dataIndex: 'recognizedAt',
      key: 'recognizedAt',
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
  ];

  return (
    <div>
      <Row gutter={24}>
        {/* 인정매출 등록 폼 */}
        <Col span={10}>
          <Card title="인정매출 등록" style={{ marginBottom: 24 }}>
            <Alert
              message="인정매출이란?"
              description="회사 설립 시 구성원들의 등급을 설정하기 위한 가상 매출입니다. 인정매출은 보너스 지급 대상에서 제외됩니다."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="대상 회원"
                name="memberId"
                rules={[{ required: true, message: '회원을 선택해주세요' }]}
              >
                <Select
                  showSearch
                  placeholder="회원 이름 또는 아이디로 검색"
                  onSearch={searchMembers}
                  onChange={handleMemberSelect}
                  loading={memberSearchLoading}
                  filterOption={false}
                  notFoundContent={memberSearchLoading ? <Spin size="small" /> : '검색 결과 없음'}
                >
                  {members.map((member) => (
                    <Option key={member.id} value={member.id}>
                      {member.name} (@{member.username}) -{' '}
                      <Tag color={gradeColors[member.grade]}>{gradeLabels[member.grade]}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedMember && (
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
                    <Descriptions.Item label="아이디">{selectedMember.username}</Descriptions.Item>
                    <Descriptions.Item label="현재 등급">
                      <Tag color={gradeColors[selectedMember.grade]}>
                        {gradeLabels[selectedMember.grade]}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="누적 PV">
                      {selectedMember.cumulativePv.toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              <Form.Item
                label="목표 등급"
                name="targetGrade"
                rules={[{ required: true, message: '목표 등급을 선택해주세요' }]}
              >
                <Select placeholder="등급 선택">
                  <Option value="AGENT">
                    <Tag color={gradeColors.AGENT}>에이전트</Tag>
                  </Option>
                  <Option value="MANAGER">
                    <Tag color={gradeColors.MANAGER}>매니저</Tag>
                  </Option>
                  <Option value="BRANCH_CHIEF">
                    <Tag color={gradeColors.BRANCH_CHIEF}>지부장</Tag>
                  </Option>
                  <Option value="DIVISION_CHIEF">
                    <Tag color={gradeColors.DIVISION_CHIEF}>본부장</Tag>
                  </Option>
                  <Option value="CENTER">
                    <Tag color={gradeColors.CENTER}>센터</Tag>
                  </Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item
                label="제품 선택"
                name="productId"
                rules={[{ required: true, message: '제품을 선택해주세요' }]}
              >
                <Select
                  showSearch
                  placeholder="제품 선택"
                  onChange={handleProductChange}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedProduct && (
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="제품명">{selectedProduct.name}</Descriptions.Item>
                    <Descriptions.Item label="제품코드">{selectedProduct.code}</Descriptions.Item>
                    <Descriptions.Item label="단가">
                      {selectedProduct.price.toLocaleString()}원
                    </Descriptions.Item>
                    <Descriptions.Item label="단위 PV">
                      {selectedProduct.pv.toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              <Form.Item label="수량" name="quantity" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>

              {selectedProduct && (
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fffbe6' }}>
                  <Descriptions size="small" column={2}>
                    <Descriptions.Item label="총 금액">
                      <Text strong style={{ color: '#1890ff' }}>
                        {calculatedPrice.toLocaleString()}원
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="총 PV">
                      <Text strong style={{ color: '#52c41a' }}>
                        {calculatedPv.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              <Form.Item label="등록 사유" name="description">
                <Input.TextArea
                  rows={2}
                  placeholder="예: 회사 설립 초기 등급 설정"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                  block
                  size="large"
                >
                  인정매출 등록
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 인정매출 목록 */}
        <Col span={14}>
          <Card
            title="인정매출 목록"
            extra={
              <Button onClick={() => fetchRecognizedSales()} loading={listLoading}>
                새로고침
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={recognizedSales}
              rowKey="id"
              loading={listLoading}
              pagination={{
                ...pagination,
                onChange: (page, pageSize) => fetchRecognizedSales(page, pageSize),
              }}
              size="small"
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
