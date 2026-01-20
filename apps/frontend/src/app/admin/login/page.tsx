'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/services/api';

const { Title, Text } = Typography;

// 관리자 등급 (CENTER, ADMIN만 허용)
const ADMIN_GRADES = ['ADMIN', 'CENTER'];

export default function AdminLoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { message } = App.useApp();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(values);

      // 등급 검증: CENTER, ADMIN만 허용
      if (!ADMIN_GRADES.includes(response.user.grade)) {
        message.error('관리자 계정만 로그인할 수 있습니다. 일반 회원은 /login을 이용해주세요.');
        setLoading(false);
        return;
      }

      // Zustand store 업데이트
      setAuth(
        {
          id: String(response.user.id),
          username: response.user.username,
          email: response.user.email,
          name: response.user.name,
          role: response.user.grade,
          grade: response.user.grade,
        },
        response.accessToken,
      );

      message.success(`${response.user.name}님, 환영합니다!`);
      router.push('/admin/dashboard');
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || '로그인에 실패했습니다');
      console.error('Admin login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CrownOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8 }}>
            관리자 로그인
          </Title>
          <Text type="secondary">케이아이온 통합관리시스템</Text>
        </div>

        <Form
          form={form}
          name="admin-login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '아이디를 입력해주세요' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#ffd700' }} />}
              placeholder="관리자 아이디"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#ffd700' }} />}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                border: 'none',
                color: '#1a1a2e',
              }}
            >
              관리자 로그인
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            일반 회원이신가요?{' '}
            <a href="/login" style={{ color: '#ffd700', fontWeight: 600 }}>
              회원 로그인
            </a>
          </Text>
        </div>
      </Card>
    </div>
  );
}
