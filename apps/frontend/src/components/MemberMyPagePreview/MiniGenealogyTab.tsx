'use client';

import { useState, useEffect } from 'react';
import { Card, Tag, Spin, Empty, Segmented, Space, Typography, Divider } from 'antd';
import {
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons';
import {
  membersService,
  LimitedGenealogyResponse,
  LimitedGenealogyMember,
} from '@/services/members.service';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

const { Text } = Typography;

interface MiniGenealogyTabProps {
  memberId: number;
}

// 회원 카드 컴포넌트
const MemberCard = ({
  member,
  isTarget = false,
  direction,
}: {
  member: LimitedGenealogyMember;
  isTarget?: boolean;
  direction?: 'up' | 'down';
}) => {
  return (
    <Card
      size="small"
      style={{
        width: isTarget ? 200 : 160,
        border: isTarget ? '2px solid #E53935' : '1px solid #d9d9d9',
        background: isTarget ? '#f6ffed' : '#fff',
        textAlign: 'center',
      }}
      styles={{
        body: { padding: isTarget ? 16 : 12 },
      }}
    >
      {direction && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
          {direction === 'up' ? (
            <ArrowUpOutlined style={{ color: '#1890ff' }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#52c41a' }} />
          )}
        </div>
      )}
      {isTarget && (
        <StarFilled
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            color: '#faad14',
            fontSize: 20,
          }}
        />
      )}
      <div
        style={{
          width: isTarget ? 48 : 36,
          height: isTarget ? 48 : 36,
          borderRadius: '50%',
          background:
            MemberGradeColors[member.grade as keyof typeof MemberGradeColors] || '#8c8c8c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px',
        }}
      >
        <UserOutlined style={{ color: '#fff', fontSize: isTarget ? 24 : 18 }} />
      </div>
      <div style={{ fontWeight: isTarget ? 600 : 500, fontSize: isTarget ? 16 : 14 }}>
        {member.name}
      </div>
      <Tag
        color={MemberGradeColors[member.grade as keyof typeof MemberGradeColors]}
        style={{ marginTop: 4 }}
      >
        {MemberGradeLabels[member.grade as keyof typeof MemberGradeLabels]}
      </Tag>
      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
        PV: {member.cumulativePv.toLocaleString()}
      </div>
      {member.teamLine && (
        <div style={{ fontSize: 11, color: '#888' }}>{member.teamLine}팀</div>
      )}
    </Card>
  );
};

export function MiniGenealogyTab({ memberId }: MiniGenealogyTabProps) {
  const [loading, setLoading] = useState(false);
  const [treeType, setTreeType] = useState<'sponsor' | 'recommender'>('sponsor');
  const [genealogy, setGenealogy] = useState<LimitedGenealogyResponse | null>(null);

  const loadGenealogy = async () => {
    try {
      setLoading(true);
      const data = await membersService.getLimitedGenealogy(memberId, treeType);
      setGenealogy(data);
    } catch (error) {
      console.error('Failed to load genealogy:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenealogy();
  }, [memberId, treeType]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!genealogy) {
    return <Empty description="계보도 정보를 불러올 수 없습니다" />;
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 계보 유형 선택 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Segmented
          options={[
            { label: '후원계보', value: 'sponsor' },
            { label: '추천계보', value: 'recommender' },
          ]}
          value={treeType}
          onChange={(value) => setTreeType(value as 'sponsor' | 'recommender')}
        />
      </div>

      {/* 계보도 시각화 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: 16,
        }}
      >
        {/* 1단계 위 (상위 회원) */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            {treeType === 'sponsor' ? '후원인' : '추천인'} (1단계 위)
          </Text>
          {genealogy.upline ? (
            <MemberCard member={genealogy.upline} direction="up" />
          ) : (
            <Card
              size="small"
              style={{
                width: 160,
                textAlign: 'center',
                border: '1px dashed #d9d9d9',
                color: '#999',
              }}
            >
              <div style={{ padding: 16 }}>
                {treeType === 'sponsor' ? '후원인 없음' : '추천인 없음'}
              </div>
            </Card>
          )}
        </div>

        {/* 연결선 */}
        <div
          style={{
            width: 2,
            height: 24,
            background: '#d9d9d9',
          }}
        />

        {/* 대상 회원 (강조) */}
        <div style={{ position: 'relative' }}>
          <MemberCard member={genealogy.member} isTarget />
        </div>

        {/* 연결선 */}
        {genealogy.downline.length > 0 && (
          <div
            style={{
              width: 2,
              height: 24,
              background: '#d9d9d9',
            }}
          />
        )}

        {/* 1단계 아래 (하위 회원) */}
        {genealogy.downline.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
              직속 {treeType === 'sponsor' ? '후원' : '추천'} 회원 ({genealogy.downlineCount}명)
            </Text>
            <Space wrap style={{ justifyContent: 'center' }}>
              {genealogy.downline.slice(0, 6).map((member) => (
                <MemberCard key={member.id} member={member} direction="down" />
              ))}
            </Space>
            {genealogy.downlineCount > 6 && (
              <div style={{ marginTop: 8 }}>
                <Tag icon={<TeamOutlined />}>
                  외 {genealogy.downlineCount - 6}명
                </Tag>
              </div>
            )}
          </div>
        )}

        {genealogy.downline.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              직속 {treeType === 'sponsor' ? '후원' : '추천'} 회원 없음
            </Text>
          </div>
        )}
      </div>

      {/* 통계 */}
      <Divider />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          padding: '8px 0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{genealogy.downlineCount}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            직속 {treeType === 'sponsor' ? '후원' : '추천'} 회원
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            {genealogy.downline.reduce((sum, m) => sum + m.cumulativePv, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>직속 하위 총 PV</div>
        </div>
      </div>
    </div>
  );
}

export default MiniGenealogyTab;
