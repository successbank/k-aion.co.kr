'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth.service';
import type { ApiError } from '@/services/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { message } = App.useApp();

  // 최고관리자 등급 (CENTER, ADMIN은 /admin/login에서 로그인)
  const SUPER_ADMIN_GRADES = ['ADMIN', 'CENTER'];
  // 중간관리자 등급 (admin 대시보드 사용)
  const STAFF_GRADES = ['DIVISION_CHIEF', 'BRANCH_CHIEF', 'MANAGER'];

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(values);

      // 최고관리자는 /admin/login으로 유도
      if (SUPER_ADMIN_GRADES.includes(response.user.grade)) {
        message.warning('관리자 계정입니다. 관리자 로그인 페이지를 이용해주세요.');
        router.push('/admin/login');
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
          role: response.user.grade, // 호환성 유지
          grade: response.user.grade,
        },
        response.accessToken,
      );

      message.success(`${response.user.name}님, 환영합니다!`);

      // 등급별 대시보드로 리다이렉트
      if (STAFF_GRADES.includes(response.user.grade)) {
        router.push('/admin/dashboard'); // 중간관리자는 admin 대시보드
      } else {
        router.push('/dashboard'); // MEMBER, AGENT는 일반 대시보드
      }
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || '로그인에 실패했습니다');
      console.error('Login error:', error);
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
        background: 'linear-gradient(135deg, #e35d5b 0%, #a23b72 100%)',
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
              background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8 }}>
            케이아이온
          </Title>
          <Text type="secondary">통합관리시스템</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '아이디를 입력해주세요' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#E53935' }} />}
              placeholder="아이디 (예: admin, test)"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#E53935' }} />}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#E53935' }}>
                비밀번호를 잊으셨나요?
              </Link>
            </div>
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
                background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                border: 'none',
              }}
            >
              로그인
            </Button>
          </Form.Item>

          <Divider plain>
            <Text type="secondary" style={{ fontSize: 13 }}>
              또는
            </Text>
          </Divider>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              계정이 없으신가요?{' '}
              <Link href="/register" style={{ color: '#E53935', fontWeight: 600 }}>
                회원가입
              </Link>
            </Text>
          </div>
        </Form>

        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            센터/관리자이신가요?{' '}
            <a href="/admin/login" style={{ color: '#E53935', fontWeight: 600 }}>
              관리자 로그인
            </a>
          </Text>
        </div>
      </Card>
    </div>
  );
}
