'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  InputNumber,
  Table,
  Tag,
  message,
  Spin,
  Empty,
  Divider,
  Typography,
  Space,
  Modal,
  Alert,
} from 'antd';
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/services/api';
import {
  ordersService,
  Order,
  OrderStatusLabels,
  OrderStatusColors,
  OrderStatus,
} from '@/services/orders.service';

const { Text, Title } = Typography;

interface RepurchaseTabProps {
  memberId: number;
  memberName: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  pv: number;
  imageUrl?: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// 회사 계좌 정보 (실제 환경에서는 환경변수 또는 API로 관리)
const COMPANY_BANK_INFO = {
  bankName: '국민은행',
  accountNumber: '123-456-789012',
  accountHolder: '(주)케이아이온',
};

export function RepurchaseTab({ memberId, memberName }: RepurchaseTabProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 상품 목록 로드
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: Product[] }>('/v1/products', {
        limit: '100',
        isActive: 'true',
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // 주문 목록 로드
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await ordersService.getOrdersByMember(memberId, { limit: 5 });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [memberId]);

  // 장바구니에 추가
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // 수량 변경
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  // 장바구니에서 삭제
  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // 총 금액/PV 계산
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalPv = cart.reduce((sum, item) => sum + item.product.pv * item.quantity, 0);

  // 주문 생성
  const createOrder = async () => {
    if (cart.length === 0) {
      message.warning('장바구니가 비어있습니다.');
      return;
    }

    Modal.confirm({
      title: '주문 생성 확인',
      content: (
        <div>
          <p>
            <strong>{memberName}</strong>님의 재구매 주문을 생성하시겠습니까?
          </p>
          <Alert
            type="info"
            message="계좌 이체 정보"
            description={
              <div style={{ marginTop: 8 }}>
                <p>은행: {COMPANY_BANK_INFO.bankName}</p>
                <p>계좌번호: {COMPANY_BANK_INFO.accountNumber}</p>
                <p>예금주: {COMPANY_BANK_INFO.accountHolder}</p>
                <p style={{ fontWeight: 600, color: '#1890ff' }}>
                  입금액: {totalPrice.toLocaleString()}원
                </p>
              </div>
            }
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: '주문 생성',
      cancelText: '취소',
      onOk: async () => {
        try {
          setSubmitting(true);
          const order = await ordersService.createOrder({
            memberId,
            items: cart.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
            note: `관리자 생성 주문 (${memberName})`,
          });
          message.success(`주문이 생성되었습니다. 주문번호: ${order.orderCode}`);
          setCart([]);
          loadOrders();
        } catch (error: any) {
          message.error(error.message || '주문 생성에 실패했습니다.');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // 주문 테이블 컬럼
  const orderColumns = [
    {
      title: '주문번호',
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 150,
    },
    {
      title: '금액',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: 'PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      width: 80,
      render: (pv: number) => pv.toLocaleString(),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: OrderStatus) => (
        <Tag color={OrderStatusColors[status]}>{OrderStatusLabels[status]}</Tag>
      ),
    },
    {
      title: '주문일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 계좌 정보 */}
      <Alert
        icon={<BankOutlined />}
        type="info"
        message="입금 계좌 정보"
        description={
          <Space split={<Divider type="vertical" />}>
            <span>{COMPANY_BANK_INFO.bankName}</span>
            <span style={{ fontWeight: 500 }}>{COMPANY_BANK_INFO.accountNumber}</span>
            <span>{COMPANY_BANK_INFO.accountHolder}</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      {/* 상품 목록 */}
      <Title level={5}>
        <ShoppingCartOutlined /> 상품 선택
      </Title>
      {loading ? (
        <Spin />
      ) : products.length === 0 ? (
        <Empty description="등록된 상품이 없습니다" />
      ) : (
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          {products.slice(0, 8).map((product) => (
            <Col key={product.id} xs={12} sm={8} md={6}>
              <Card
                size="small"
                hoverable
                onClick={() => addToCart(product)}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {product.price.toLocaleString()}원 / {product.pv}PV
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Divider />

      {/* 장바구니 */}
      <Title level={5}>
        <ShoppingCartOutlined /> 장바구니 ({cart.length}개)
      </Title>
      {cart.length === 0 ? (
        <Empty description="장바구니가 비어있습니다" style={{ padding: 24 }} />
      ) : (
        <>
          {cart.map((item) => (
            <Card key={item.product.id} size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{item.product.name}</Text>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {item.product.price.toLocaleString()}원 / {item.product.pv}PV
                  </div>
                </div>
                <Space>
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  />
                  <InputNumber
                    size="small"
                    min={1}
                    value={item.quantity}
                    onChange={(value) => updateQuantity(item.product.id, value || 1)}
                    style={{ width: 60 }}
                  />
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(item.product.id)}
                  />
                </Space>
              </div>
            </Card>
          ))}

          {/* 합계 및 주문 버튼 */}
          <Card style={{ marginTop: 16, background: '#fafafa' }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <div>
                  <Text type="secondary">총 금액</Text>
                  <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                    {totalPrice.toLocaleString()}원
                  </Title>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">총 PV: </Text>
                  <Text strong>{totalPv.toLocaleString()}</Text>
                </div>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={createOrder}
                  loading={submitting}
                >
                  주문 생성
                </Button>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Divider />

      {/* 최근 주문 내역 */}
      <Title level={5}>최근 주문 내역</Title>
      {ordersLoading ? (
        <Spin />
      ) : orders.length === 0 ? (
        <Empty description="주문 내역이 없습니다" />
      ) : (
        <Table
          columns={orderColumns}
          dataSource={orders}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )}
    </div>
  );
}

export default RepurchaseTab;
