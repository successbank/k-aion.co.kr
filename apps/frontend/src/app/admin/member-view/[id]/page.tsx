'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, Spin, message, Result, Typography } from 'antd';
import {
  HistoryOutlined,
  GiftOutlined,
  ApartmentOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { membersService, MemberDetailResponse } from '@/services/members.service';
import { useAuthStore } from '@/store/auth';
import ProfileHeader from '@/components/MemberMyPagePreview/ProfileHeader';
import ActivityHistoryTab from '@/components/MemberMyPagePreview/ActivityHistoryTab';
import BonusHistoryTab from '@/components/MemberMyPagePreview/BonusHistoryTab';
import MiniGenealogyTab from '@/components/MemberMyPagePreview/MiniGenealogyTab';
import RepurchaseTab from '@/components/MemberMyPagePreview/RepurchaseTab';
import PersonalInfoTab from '@/components/MemberMyPagePreview/PersonalInfoTab';

const { Title } = Typography;

// 관리 권한이 있는 등급
const ADMIN_GRADES = ['ADMIN', 'CENTER'];

export default function MemberViewPage() {
  const params = useParams();
  const memberId = params.id ? Number(params.id) : null;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [hasPermission, setHasPermission] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (user) {
      const isAdmin = ADMIN_GRADES.includes(user.grade);
      setHasPermission(isAdmin);
    }
  }, [user]);

  // 회원 정보 로드
  const loadMember = async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      const data = await membersService.getMember(memberId);
      setMember(data);
    } catch (error: any) {
      message.error(error.message || '회원 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId && hasPermission) {
      loadMember();
    } else if (user && !hasPermission) {
      setLoading(false);
    }
  }, [memberId, hasPermission, user]);

  // 회원 정보 수정 후 새로고침
  const handleMemberUpdate = () => {
    loadMember();
  };

  // 권한 없음
  if (!loading && !hasPermission) {
    return (
      <div style={{ padding: '48px 24px' }}>
        <Result
          status="403"
          icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
          title="접근 권한이 없습니다"
          subTitle="이 페이지는 관리자 전용입니다. 관리자 권한이 필요합니다."
        />
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 회원 정보 없음
  if (!member) {
    return (
      <div style={{ padding: '48px 24px' }}>
        <Result
          status="404"
          title="회원을 찾을 수 없습니다"
          subTitle="요청하신 회원 정보가 존재하지 않습니다."
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined />
          이력
        </span>
      ),
      children: <ActivityHistoryTab memberId={member.id} />,
    },
    {
      key: 'bonus',
      label: (
        <span>
          <GiftOutlined />
          보너스
        </span>
      ),
      children: <BonusHistoryTab memberId={member.id} />,
    },
    {
      key: 'genealogy',
      label: (
        <span>
          <ApartmentOutlined />
          계보도
        </span>
      ),
      children: <MiniGenealogyTab memberId={member.id} />,
    },
    {
      key: 'repurchase',
      label: (
        <span>
          <ShoppingCartOutlined />
          재구매
        </span>
      ),
      children: <RepurchaseTab memberId={member.id} memberName={member.name} />,
    },
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          내정보
        </span>
      ),
      children: <PersonalInfoTab member={member} onUpdate={handleMemberUpdate} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 페이지 타이틀 */}
      <Title level={3} style={{ marginBottom: 24 }}>
        <UserOutlined /> {member.name} 마이페이지
      </Title>

      {/* 프로필 헤더 */}
      <ProfileHeader member={member} />

      {/* 탭 메뉴 */}
      <div style={{ marginTop: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabBarStyle={{ marginBottom: 16 }}
        />
      </div>
    </div>
  );
}
