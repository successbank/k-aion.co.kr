'use client';

import { useState, useEffect } from 'react';
import { Tag, Space, Statistic, Row, Col, Divider } from 'antd';
import { UserOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import { MemberDetailResponse } from '@/services/members.service';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

// 등급별 테마 색상
const gradeThemes: Record<string, { primary: string; background: string }> = {
  ADMIN: { primary: '#f5222d', background: '#fff1f0' },
  CENTER: { primary: '#eb2f96', background: '#fff0f6' },
  DIVISION_CHIEF: { primary: '#fa8c16', background: '#fff7e6' },
  BRANCH_CHIEF: { primary: '#faad14', background: '#fffbe6' },
  MANAGER: { primary: '#52c41a', background: '#f6ffed' },
  AGENT: { primary: '#1890ff', background: '#e6f7ff' },
  MEMBER: { primary: '#8c8c8c', background: '#fafafa' },
};

interface ProfileHeaderProps {
  member: MemberDetailResponse;
}

export function ProfileHeader({ member }: ProfileHeaderProps) {
  const theme = gradeThemes[member.grade] || gradeThemes.MEMBER;

  return (
    <div
      style={{
        background: theme.background,
        padding: '24px',
        borderBottom: `3px solid ${theme.primary}`,
      }}
    >
      {/* 상단: 이름 및 등급 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: theme.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <UserOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{member.name}</h2>
          <Space style={{ marginTop: 8 }}>
            <Tag
              color={MemberGradeColors[member.grade as keyof typeof MemberGradeColors]}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {MemberGradeLabels[member.grade as keyof typeof MemberGradeLabels]}
            </Tag>
            {member.isActive ? (
              <Tag color="success">활성</Tag>
            ) : (
              <Tag color="default">비활성</Tag>
            )}
          </Space>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* 통계 정보 */}
      <Row gutter={24}>
        <Col span={8}>
          <Statistic
            title="누적 PV"
            value={member.cumulativePv}
            prefix={<TrophyOutlined style={{ color: theme.primary }} />}
            valueStyle={{ color: theme.primary }}
            formatter={(value) => `${Number(value).toLocaleString()}`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="가입일"
            value={new Date(member.createdAt).toLocaleDateString('ko-KR')}
            prefix={<CalendarOutlined style={{ color: theme.primary }} />}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>연락처</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{member.phone || '-'}</div>
        </Col>
      </Row>
    </div>
  );
}

export default ProfileHeader;
