'use client';

import { Tabs, Typography } from 'antd';
import { SettingOutlined, HistoryOutlined, CloudServerOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import FeatureSettingsTab from './components/FeatureSettingsTab';
import ActivityLogsTab from './components/ActivityLogsTab';
import BackupManagementTab from './components/BackupManagementTab';

const { Title, Paragraph } = Typography;

export default function SystemManagementPage() {
  return (
    <DashboardLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 12 }} />
          시스템 관리
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          시스템 설정, 활동 로그, 백업/복구를 관리합니다.
        </Paragraph>
      </div>

      <Tabs
        defaultActiveKey="settings"
        size="large"
        items={[
          {
            key: 'settings',
            label: <span><SettingOutlined /> 기능 설정</span>,
            children: <FeatureSettingsTab />,
          },
          {
            key: 'logs',
            label: <span><HistoryOutlined /> 활동 로그</span>,
            children: <ActivityLogsTab />,
          },
          {
            key: 'backup',
            label: <span><CloudServerOutlined /> 백업/복구</span>,
            children: <BackupManagementTab />,
          },
        ]}
      />
    </DashboardLayout>
  );
}
