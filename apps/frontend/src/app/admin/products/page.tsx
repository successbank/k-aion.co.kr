'use client';

import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { AppstoreOutlined, TagsOutlined, InboxOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import CategoriesTab from './components/CategoriesTab';
import ProductsTab from './components/ProductsTab';
import StockTab from './components/StockTab';

const { Title } = Typography;

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState('categories');

  const items = [
    {
      key: 'categories',
      label: (
        <span>
          <TagsOutlined />
          카테고리 관리
        </span>
      ),
      children: <CategoriesTab />,
    },
    {
      key: 'products',
      label: (
        <span>
          <AppstoreOutlined />
          제품 관리
        </span>
      ),
      children: <ProductsTab />,
    },
    {
      key: 'stock',
      label: (
        <span>
          <InboxOutlined />
          재고 관리
        </span>
      ),
      children: <StockTab />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>제품 및 재고 관리</Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} size="large" />
    </DashboardLayout>
  );
}
