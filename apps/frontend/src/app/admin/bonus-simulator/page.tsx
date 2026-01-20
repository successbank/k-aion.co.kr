'use client';

import { useState, useRef } from 'react';
import {
  Card,
  Tabs,
  Select,
  Spin,
  Typography,
  message,
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  UserOutlined,
  CalculatorOutlined,
  TeamOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { api } from '@/lib/api';
import SaleSimulationTab from './components/SaleSimulationTab';
import TeamConditionTab from './components/TeamConditionTab';
import CommissionRateCompareTab from './components/CommissionRateCompareTab';

const { Title, Text } = Typography;
const { Option } = Select;

interface Member {
  id: number;
  username: string;
  name: string;
  email: string | null;
  grade: string;
  isActive: boolean;
  cumulativePv: number;
}

// 등급 라벨 (신규 등급체계 + 레거시 호환)
const gradeLabels: Record<string, string> = {
  // 신규 등급체계
  SALESPERSON: '판매원',
  TEAM_LEADER: '팀장',
  BRANCH_MANAGER: '지사장',
  CENTER: '센터',
  ADMIN: '관리자',
  // 레거시 호환
  MEMBER: '회원',
  AGENT: '에이전트',
  MANAGER: '매니저',
  BRANCH_CHIEF: '지부장',
  DIVISION_CHIEF: '본부장',
};

// 등급 색상 (신규 등급체계 + 레거시 호환)
const gradeColors: Record<string, string> = {
  // 신규 등급체계
  SALESPERSON: 'green',
  TEAM_LEADER: 'blue',
  BRANCH_MANAGER: 'purple',
  CENTER: 'orange',
  ADMIN: 'red',
  // 레거시 호환
  MEMBER: 'default',
  AGENT: 'blue',
  MANAGER: 'green',
  BRANCH_CHIEF: 'purple',
  DIVISION_CHIEF: 'gold',
};

export default function BonusSimulatorPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [effectiveGrade, setEffectiveGrade] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchMembers = async (searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.length < 1) {
      setMembers([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setMemberSearchLoading(true);
        const { data } = await api.get('/v1/members/search', {
          params: { q: searchValue, limit: 20, isActive: true },
        });
        setMembers(data.data);
      } catch (error: any) {
        message.error('회원 검색 실패');
        setMembers([]);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 300);
  };

  const handleMemberChange = async (memberId: number) => {
    if (!memberId) {
      setSelectedMember(null);
      setEffectiveGrade(null);
      return;
    }

    const cachedMember = members.find((m) => m.id === memberId);
    if (cachedMember) {
      setSelectedMember(cachedMember);
    } else {
      try {
        const { data } = await api.get<Member>(`/v1/members/${memberId}`);
        setSelectedMember(data);
      } catch (error: any) {
        message.error('회원 정보 조회 실패');
        setSelectedMember(null);
      }
    }

    // 유효 등급 조회
    try {
      const { data } = await api.get(`/v1/compensation-plan/members/${memberId}/team-qualification`);
      setEffectiveGrade(data.effectiveGrade);
    } catch (error) {
      console.error('Failed to get effective grade');
    }
  };

  const tabItems = [
    {
      key: 'simulation',
      label: (
        <span>
          <CalculatorOutlined />
          판매 시뮬레이션
        </span>
      ),
      children: <SaleSimulationTab selectedMember={selectedMember} />,
    },
    {
      key: 'team',
      label: (
        <span>
          <TeamOutlined />
          팀 조건 분석
        </span>
      ),
      children: <TeamConditionTab memberId={selectedMember?.id || null} />,
    },
    {
      key: 'rates',
      label: (
        <span>
          <PercentageOutlined />
          수당률 비교
        </span>
      ),
      children: <CommissionRateCompareTab />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Title level={2}>실시간 보너스 계산</Title>
        <Text type="secondary">
          회원을 선택하여 가상 판매 시뮬레이션을 통해 예상 수당을 미리 확인하세요.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* 회원 검색 패널 */}
        <Col xs={24} lg={8}>
          <Card title={<><UserOutlined /> 회원 선택</>} size="small">
            <Select
              showSearch
              placeholder="회원 이름 또는 ID로 검색"
              className="w-full"
              filterOption={false}
              onSearch={searchMembers}
              onChange={handleMemberChange}
              loading={memberSearchLoading}
              notFoundContent={
                memberSearchLoading ? <Spin size="small" /> : '검색 결과가 없습니다'
              }
              allowClear
              value={selectedMember?.id}
            >
              {members.map((member) => (
                <Option key={member.id} value={member.id}>
                  <div className="flex justify-between items-center">
                    <span>
                      {member.name} ({member.username})
                    </span>
                    <Tag color={gradeColors[member.grade]} style={{ marginLeft: 8 }}>
                      {gradeLabels[member.grade]}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Card>
        </Col>

        {/* 회원 정보 요약 카드 */}
        <Col xs={24} lg={16}>
          <Card title="회원 정보 요약" size="small">
            {selectedMember ? (
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="이름" value={selectedMember.name} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="실제 등급"
                    valueRender={() => (
                      <Tag color={gradeColors[selectedMember.grade]} style={{ fontSize: 14 }}>
                        {gradeLabels[selectedMember.grade]}
                      </Tag>
                    )}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="유효 등급"
                    valueRender={() =>
                      effectiveGrade ? (
                        <Tag
                          color={
                            effectiveGrade !== selectedMember.grade
                              ? 'orange'
                              : gradeColors[effectiveGrade]
                          }
                          style={{ fontSize: 14 }}
                        >
                          {gradeLabels[effectiveGrade]}
                          {effectiveGrade !== selectedMember.grade && ' (인정)'}
                        </Tag>
                      ) : (
                        '-'
                      )
                    }
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="누적 PV"
                    value={selectedMember.cumulativePv}
                    suffix="PV"
                    formatter={(value) => value?.toLocaleString()}
                  />
                </Col>
              </Row>
            ) : (
              <div className="text-center py-4 text-gray-400">
                회원을 선택하면 정보가 표시됩니다
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 탭 영역 */}
      <Card className="mt-4">
        <Tabs items={tabItems} defaultActiveKey="simulation" />
      </Card>
    </DashboardLayout>
  );
}
