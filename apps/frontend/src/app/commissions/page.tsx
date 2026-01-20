'use client';

import { useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function CommissionsPage() {
  const router = useRouter();

  useEffect(() => {
    // 3초 후 자동으로 새 보너스 페이지로 리다이렉트
    const timer = setTimeout(() => {
      router.push('/bonuses');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <DashboardLayout>
      <Title level={2}>수당 관리 (구)</Title>

      <Alert
        message="페이지 이동 안내"
        description={
          <div>
            <Paragraph>
              이 페이지는 더 이상 사용되지 않습니다.
            </Paragraph>
            <Paragraph>
              <strong>새로운 보너스 관리 페이지</strong>로 3초 후 자동 이동합니다.
            </Paragraph>
            <Paragraph>
              Commission PRD v2.0 기준에 따라 보너스 시스템이 재설계되었습니다.
            </Paragraph>
            <a onClick={() => router.push('/bonuses')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              즉시 이동하기 →
            </a>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginTop: 24 }}
      />
    </DashboardLayout>
  );
}
