'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, Typography, Spin } from 'antd';
import { ShoppingOutlined, PlusOutlined, BarChartOutlined, TrophyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import SalesListTab from './components/SalesListTab';
import CreateSaleTab from './components/CreateSaleTab';
import SalesStatsTab from './components/SalesStatsTab';
import RecognizedSalesTab from './components/RecognizedSalesTab';
import { api } from '@/lib/api';

const { Title } = Typography;

interface SystemConfig {
  id: number;
  key: string;
  value: string;
}

interface TabSettings {
  recognizedGradeVisible: boolean;
  recognizedLicenseVisible: boolean;
}

export default function AdminSalesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [tabSettings, setTabSettings] = useState<TabSettings>({
    recognizedGradeVisible: true,
    recognizedLicenseVisible: true,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadTabSettings();
  }, []);

  const loadTabSettings = async () => {
    try {
      const { data } = await api.get<SystemConfig[]>('/v1/system-config', {
        params: { prefix: 'sales' },
      });

      const findValue = (key: string): string | undefined =>
        data.find((c) => c.key === key)?.value;

      setTabSettings({
        recognizedGradeVisible: findValue('sales.recognizedGrade.visible') !== 'false',
        recognizedLicenseVisible: findValue('sales.recognizedLicense.visible') !== 'false',
      });
    } catch (error) {
      console.error('Failed to load tab settings:', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const items = useMemo(() => {
    const baseItems = [
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
    ];

    if (tabSettings.recognizedGradeVisible) {
      baseItems.push({
        key: 'recognized-grade',
        label: (
          <span>
            <TrophyOutlined />
            인정매출
          </span>
        ),
        children: <RecognizedSalesTab recognitionType="GRADE" />,
      });
    }

    if (tabSettings.recognizedLicenseVisible) {
      baseItems.push({
        key: 'recognized-license',
        label: (
          <span>
            <SafetyCertificateOutlined />
            인정판권
          </span>
        ),
        children: <RecognizedSalesTab recognitionType="LICENSE" />,
      });
    }

    return baseItems;
  }, [tabSettings]);

  if (!settingsLoaded) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>판매 관리</Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} size="large" />
    </DashboardLayout>
  );
}
