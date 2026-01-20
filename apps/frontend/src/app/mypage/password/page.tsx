'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth';

const { Title, Text, Paragraph } = Typography;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setLoading(true);
      await authService.changePassword(values);
      setSuccess(true);
      message.success('비밀번호가 변경되었습니다.');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      message.error(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndLogin = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  if (success) {
    return (
      <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircleOutlined
              style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }}
            />
            <Title level={3}>비밀번호 변경 완료</Title>
            <Paragraph type="secondary">
              비밀번호가 성공적으로 변경되었습니다.
              <br />
              보안을 위해 다시 로그인해 주세요.
            </Paragraph>
            <Space direction="vertical" size="middle" style={{ marginTop: '24px' }}>
              <Button type="primary" size="large" onClick={handleLogoutAndLogin}>
                로그인 페이지로 이동
              </Button>
              <Button type="link" onClick={() => router.push('/mypage')}>
                마이페이지로 돌아가기
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/mypage')}
        style={{ marginBottom: '16px' }}
      >
        마이페이지로 돌아가기
      </Button>

      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <LockOutlined /> 비밀번호 변경
        </Title>

        <Alert
          type="info"
          message="비밀번호 규칙"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>최소 6자 이상</li>
              <li>영문, 숫자, 특수문자(@$!%*#?&) 포함</li>
            </ul>
          }
          style={{ marginBottom: '24px' }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="currentPassword"
            label="현재 비밀번호"
            rules={[{ required: true, message: '현재 비밀번호를 입력해주세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="현재 비밀번호" size="large" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="새 비밀번호"
            rules={[
              { required: true, message: '새 비밀번호를 입력해주세요' },
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
                message: '영문, 숫자, 특수문자를 포함해야 합니다',
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="새 비밀번호" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="새 비밀번호 확인"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '새 비밀번호를 다시 입력해주세요' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="새 비밀번호 확인" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              비밀번호 변경
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
