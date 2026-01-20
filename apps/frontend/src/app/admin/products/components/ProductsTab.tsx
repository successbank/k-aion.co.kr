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
  App,
  Popconfirm,
  Tag,
  Image,
  Switch,
  Tooltip,
  Upload,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import RichTextEditor from '@/components/common/RichTextEditor';

const { Option } = Select;

interface Category {
  id: number;
  name: string;
  level: number;
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
  minStock: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsTab() {
  const { message } = App.useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, activeFilter, pagination.current]);

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
          isActive: activeFilter,
        },
      });
      setProducts(data.data);
      setPagination({
        ...pagination,
        total: data.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      message.error(error.response?.data?.message || '제품 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setImageUrl('');
    setDescription('');
    form.resetFields();
    form.setFieldsValue({ isActive: true, stock: 0, minStock: 0 });
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const fullImageUrl = getImageUrl(product.imageUrl);
    setImageUrl(fullImageUrl);
    setDescription(product.description || '');
    form.setFieldsValue({
      code: product.code,
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      pv: product.pv,
      stock: product.stock,
      minStock: product.minStock,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/products/${id}`);
      message.success('제품이 삭제되었습니다.');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      message.error(error.response?.data?.message || '제품 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = { ...values, description, imageUrl: imageUrl || undefined };
      if (editingProduct) {
        await api.patch(`/v1/products/${editingProduct.id}`, payload);
        message.success('제품이 수정되었습니다.');
      } else {
        await api.post('/v1/products', payload);
        message.success('제품이 추가되었습니다.');
      }
      setModalVisible(false);
      form.resetFields();
      setImageUrl('');
      setDescription('');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      message.error(error.response?.data?.message || '제품 저장에 실패했습니다.');
    }
  };

  // 파일 업로드 전 검증
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('이미지 파일만 업로드 가능합니다!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('이미지 크기는 5MB를 초과할 수 없습니다!');
      return false;
    }

    return true;
  };

  // 커스텀 업로드 함수
  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadLoading(true);
      const { data } = await api.post('/v1/upload/product-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImageUrl(data.url);
      form.setFieldsValue({ imageUrl: data.url });
      message.success('이미지가 업로드되었습니다.');
      onSuccess(data);
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      message.error(error.response?.data?.message || '이미지 업로드에 실패했습니다.');
      onError(error);
    } finally {
      setUploadLoading(false);
    }
  };

  // 이미지 제거
  const handleRemove = () => {
    setImageUrl('');
    form.setFieldsValue({ imageUrl: '' });
  };

  // 이미지 URL 보정 (placeholder URL 자동 추가)
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '';

    // 이미 완전한 URL이면 그대로 반환
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // placeholder.com 형식 (300x300?text=ProductName)이면 도메인 추가
    if (imageUrl.match(/^\d+x\d+\?text=/)) {
      return `https://via.placeholder.com/${imageUrl}`;
    }

    return imageUrl;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '이미지',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string) => {
        const fullImageUrl = getImageUrl(imageUrl);
        return fullImageUrl ? (
          <Image
            src={fullImageUrl}
            alt="제품"
            width={50}
            height={50}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
            이미지 없음
          </div>
        );
      },
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
      width: 120,
      render: (category: Category) => category?.name || '-',
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
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      width: 100,
      render: (description: string) =>
        description ? (
          <Tooltip
            title={
              <div
                dangerouslySetInnerHTML={{ __html: description }}
                style={{ maxWidth: '400px', maxHeight: '300px', overflow: 'auto' }}
              />
            }
            styles={{ root: { maxWidth: '450px' } }}
          >
            <Button size="small" type="link">
              미리보기
            </Button>
          </Tooltip>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: '재고',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number, record: Product) => {
        const isLow = stock <= record.minStock && stock > 0;
        const isOut = stock === 0;
        return (
          <Tag color={isOut ? 'red' : isLow ? 'orange' : 'green'}>{stock.toLocaleString()}</Tag>
        );
      },
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: Product) => {
        if (!isActive) return <Tag color="default">단종</Tag>;
        if (record.stock === 0) return <Tag color="error">품절</Tag>;
        if (record.stock <= record.minStock) return <Tag color="warning">부족</Tag>;
        return <Tag color="success">판매중</Tag>;
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            수정
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
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
            placeholder="카테고리 선택"
            style={{ width: 150 }}
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
          <Select
            placeholder="상태 선택"
            style={{ width: 120 }}
            onChange={setActiveFilter}
            allowClear
          >
            <Option value={true}>판매중</Option>
            <Option value={false}>단종</Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          제품 추가
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={(p) => setPagination({ ...pagination, current: p.current || 1 })}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={editingProduct ? '제품 수정' : '제품 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="제품코드"
            name="code"
            rules={[{ required: true, message: '제품코드를 입력하세요' }]}
          >
            <Input placeholder="예: PROD-001" maxLength={50} disabled={!!editingProduct} />
          </Form.Item>

          <Form.Item
            label="제품명"
            name="name"
            rules={[{ required: true, message: '제품명을 입력하세요' }]}
          >
            <Input placeholder="예: 비타민 C 1000mg" maxLength={200} />
          </Form.Item>

          <Form.Item
            label="카테고리"
            name="categoryId"
            rules={[{ required: true, message: '카테고리를 선택하세요' }]}
          >
            <Select placeholder="카테고리 선택">
              {categories
                .filter((cat) => cat.level === 2)
                .map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.parent?.name} &gt; {cat.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="판매가 (원)"
              name="price"
              rules={[{ required: true, message: '판매가를 입력하세요' }]}
            >
              <InputNumber
                min={0}
                className="w-full"
                placeholder="50000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>

            <Form.Item
              label="PV (Point Value)"
              name="pv"
              rules={[{ required: true, message: 'PV를 입력하세요' }]}
            >
              <InputNumber
                min={0}
                className="w-full"
                placeholder="40000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="초기 재고" name="stock">
              <InputNumber min={0} className="w-full" placeholder="100" />
            </Form.Item>

            <Form.Item label="최소 재고 (알림 기준)" name="minStock">
              <InputNumber min={0} className="w-full" placeholder="10" />
            </Form.Item>
          </div>

          <Form.Item label="제품 이미지">
            <Upload
              name="file"
              listType="picture-card"
              className="product-image-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={handleUpload}
            >
              {imageUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={imageUrl}
                    alt="제품 이미지"
                    width={148}
                    height={148}
                    style={{ objectFit: 'cover' }}
                    preview={false}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    삭제
                  </Button>
                </div>
              ) : (
                <div>
                  {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8, fontSize: '12px' }}>이미지 업로드</div>
                </div>
              )}
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                업로드된 이미지: {imageUrl.split('/').pop()}
              </div>
            )}
          </Form.Item>

          <Form.Item label="제품 설명">
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="제품 설명을 입력하세요 (서식 지원)"
              height={200}
            />
          </Form.Item>

          <Form.Item label="판매 상태" name="isActive" valuePropName="checked">
            <Switch checkedChildren="판매중" unCheckedChildren="단종" />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>취소</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                저장
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
