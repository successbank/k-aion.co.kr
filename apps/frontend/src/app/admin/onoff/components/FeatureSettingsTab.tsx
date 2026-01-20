'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, Typography, message, Spin, Space, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, TrophyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
}

interface FormValues {
  recognizedGradeVisible: boolean;
  recognizedLicenseVisible: boolean;
}

export default function FeatureSettingsTab() {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<SystemConfig[]>('/v1/system-config', {
        params: { prefix: 'sales' },
      });

      const findValue = (key: string): string | undefined =>
        data.find((c) => c.key === key)?.value;

      form.setFieldsValue({
        recognizedGradeVisible: findValue('sales.recognizedGrade.visible') !== 'false',
        recognizedLicenseVisible: findValue('sales.recognizedLicense.visible') !== 'false',
      });
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      message.error('설정을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: FormValues) => {
    setSaving(true);
    try {
      await api.patch('/v1/system-config', {
        configs: [
          {
            key: 'sales.recognizedGrade.visible',
            value: String(values.recognizedGradeVisible),
            description: '인정매출 탭 표시 여부',
          },
          {
            key: 'sales.recognizedLicense.visible',
            value: String(values.recognizedLicenseVisible),
            description: '인정판권 탭 표시 여부',
          },
        ],
      });
      message.success('설정이 저장되었습니다');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      message.error('설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Spin spinning={loading}>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              recognizedGradeVisible: true,
              recognizedLicenseVisible: true,
            }}
          >
            <Title level={4} style={{ marginBottom: 16 }}>
              판매 관리 탭 설정
            </Title>

            <Form.Item
              name="recognizedGradeVisible"
              valuePropName="checked"
              label={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <Text strong>인정매출 탭</Text>
                </Space>
              }
              extra="판매 관리 페이지에서 '인정매출' 탭을 표시합니다."
            >
              <Switch
                checkedChildren="표시"
                unCheckedChildren="숨김"
              />
            </Form.Item>

            <Divider />

            <Form.Item
              name="recognizedLicenseVisible"
              valuePropName="checked"
              label={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                  <Text strong>인정판권 탭</Text>
                </Space>
              }
              extra="판매 관리 페이지에서 '인정판권' 탭을 표시합니다."
            >
              <Switch
                checkedChildren="표시"
                unCheckedChildren="숨김"
              />
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  style={{ backgroundColor: '#E53935', borderColor: '#E53935' }}
                >
                  저장
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadSettings}
                  disabled={loading}
                >
                  새로고침
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
}
