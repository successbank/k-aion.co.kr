'use client';

import { Modal, List, Tag, Typography, Empty, Spin } from 'antd';
import { UserOutlined, MailOutlined, TrophyOutlined } from '@ant-design/icons';
import type { SearchMemberResult } from '@/services/members.service';

const { Text } = Typography;

// 등급별 색상 매핑
const gradeColors: Record<string, string> = {
  ADMIN: '#ff4d4f',
  DIVISION_CHIEF: '#fa8c16',
  BRANCH_CHIEF: '#faad14',
  MANAGER: '#52c41a',
  AGENT: '#1890ff',
  MEMBER: '#8c8c8c',
};

const gradeLabels: Record<string, string> = {
  ADMIN: '최고관리자',
  DIVISION_CHIEF: '본부장',
  BRANCH_CHIEF: '지부장',
  MANAGER: '매니저',
  AGENT: '에이전트',
  MEMBER: '회원',
};

interface MemberSelectModalProps {
  open: boolean;
  searchQuery: string;
  members: SearchMemberResult[];
  loading?: boolean;
  onSelect: (member: SearchMemberResult) => void;
  onCancel: () => void;
}

export function MemberSelectModal({
  open,
  searchQuery,
  members,
  loading = false,
  onSelect,
  onCancel,
}: MemberSelectModalProps) {
  return (
    <Modal
      title={`"${searchQuery}" 검색 결과 (${members.length}명)`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : members.length === 0 ? (
        <Empty description="검색 결과가 없습니다" />
      ) : (
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item
              onClick={() => onSelect(member)}
              style={{
                cursor: 'pointer',
                padding: '16px',
                borderRadius: 8,
                marginBottom: 8,
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#7CB342';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#f0f0f0';
              }}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: gradeColors[member.grade] || '#8c8c8c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserOutlined style={{ color: '#fff', fontSize: 20 }} />
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={gradeColors[member.grade]}>
                      {gradeLabels[member.grade] || member.grade}
                    </Tag>
                    <Text strong style={{ fontSize: 16 }}>
                      {member.name}
                    </Text>
                    <Text type="secondary">({member.username})</Text>
                  </div>
                }
                description={
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 2 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <MailOutlined style={{ marginRight: 4 }} />
                        {member.email || '-'}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TrophyOutlined style={{ marginRight: 4 }} />
                        누적 PV: {member.cumulativePv?.toLocaleString() || 0}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}

export default MemberSelectModal;
