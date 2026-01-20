'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Tag,
  Alert,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  WarningOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';

const { Option } = Select;

interface Category {
  id: number;
  name: string;
  parent?: Category;
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pv: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  isActive: boolean;
  category?: Category;
}

export default function StockTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    fetchProducts();
  }, [search, stockFilter, pagination.current]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/v1/products', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: search || undefined,
          isActive: true,
        },
      });

      let filteredData = data.data;
      if (stockFilter === 'low') {
        filteredData = data.data.filter((p: Product) => p.stock <= p.minStock && p.stock > 0);
      } else if (stockFilter === 'out') {
        filteredData = data.data.filter((p: Product) => p.stock === 0);
      }

      setProducts(filteredData);
      setPagination({
        ...pagination,
        total: filteredData.length,
      });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      message.error(error.response?.data?.message || '제품 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (product: Product) => {
    setAdjustingProduct(product);
    form.resetFields();
    form.setFieldsValue({
      type: 'add',
      adjustment: 0,
      reason: '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!adjustingProduct) return;

    try {
      const adjustment = values.type === 'add' ? values.adjustment : -values.adjustment;

      await api.patch(`/v1/products/${adjustingProduct.id}/stock`, {
        adjustment,
      });

      message.success('재고가 조정되었습니다.');
      setModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      message.error(error.response?.data?.message || '재고 조정에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '제품코드',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '제품명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: Category) =>
        category ? `${category.parent?.name || ''} > ${category.name}` : '-',
    },
    {
      title: '현재 재고',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      render: (stock: number, record: Product) => {
        const isLow = stock <= record.minStock && stock > 0;
        const isOut = stock === 0;
        return (
          <Tag color={isOut ? 'red' : isLow ? 'orange' : 'green'} className="text-base px-3 py-1">
            {stock.toLocaleString()}
          </Tag>
        );
      },
      sorter: (a: Product, b: Product) => a.stock - b.stock,
    },
    {
      title: '최소 재고',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
      render: (minStock: number) => minStock.toLocaleString(),
    },
    {
      title: '재고 상태',
      key: 'stockStatus',
      width: 120,
      render: (_: any, record: Product) => {
        if (record.stock === 0) {
          return (
            <Tag icon={<WarningOutlined />} color="error">
              품절
            </Tag>
          );
        }
        if (record.stock <= record.minStock) {
          return (
            <Tag icon={<WarningOutlined />} color="warning">
              부족
            </Tag>
          );
        }
        return <Tag color="success">정상</Tag>;
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
        <Button type="primary" size="small" onClick={() => handleAdjustStock(record)}>
          재고 조정
        </Button>
      ),
    },
  ];

  // 통계 계산
  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const normalStock = products.filter((p) => p.stock > p.minStock).length;

  return (
    <div>
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="전체 제품"
              value={totalProducts}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="정상 재고"
              value={normalStock}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="재고 부족"
              value={lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="품절"
              value={outOfStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {(outOfStock > 0 || lowStock > 0) && (
        <Alert
          message="재고 알림"
          description={`품절 제품 ${outOfStock}개, 재고 부족 제품 ${lowStock}개가 있습니다. 재고를 확인해주세요.`}
          type="warning"
          showIcon
          closable
          className="mb-4"
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <Space>
          <Input
            placeholder="제품명 또는 코드 검색"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            value={stockFilter}
            style={{ width: 150 }}
            onChange={setStockFilter}
          >
            <Option value="all">전체</Option>
            <Option value="low">재고 부족</Option>
            <Option value="out">품절</Option>
          </Select>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={(p) => setPagination({ ...pagination, current: p.current || 1 })}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={`재고 조정 - ${adjustingProduct?.name}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        {adjustingProduct && (
          <>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">현재 재고:</span>
                <span className="font-bold text-lg">
                  {adjustingProduct.stock.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최소 재고:</span>
                <span className="text-orange-500">
                  {adjustingProduct.minStock.toLocaleString()}
                </span>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="조정 유형"
                name="type"
                rules={[{ required: true, message: '조정 유형을 선택하세요' }]}
                initialValue="add"
              >
                <Select>
                  <Option value="add">
                    <PlusOutlined /> 재고 추가 (입고)
                  </Option>
                  <Option value="subtract">
                    <MinusOutlined /> 재고 차감 (출고)
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="조정 수량"
                name="adjustment"
                rules={[
                  { required: true, message: '조정 수량을 입력하세요' },
                  { type: 'number', min: 1, message: '1 이상의 값을 입력하세요' },
                ]}
              >
                <InputNumber min={1} className="w-full" placeholder="예: 100" />
              </Form.Item>

              <Form.Item
                label="조정 사유"
                name="reason"
                rules={[{ required: true, message: '조정 사유를 입력하세요' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="예: 신규 입고, 불량 제품 처리 등"
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item>
                <Space className="w-full justify-end">
                  <Button onClick={() => setModalVisible(false)}>취소</Button>
                  <Button type="primary" htmlType="submit">
                    조정 완료
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
