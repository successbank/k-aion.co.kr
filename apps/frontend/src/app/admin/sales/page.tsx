'use client';

import { useState } from 'react';
import { Tabs, Typography } from 'antd';
<<<<<<< Updated upstream
import { ShoppingOutlined, PlusOutlined, BarChartOutlined, TrophyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
=======
import { ShoppingOutlined, PlusOutlined, BarChartOutlined, CheckCircleOutlined } from '@ant-design/icons';
>>>>>>> Stashed changes
import DashboardLayout from '@/components/Layout/DashboardLayout';
import SalesListTab from './components/SalesListTab';
import CreateSaleTab from './components/CreateSaleTab';
import SalesStatsTab from './components/SalesStatsTab';
<<<<<<< Updated upstream
import RecognizedSalesTab from './components/RecognizedSalesTab';
=======
import RecognizedSaleTab from './components/RecognizedSaleTab';
>>>>>>> Stashed changes

const { Title } = Typography;

export default function AdminSalesPage() {
  const [activeTab, setActiveTab] = useState('list');

  const items = [
    {
      key: 'list',
      label: (
        <span>
          <ShoppingOutlined />
          판매 목록
        </span>
      ),
      children: <SalesListTab />,
    },
    {
      key: 'create',
      label: (
        <span>
          <PlusOutlined />
          판매 등록
        </span>
      ),
      children: <CreateSaleTab onSuccess={() => setActiveTab('list')} />,
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          판매 통계
        </span>
      ),
      children: <SalesStatsTab />,
    },
    {
<<<<<<< Updated upstream
      key: 'recognized-grade',
      label: (
        <span>
          <TrophyOutlined />
          인정매출
        </span>
      ),
      children: <RecognizedSalesTab recognitionType="GRADE" />,
    },
    {
      key: 'recognized-license',
      label: (
        <span>
          <SafetyCertificateOutlined />
          인정판권
        </span>
      ),
      children: <RecognizedSalesTab recognitionType="LICENSE" />,
=======
      key: 'recognized',
      label: (
        <span>
          <CheckCircleOutlined />
          인정매출
        </span>
      ),
      children: <RecognizedSaleTab onSuccess={() => setActiveTab('list')} />,
>>>>>>> Stashed changes
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>판매 관리</Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} size="large" />
    </DashboardLayout>
  );
}
