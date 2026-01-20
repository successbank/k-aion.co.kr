'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Input,
  Tag,
  Space,
  Typography,
  message,
  Select,
  Card,
  Image,
  Descriptions,
  Drawer,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { api } from '@/lib/api';

const { Title } = Typography;
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
  description?: string;
  price: number;
  pv: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  category?: Category;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, pagination.current]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/v1/categories');
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/v1/products', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: search || undefined,
          categoryId: categoryFilter,
          isActive: true,
        },
      });
      setProducts(data.data);
      setPagination({
        ...pagination,
        total: data.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      message.error(error.response?.data?.message || '제품 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDrawerVisible(true);
  };

  const columns = [
    {
      title: '이미지',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string) =>
        imageUrl ? (
          <Image src={imageUrl} alt="제품" width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
            이미지 없음
          </div>
        ),
    },
    { title: '제품코드', dataIndex: 'code', key: 'code', width: 120 },
    { title: '제품명', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: Category) =>
        category ? `${category.parent?.name || ''} > ${category.name}` : '-',
    },
    {
      title: '판매가',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: 'PV',
      dataIndex: 'pv',
      key: 'pv',
      width: 100,
      render: (pv: number) => pv.toLocaleString(),
    },
    {
      title: '재고',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <Tag color={stock === 0 ? 'red' : stock < 10 ? 'orange' : 'green'}>
          {stock.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: Product) => {
        if (!isActive) return <Tag color="default">단종</Tag>;
        if (record.stock === 0) return <Tag color="error">품절</Tag>;
        return <Tag color="success">판매중</Tag>;
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      render: (_: any, record: Product) => (
        <a onClick={() => handleViewDetail(record)} className="text-blue-500">
          <EyeOutlined /> 상세
        </a>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>제품 목록</Title>
      </div>

      <Card className="mb-4">
        <Space size="middle">
          <Input
            placeholder="제품명 또는 코드 검색"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="카테고리 선택"
            style={{ width: 200 }}
            onChange={setCategoryFilter}
            allowClear
          >
            {categories
              .filter((cat) => cat.level === 2)
              .map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.parent?.name} &gt; {cat.name}
                </Option>
              ))}
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={(p) => setPagination({ ...pagination, current: p.current || 1 })}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="제품 상세 정보"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedProduct && (
          <div>
            {selectedProduct.imageUrl && (
              <div className="mb-4 text-center">
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </div>
            )}

            <Descriptions column={1} bordered>
              <Descriptions.Item label="제품코드">{selectedProduct.code}</Descriptions.Item>
              <Descriptions.Item label="제품명">{selectedProduct.name}</Descriptions.Item>
              <Descriptions.Item label="카테고리">
                {selectedProduct.category
                  ? `${selectedProduct.category.parent?.name || ''} > ${selectedProduct.category.name}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="판매가">
                {selectedProduct.price.toLocaleString()}원
              </Descriptions.Item>
              <Descriptions.Item label="PV">
                {selectedProduct.pv.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="재고">
                <Tag color={selectedProduct.stock === 0 ? 'red' : 'green'}>
                  {selectedProduct.stock.toLocaleString()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {selectedProduct.isActive ? (
                  <Tag color="success">판매중</Tag>
                ) : (
                  <Tag color="default">단종</Tag>
                )}
              </Descriptions.Item>
              {selectedProduct.description && (
                <Descriptions.Item label="설명">{selectedProduct.description}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  );
}
