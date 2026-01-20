'use client';

import { Button, Typography, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="text-center">
        <Space direction="vertical" size="large" align="center">
          <RocketOutlined style={{ fontSize: 72, color: '#7CB342' }} />
          <Title level={1} style={{ color: '#7CB342' }}>
            케이아이온 통합관리시스템
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#757575' }}>
            회원관리, 제품관리, 수당관리를 통합한 관리 시스템
          </Paragraph>
          <Space>
            <Button type="primary" size="large" href="/login">
              로그인
            </Button>
            <Button size="large" href="/api" target="_blank">
              API 문서
            </Button>
          </Space>
        </Space>
      </div>
    </main>
  );
}
