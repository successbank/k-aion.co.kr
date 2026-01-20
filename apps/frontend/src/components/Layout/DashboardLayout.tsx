'use client';

import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Input } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { menuByGrade, pageTitles, gradeLabels } from '@/config/menu.config';

const { Header, Sider, Content } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // 등급별 메뉴 가져오기 (기본값: MEMBER)
  const userGrade = user?.grade || 'MEMBER';
  const menuItems: MenuItem[] = menuByGrade[userGrade] || menuByGrade['MEMBER'];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '내 정보',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  // 현재 경로에 따른 페이지 타이틀 가져오기
  const getPageTitle = () => {
    return pageTitles[pathname] || '대시보드';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={80}
        style={{
          background: 'linear-gradient(180deg, #1a1f2e 0%, #252b3d 100%)',
          boxShadow: '2px 0 20px rgba(0, 0, 0, 0.15)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* 로고 영역 */}
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(124, 179, 66, 0.08)',
          }}
          onClick={() => router.push('/admin/dashboard')}
        >
          {collapsed ? (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 179, 66, 0.4)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>K</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124, 179, 66, 0.4)',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>K</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    lineHeight: 1.3,
                    letterSpacing: '-0.3px',
                  }}
                >
                  케이아이온
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: 500 }}>
                  Management System
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 사용자 프로필 미니카드 */}
        {!collapsed && (
          <div
            style={{
              margin: '20px 16px',
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={40}
                style={{
                  background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
                  boxShadow: '0 2px 8px rgba(124, 179, 66, 0.3)',
                }}
                icon={<UserOutlined />}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || '관리자'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12 }}>
                  {gradeLabels[userGrade] || '회원'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메뉴 - 스크롤 가능한 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => {
              if (!key.includes('-section')) {
                router.push(key);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 8px',
            }}
            theme="dark"
          />
        </div>

        {/* 하단 로그아웃 버튼 */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 10,
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.65)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(229, 57, 53, 0.15)';
              e.currentTarget.style.color = '#E53935';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
            }}
          >
            <LogoutOutlined style={{ fontSize: 18 }} />
            {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>로그아웃</span>}
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s ease' }}>
        {/* 헤더 */}
        <Header
          style={{
            background: '#fff',
            padding: '0 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 72,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* 사이드바 토글 버튼 */}
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#5f6368',
                transition: 'all 0.2s ease',
                background: '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e8e8e8';
                e.currentTarget.style.color = '#7CB342';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#5f6368';
              }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 18 }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 18 }} />
              )}
            </div>

            {/* 페이지 타이틀 */}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1f2e' }}>
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 검색 */}
            <Input
              placeholder="검색..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{
                width: 240,
                borderRadius: 10,
                background: '#f8f9fa',
                border: '1px solid #e8e8e8',
              }}
            />

            {/* 사용자 드롭다운 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px 6px 6px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: '#f8f9fa',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.borderColor = '#d9d9d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#e8e8e8';
                }}
              >
                <Avatar
                  size={32}
                  style={{
                    background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
                  }}
                  icon={<UserOutlined />}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>
                    {user?.name || '관리자'}
                  </span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {gradeLabels[userGrade] || '회원'}
                  </span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 컨텐츠 영역 */}
        <Content
          style={{
            margin: 24,
            padding: 28,
            background: '#fff',
            borderRadius: 16,
            minHeight: 'calc(100vh - 72px - 48px)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
