'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Alert,
  Spin,
  Empty,
  Statistic,
  Table,
  Tooltip,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import {
  bonusSimulatorService,
  TeamQualificationResponse,
  QualificationCheck,
  GRADE_LABELS,
} from '@/services/bonus-simulator.service';

interface TeamConditionTabProps {
  memberId: number | null;
}

export default function TeamConditionTab({ memberId }: TeamConditionTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TeamQualificationResponse | null>(null);

  useEffect(() => {
    if (memberId) {
      fetchTeamQualification();
    } else {
      setData(null);
    }
  }, [memberId]);

  const fetchTeamQualification = async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      const result = await bonusSimulatorService.getTeamQualification(memberId);
      setData(result);
    } catch (error: any) {
      message.error('팀 자격 조건 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  if (!memberId) {
    return (
      <Alert
        type="info"
        message="회원을 먼저 선택해주세요"
        description="상단의 회원 검색에서 팀 조건을 분석할 회원을 선택하세요."
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <div className="mt-2">팀 조건 분석 중...</div>
      </div>
    );
  }

  if (!data) {
    return <Empty description="데이터를 불러올 수 없습니다" />;
  }

  const renderQualificationCard = (
    title: string,
    qualification: QualificationCheck,
    color: string,
  ) => {
    return (
      <Card size="small" className="mb-4" style={{ borderLeft: `4px solid ${color}` }}>
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <div style={{ fontWeight: 600, color }}>{title}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              필요 조건: {qualification.required}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              현재 상태: {qualification.current}
            </div>
            {qualification.details && (
              <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>
                {qualification.details}
              </div>
            )}
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            {qualification.qualified ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 14 }}>
                자격 충족
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 14 }}>
                자격 미달
              </Tag>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  const teamColumns = [
    {
      title: '팀',
      dataIndex: 'teamLine',
      key: 'teamLine',
      render: (teamLine: number) => (
        <Tag color={teamLine === 1 ? 'blue' : teamLine === 2 ? 'green' : 'orange'}>
          {teamLine}팀
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="에이전트 수">
          <span>에이전트 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'agentCount',
      key: 'agentCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#1890ff' : '#999' }}>{count}명</span>
      ),
    },
    {
      title: (
        <Tooltip title="매니저 수">
          <span>매니저 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'managerCount',
      key: 'managerCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#52c41a' : '#999' }}>{count}명</span>
      ),
    },
    {
      title: (
        <Tooltip title="지부장 수">
          <span>지부장 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'branchChiefCount',
      key: 'branchChiefCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#722ed1' : '#999' }}>{count}명</span>
      ),
    },
    {
      title: (
        <Tooltip title="본부장 수">
          <span>본부장 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'divisionChiefCount',
      key: 'divisionChiefCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#faad14' : '#999' }}>{count}명</span>
      ),
    },
    {
      title: '합계',
      dataIndex: 'totalCount',
      key: 'totalCount',
      render: (count: number) => <strong>{count}명</strong>,
    },
  ];

  // 팀별 진행 상황 계산
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div>
      <Alert
        type="info"
        message="팀 조건 분석"
        description="이 회원의 후원계보(SPONSOR) 기준 3팀 구성 현황과 판권 보너스 자격 조건을 분석합니다."
        showIcon
        className="mb-4"
      />

      <Row gutter={[16, 16]}>
        {/* 팀별 통계 */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                3팀별 등급 분포
              </Space>
            }
            size="small"
          >
            <Table
              columns={teamColumns}
              dataSource={data.teamStats.teams}
              pagination={false}
              rowKey="teamLine"
              size="small"
              summary={() => (
                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0}>합계</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {data.teamStats.totals.agentCount}명
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {data.teamStats.totals.managerCount}명
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {data.teamStats.totals.branchChiefCount}명
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {data.teamStats.totals.divisionChiefCount}명
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    {data.teamStats.totals.totalCount}명
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>

          {/* 진행 상황 바 */}
          <Card title="목표 달성 현황" size="small" className="mt-4">
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>매니저 육성 (에이전트 15명)</span>
                <span>
                  {data.teamStats.totals.agentCount}/15명 (
                  {calculateProgress(data.teamStats.totals.agentCount, 15)}%)
                </span>
              </div>
              <Progress
                percent={calculateProgress(data.teamStats.totals.agentCount, 15)}
                strokeColor="#1890ff"
                showInfo={false}
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>지부장 육성 (매니저 4명)</span>
                <span>
                  {data.teamStats.totals.managerCount}/4명 (
                  {calculateProgress(data.teamStats.totals.managerCount, 4)}%)
                </span>
              </div>
              <Progress
                percent={calculateProgress(data.teamStats.totals.managerCount, 4)}
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>본부장 육성 (지부장 5명)</span>
                <span>
                  {data.teamStats.totals.branchChiefCount}/5명 (
                  {calculateProgress(data.teamStats.totals.branchChiefCount, 5)}%)
                </span>
              </div>
              <Progress
                percent={calculateProgress(data.teamStats.totals.branchChiefCount, 5)}
                strokeColor="#722ed1"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>

        {/* 자격 조건 체크리스트 */}
        <Col xs={24} lg={10}>
          <Card title="판권 보너스 자격 조건" size="small">
            <div className="mb-4">
              <div className="font-semibold mb-2" style={{ color: '#1890ff' }}>
                <Tag color="blue">매니저 육성</Tag>
              </div>
              {renderQualificationCard(
                `${GRADE_LABELS.MANAGER} 육성 보너스`,
                data.qualifications.managerCultivation,
                '#1890ff',
              )}
            </div>

            <div className="mb-4">
              <div className="font-semibold mb-2" style={{ color: '#52c41a' }}>
                <Tag color="green">지부장 육성</Tag>
              </div>
              {renderQualificationCard(
                `${GRADE_LABELS.BRANCH_CHIEF} 육성 보너스`,
                data.qualifications.branchChiefCultivation,
                '#52c41a',
              )}
            </div>

            <div>
              <div className="font-semibold mb-2" style={{ color: '#722ed1' }}>
                <Tag color="purple">본부장 육성</Tag>
              </div>
              {renderQualificationCard(
                `${GRADE_LABELS.DIVISION_CHIEF} 육성 보너스`,
                data.qualifications.divisionChiefCultivation,
                '#722ed1',
              )}
            </div>
          </Card>

          {/* 회원 정보 카드 */}
          <Card title="분석 대상 회원" size="small" className="mt-4">
            <Row gutter={8}>
              <Col span={12}>
                <Statistic title="이름" value={data.memberName} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="등급"
                  valueRender={() => (
                    <Tag color="green">{GRADE_LABELS[data.memberGrade]}</Tag>
                  )}
                />
              </Col>
            </Row>
            {data.effectiveGrade !== data.memberGrade && (
              <Alert
                type="warning"
                message={`인정 등급: ${GRADE_LABELS[data.effectiveGrade]}`}
                description="이 회원은 인정매출로 인해 실제 등급보다 높은 유효 등급을 가집니다."
                showIcon
                className="mt-2"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Space 컴포넌트 추가
const Space = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{children}</span>
);
