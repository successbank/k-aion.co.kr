'use client';

import { Typography } from 'antd';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import SalesStatsTab from '../components/SalesStatsTab';

const { Title } = Typography;

export default function SalesStatsPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>판매 통계</Title>
      </div>

      <SalesStatsTab />
    </DashboardLayout>
  );
}
