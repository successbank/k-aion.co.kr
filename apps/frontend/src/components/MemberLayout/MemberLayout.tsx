'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth.service';
import { MemberGradeLabels } from '@/types/bonuses';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MemberLayoutProps {
  children: React.ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // 현재 선택된 메뉴 키 계산
  const getSelectedKey = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/mypage' || pathname.startsWith('/mypage/')) return 'mypage';
    if (pathname === '/my-performance') return 'my-performance';
    if (pathname === '/my-organization') return 'my-organization';
    if (pathname === '/products') return 'products';
    return 'dashboard';
  };

  // 로그아웃 처리
  const handleLogout = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  // 메뉴 아이템
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">대시보드</Link>,
    },
    {
      key: 'mypage',
      icon: <UserOutlined />,
      label: <Link href="/mypage">마이페이지</Link>,
    },
    {
      key: 'my-performance',
      icon: <BarChartOutlined />,
      label: <Link href="/my-performance">내 실적</Link>,
    },
    {
      key: 'my-organization',
      icon: <ApartmentOutlined />,
      label: <Link href="/my-organization">내 조직</Link>,
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: <Link href="/products">제품 보기</Link>,
    },
  ];

  // 사용자 드롭다운 메뉴
  const userMenuItems = [
    {
      key: 'mypage',
      icon: <UserOutlined />,
      label: '마이페이지',
      onClick: () => router.push('/mypage'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 사이드바 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* 로고 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Space>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              {!collapsed && (
                <Text strong style={{ color: '#7CB342', fontSize: 16 }}>
                  케이아이온
                </Text>
              )}
            </Space>
          </Link>
        </div>

        {/* 메뉴 */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout>
        {/* 헤더 */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#7CB342' }} />
              <Text>{user?.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({MemberGradeLabels[user?.grade as keyof typeof MemberGradeLabels] || user?.grade})
              </Text>
            </Space>
          </Dropdown>
        </Header>

        {/* 콘텐츠 */}
        <Content
          style={{
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
