'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Select,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requirePasswordChange: boolean;
  commissionAutoCalculate: boolean;
  commissionApprovalRequired: boolean;
}

export default function SystemSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialValues: SystemSettings = {
    siteName: '케이아이온 통합관리시스템',
    siteDescription: '회원관리, 제품관리, 수당계산을 위한 통합 시스템',
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: 'MEMBER',
    emailNotifications: true,
    smsNotifications: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requirePasswordChange: false,
    commissionAutoCalculate: true,
    commissionApprovalRequired: true,
  };

  const handleSave = async (values: SystemSettings) => {
    try {
      setLoading(true);
      // TODO: API 연동
      // await api.put('/admin/settings', values);

      console.log('Settings saved:', values);
      message.success('시스템 설정이 저장되었습니다');
    } catch (error) {
      console.error('Failed to save settings:', error);
      message.error('설정 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('설정이 초기값으로 되돌려졌습니다');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>시스템 설정</Title>
      </div>

      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleSave}>
        <Row gutter={16}>
          {/* 기본 설정 */}
          <Col xs={24} lg={12}>
            <Card title="기본 설정" className="mb-4">
              <Form.Item label="사이트 이름" name="siteName" rules={[{ required: true }]}>
                <Input placeholder="사이트 이름을 입력하세요" />
              </Form.Item>

              <Form.Item label="사이트 설명" name="siteDescription">
                <Input.TextArea rows={3} placeholder="사이트 설명을 입력하세요" />
              </Form.Item>

              <Form.Item label="유지보수 모드" name="maintenanceMode" valuePropName="checked">
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
              <Text type="secondary" className="text-xs">
                유지보수 모드 시 일반 사용자 접근이 제한됩니다
              </Text>

              <Divider />

              <Form.Item label="신규 가입 허용" name="allowRegistration" valuePropName="checked">
                <Switch checkedChildren="허용" unCheckedChildren="차단" />
              </Form.Item>

              <Form.Item label="기본 회원 등급" name="defaultUserRole">
                <Select>
                  <Option value="MEMBER">회원</Option>
                  <Option value="MANAGER">매니저</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* 보안 설정 */}
          <Col xs={24} lg={12}>
            <Card title="보안 설정" className="mb-4">
              <Form.Item
                label="세션 타임아웃 (분)"
                name="sessionTimeout"
                rules={[{ required: true, type: 'number', min: 5, max: 1440 }]}
              >
                <InputNumber min={5} max={1440} className="w-full" />
              </Form.Item>

              <Form.Item
                label="최대 로그인 시도 횟수"
                name="maxLoginAttempts"
                rules={[{ required: true, type: 'number', min: 3, max: 10 }]}
              >
                <InputNumber min={3} max={10} className="w-full" />
              </Form.Item>

              <Form.Item
                label="비밀번호 최소 길이"
                name="passwordMinLength"
                rules={[{ required: true, type: 'number', min: 6, max: 20 }]}
              >
                <InputNumber min={6} max={20} className="w-full" />
              </Form.Item>

              <Form.Item label="정기 비밀번호 변경 요구" name="requirePasswordChange" valuePropName="checked">
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
              <Text type="secondary" className="text-xs">
                90일마다 비밀번호 변경을 요구합니다
              </Text>
            </Card>
          </Col>

          {/* 알림 설정 */}
          <Col xs={24} lg={12}>
            <Card title="알림 설정" className="mb-4">
              <Form.Item label="이메일 알림" name="emailNotifications" valuePropName="checked">
                <Switch checkedChildren="사용" unCheckedChildren="미사용" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                중요 이벤트 발생 시 관리자에게 이메일을 발송합니다
              </Text>

              <Form.Item label="SMS 알림" name="smsNotifications" valuePropName="checked">
                <Switch checkedChildren="사용" unCheckedChildren="미사용" />
              </Form.Item>
              <Text type="secondary" className="text-xs">
                긴급 상황 발생 시 SMS를 발송합니다
              </Text>
            </Card>
          </Col>

          {/* 수당 설정 */}
          <Col xs={24} lg={12}>
            <Card title="수당 계산 설정" className="mb-4">
              <Form.Item label="자동 수당 계산" name="commissionAutoCalculate" valuePropName="checked">
                <Switch checkedChildren="자동" unCheckedChildren="수동" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                판매 발생 시 자동으로 수당을 계산합니다
              </Text>

              <Form.Item label="수당 승인 필요" name="commissionApprovalRequired" valuePropName="checked">
                <Switch checkedChildren="필요" unCheckedChildren="불필요" />
              </Form.Item>
              <Text type="secondary" className="text-xs">
                수당 지급 전 관리자 승인이 필요합니다
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 버튼 */}
        <Card>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large">
              설정 저장
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
              초기화
            </Button>
          </Space>
        </Card>
      </Form>
    </DashboardLayout>
  );
}
