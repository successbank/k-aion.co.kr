'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, App, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Option } = Select;

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
}

export default function CategoriesTab() {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/v1/categories');
      setCategories(data);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      message.error(error.response?.data?.message || '카테고리 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      parentId: category.parentId,
      displayOrder: category.displayOrder,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/categories/${id}`);
      message.success('카테고리가 삭제되었습니다.');
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      message.error(error.response?.data?.message || '카테고리 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // 상위 카테고리 선택 여부에 따라 level 자동 결정
      const payload = {
        ...values,
        level: values.parentId ? 2 : 1,
      };

      if (editingCategory) {
        await api.patch(`/v1/categories/${editingCategory.id}`, payload);
        message.success('카테고리가 수정되었습니다.');
      } else {
        await api.post('/v1/categories', payload);
        message.success('카테고리가 추가되었습니다.');
      }
      setModalVisible(false);
      form.resetFields();
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      message.error(error.response?.data?.message || '카테고리 저장에 실패했습니다.');
    }
  };

  // 대분류 카테고리 목록 (부모가 없는 카테고리)
  const mainCategories = categories.filter((cat) => !cat.parentId);

  const columns = [
    {
      title: '카테고리명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <span>
          {record.level === 2 && <span className="mr-2">└─</span>}
          {name}
        </span>
      ),
    },
    {
      title: '레벨',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color={level === 1 ? 'blue' : 'green'}>{level === 1 ? '대분류' : '소분류'}</Tag>
      ),
    },
    {
      title: '상위 카테고리',
      dataIndex: 'parent',
      key: 'parent',
      width: 150,
      render: (parent: Category | undefined) => parent?.name || '-',
    },
    {
      title: '정렬순서',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (_: any, record: Category) => (
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
            description="하위 카테고리 및 제품이 있으면 삭제할 수 없습니다."
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

  // 계층 구조로 데이터 정렬
  const hierarchicalData: Category[] = [];
  mainCategories.forEach((main) => {
    hierarchicalData.push(main);
    const children = categories.filter((cat) => cat.parentId === main.id);
    children.forEach((child) => hierarchicalData.push(child));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-600">카테고리는 2단계 구조입니다 (대분류 → 소분류)</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          카테고리 추가
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={hierarchicalData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 50 }}
        />
      </Card>

      <Modal
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="카테고리명"
            name="name"
            rules={[{ required: true, message: '카테고리명을 입력하세요' }]}
          >
            <Input placeholder="예: 건강기능식품" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="상위 카테고리"
            name="parentId"
            extra="선택하지 않으면 대분류로 등록됩니다"
          >
            <Select placeholder="선택 (대분류인 경우 비워두세요)" allowClear>
              {mainCategories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="정렬순서"
            name="displayOrder"
            initialValue={0}
            rules={[{ required: true, message: '정렬순서를 입력하세요' }]}
          >
            <Input type="number" placeholder="0" min={0} />
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
