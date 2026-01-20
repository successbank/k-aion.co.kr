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
  DatePicker,
} from 'antd';
import { ShoppingCartOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { api } from '@/lib/api';

const { Option } = Select;

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pv: number;
  stock: number;
  isActive: boolean;
}

interface BonusPreview {
  totalPrice: number;
  totalPv: number;
  bonuses: Array<{
    type: string;
    amount: number;
    description: string;
    recipientId?: number;
    recipientName?: string;
  }>;
  totalBonus: number;
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

interface CreateSaleTabProps {
  onSuccess?: () => void;
}

export default function CreateSaleTab({ onSuccess }: CreateSaleTabProps) {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bonusPreview, setBonusPreview] = useState<BonusPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [saleDate, setSaleDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/v1/products', {
        params: {
          isActive: true,
          limit: 1000, // Get all active products
        },
      });
      setProducts(data.data || []);
    } catch (error: any) {
      message.error('제품 목록 조회 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchMembers = async (searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.length < 1) {
      setMembers([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setMemberSearchLoading(true);

        const { data } = await api.get<MemberSearchResponse>('/v1/members/search', {
          params: { q: searchValue, limit: 20, isActive: true },
        });

        setMembers(data.data);
      } catch (error: any) {
        message.error('회원 검색 실패: ' + (error.response?.data?.message || error.message));
        setMembers([]);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 300); // 300ms 디바운스
  };

  const handleMemberChange = async (memberId: number) => {
    if (!memberId) {
      setSelectedMember(null);
      return;
    }

    // 캐시된 데이터 우선 사용
    const cachedMember = members.find((m) => m.id === memberId);

    if (cachedMember) {
      setSelectedMember(cachedMember);
    } else {
      // 캐시에 없으면 API 호출
      try {
        const { data } = await api.get<Member>(`/v1/members/${memberId}`);
        setSelectedMember(data);
      } catch (error: any) {
        message.error('회원 정보 조회 실패');
        setSelectedMember(null);
      }
    }

    setBonusPreview(null);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleProductChange = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);

    if (product) {
      // Auto-fill price and PV
      form.setFieldsValue({
        unitPrice: product.price,
        unitPv: product.pv,
      });

      // Recalculate totals if quantity exists
      const quantity = form.getFieldValue('quantity');
      if (quantity) {
        calculateTotals(quantity, product.price, product.pv);
      }
    }

    // Clear bonus preview when product changes
    setBonusPreview(null);
  };

  const handleQuantityChange = (quantity: number | null) => {
    if (quantity && selectedProduct) {
      calculateTotals(quantity, selectedProduct.price, selectedProduct.pv);
    }
  };

  const calculateTotals = (quantity: number, unitPrice: number, unitPv: number) => {
    const totalAmount = quantity * unitPrice;
    const totalPv = quantity * unitPv;

    form.setFieldsValue({
      totalAmount,
      totalPv,
    });
  };

  const handlePreviewBonus = async () => {
    try {
      await form.validateFields(['sellerId', 'productId', 'quantity']);

      const values = form.getFieldsValue();
      setPreviewLoading(true);

      const { data } = await api.get('/v1/sales/preview', {
        params: {
          sellerId: values.sellerId,
          productId: values.productId,
          quantity: values.quantity,
        },
      });

      setBonusPreview(data);
      message.success('보너스 미리보기가 조회되었습니다.');
    } catch (error: any) {
      if (error.errorFields) {
        message.warning('판매자, 제품, 수량을 먼저 입력해주세요.');
      } else {
        message.error('보너스 미리보기 실패: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 요청 바디 구성
      const requestBody: {
        productId: number;
        quantity: number;
        saleDate?: string;
      } = {
        productId: values.productId,
        quantity: values.quantity,
      };

      // 판매 일자가 선택된 경우에만 포함
      if (saleDate) {
        requestBody.saleDate = saleDate.toISOString();
      }

      await api.post('/v1/sales', requestBody, {
        params: {
          sellerId: values.sellerId,
        },
      });

      message.success('판매가 등록되었습니다.');
      form.resetFields();
      setSelectedProduct(null);
      setSelectedMember(null);
      setMembers([]);
      setBonusPreview(null);
      setSaleDate(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      message.error('판매 등록 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="판매 등록">
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="판매자 선택"
                name="sellerId"
                rules={[
                  { required: true, message: '판매자를 선택하세요' },
                  {
                    validator: async (_, value) => {
                      if (value && selectedMember) {
                        if (!selectedMember.isActive) {
                          throw new Error('비활성화된 회원은 선택할 수 없습니다');
                        }
                      }
                    },
                  },
                ]}
              >
                <Select
                  placeholder="이름, 아이디 또는 ID로 검색"
                  showSearch
                  filterOption={false}
                  onSearch={searchMembers}
                  onChange={handleMemberChange}
                  loading={memberSearchLoading}
                  notFoundContent={
                    memberSearchLoading ? <Spin size="small" /> : '검색 결과가 없습니다'
                  }
                  allowClear
                >
                  {members.map((member) => (
                    <Option
                      key={member.id}
                      value={member.id}
                      label={`${member.name} (${member.username})`}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {member.name} ({member.username})
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          ID: {member.id} | {member.grade} | {member.isActive ? '활성' : '비활성'}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="제품 선택"
                name="productId"
                rules={[{ required: true, message: '제품을 선택하세요' }]}
              >
                <Select
                  placeholder="제품 선택"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleProductChange}
                  filterOption={(input, option) =>
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option
                      key={product.id}
                      value={product.id}
                      label={`${product.name} (${product.code})`}
                    >
                      <div>
                        <div>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {product.code} | ₩{product.price.toLocaleString()} | PV:{' '}
                          {product.pv.toLocaleString()} | 재고: {product.stock}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedMember && (
            <Card
              size="small"
              style={{ marginBottom: 16, background: '#f0f5ff', borderColor: '#E53935' }}
            >
              <Descriptions column={2} size="small" title="선택된 판매자 정보">
                <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
                <Descriptions.Item label="아이디">{selectedMember.username}</Descriptions.Item>
                <Descriptions.Item label="회원 ID">{selectedMember.id}</Descriptions.Item>
                <Descriptions.Item label="등급">
                  <span
                    style={{
                      color:
                        selectedMember.grade === 'ADMIN'
                          ? '#ff4d4f'
                          : selectedMember.grade === 'CENTER'
                            ? '#eb2f96'
                            : selectedMember.grade === 'DIVISION_CHIEF'
                              ? '#fa8c16'
                              : selectedMember.grade === 'BRANCH_CHIEF'
                                ? '#faad14'
                                : selectedMember.grade === 'MANAGER'
                                  ? '#52c41a'
                                  : '#1890ff',
                      fontWeight: 500,
                    }}
                  >
                    {selectedMember.grade}
                  </span>
                </Descriptions.Item>
                {selectedMember.email && (
                  <Descriptions.Item label="이메일" span={2}>
                    {selectedMember.email}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="누적 PV">
                  {selectedMember.cumulativePv.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  <span style={{ color: selectedMember.isActive ? '#52c41a' : '#ff4d4f' }}>
                    {selectedMember.isActive ? '활성' : '비활성'}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {selectedProduct && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="제품명">{selectedProduct.name}</Descriptions.Item>
                <Descriptions.Item label="제품코드">{selectedProduct.code}</Descriptions.Item>
                <Descriptions.Item label="단가">
                  ₩{selectedProduct.price.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="PV">
                  {selectedProduct.pv.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="재고" span={2}>
                  {selectedProduct.stock.toLocaleString()}개
                  {selectedProduct.stock < 10 && (
                    <span style={{ color: 'red', marginLeft: 8 }}>재고 부족</span>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="수량"
                name="quantity"
                rules={[
                  { required: true, message: '수량을 입력하세요' },
                  { type: 'number', min: 1, message: '수량은 1 이상이어야 합니다' },
                ]}
              >
                <InputNumber
                  placeholder="수량 입력"
                  style={{ width: '100%' }}
                  min={1}
                  onChange={handleQuantityChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="단가" name="unitPrice">
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  formatter={(value) => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="단위 PV" name="unitPv">
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="총 판매금액" name="totalAmount">
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  formatter={(value) => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="총 PV" name="totalPv">
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    <CalendarOutlined />
                    <span>판매 일자 (선택)</span>
                  </Space>
                }
                name="saleDate"
                tooltip="미선택 시 현재 시간으로 등록됩니다. 과거 매출을 소급 등록할 때 사용하세요."
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="판매 일자 선택 (미선택 시 오늘)"
                  onChange={(date) => setSaleDate(date)}
                  value={saleDate}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              {saleDate && (
                <Alert
                  message={`선택된 판매 일자: ${saleDate.format('YYYY-MM-DD HH:mm:ss')}`}
                  description="해당 날짜 기준으로 정산 주차가 계산됩니다."
                  type="info"
                  showIcon
                  style={{ marginTop: 30 }}
                />
              )}
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={handlePreviewBonus}
              loading={previewLoading}
            >
              보너스 미리보기
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<ShoppingCartOutlined />}
              loading={loading}
            >
              판매 등록
            </Button>
          </Space>
        </Form>
      </Card>

      {bonusPreview && (
        <Card title="예상 보너스" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="판매금액">
              ₩{(bonusPreview.totalPrice || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="총 PV">
              {(bonusPreview.totalPv || 0).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>보너스 상세 내역</h4>
            {bonusPreview.bonuses?.length === 0 ? (
              <Alert message="예상되는 보너스가 없습니다." type="info" />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>보너스 유형</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>수령인</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusPreview.bonuses?.map((bonus, index) => (
                    <tr key={index}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 500 }}>{bonus.type}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                          {bonus.description}
                        </div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        {bonus.recipientName || '-'}
                        {bonus.recipientId && (
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: 4 }}>
                            (ID: {bonus.recipientId})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0', fontWeight: 500, color: '#52c41a' }}>
                        ₩{(bonus.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan={2} style={{ padding: '12px', fontWeight: 'bold' }}>예상 총 보너스</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                      ₩{(bonusPreview.totalBonus || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <Alert
            message="보너스 미리보기"
            description="실제 보너스는 정산 시점의 조직 구조와 등급에 따라 달라질 수 있습니다. 판권 보너스, 판권 관리 보너스, 공유 보너스는 별도 조건에 의해 발생합니다."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      )}
    </div>
  );
}
