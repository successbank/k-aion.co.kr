'use client';

import { useState, useEffect } from 'react';
import { Drawer, Tabs, Spin, message } from 'antd';
import {
  HistoryOutlined,
  GiftOutlined,
  ApartmentOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { membersService, MemberDetailResponse } from '@/services/members.service';
import ProfileHeader from './ProfileHeader';
import ActivityHistoryTab from './ActivityHistoryTab';
import BonusHistoryTab from './BonusHistoryTab';
import MiniGenealogyTab from './MiniGenealogyTab';
import RepurchaseTab from './RepurchaseTab';
import PersonalInfoTab from './PersonalInfoTab';

interface MemberMyPagePreviewDrawerProps {
  visible: boolean;
  memberId: number | null;
  onClose: () => void;
  onMemberUpdate?: () => void;
}

export function MemberMyPagePreviewDrawer({
  visible,
  memberId,
  onClose,
  onMemberUpdate,
}: MemberMyPagePreviewDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<MemberDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState('activity');

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
    if (visible && memberId) {
      loadMember();
      setActiveTab('activity'); // 탭 초기화
    }
  }, [visible, memberId]);

  // 회원 정보 수정 후 새로고침
  const handleMemberUpdate = () => {
    loadMember();
    onMemberUpdate?.();
  };

  const tabItems = [
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined />
          이력
        </span>
      ),
      children: member ? <ActivityHistoryTab memberId={member.id} /> : null,
    },
    {
      key: 'bonus',
      label: (
        <span>
          <GiftOutlined />
          보너스
        </span>
      ),
      children: member ? <BonusHistoryTab memberId={member.id} /> : null,
    },
    {
      key: 'genealogy',
      label: (
        <span>
          <ApartmentOutlined />
          계보도
        </span>
      ),
      children: member ? <MiniGenealogyTab memberId={member.id} /> : null,
    },
    {
      key: 'repurchase',
      label: (
        <span>
          <ShoppingCartOutlined />
          재구매
        </span>
      ),
      children: member ? <RepurchaseTab memberId={member.id} memberName={member.name} /> : null,
    },
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          내정보
        </span>
      ),
      children: member ? (
        <PersonalInfoTab member={member} onUpdate={handleMemberUpdate} />
      ) : null,
    },
  ];

  return (
    <Drawer
      title={member ? `${member.name} 마이페이지` : '마이페이지 프리뷰'}
      placement="right"
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
      styles={{
        body: { padding: 0 },
      }}
    >
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : member ? (
        <div>
          {/* 프로필 헤더 */}
          <ProfileHeader member={member} />

          {/* 탭 메뉴 */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ padding: '0 16px' }}
            tabBarStyle={{ marginBottom: 16 }}
          />
        </div>
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
          회원 정보를 찾을 수 없습니다.
        </div>
      )}
    </Drawer>
  );
}

export default MemberMyPagePreviewDrawer;
