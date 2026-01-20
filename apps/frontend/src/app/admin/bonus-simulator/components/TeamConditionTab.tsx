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
  GRADE_COLORS,
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

  // 팀별 통계 컬럼 정의 (신규 등급체계: 판매원, 팀장, 지사장)
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
        <Tooltip title="판매원 수 (구: 에이전트)">
          <span style={{ color: GRADE_COLORS.SALESPERSON }}>판매원 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'salespersonCount',
      key: 'salespersonCount',
      render: (count: number, record: any) => {
        // 레거시 호환: agentCount 필드도 확인
        const displayCount = count ?? record.agentCount ?? 0;
        return (
          <span style={{ color: displayCount > 0 ? GRADE_COLORS.SALESPERSON : '#999' }}>
            {displayCount}명
          </span>
        );
      },
    },
    {
      title: (
        <Tooltip title="팀장 수 (구: 매니저)">
          <span style={{ color: GRADE_COLORS.TEAM_LEADER }}>팀장 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'teamLeaderCount',
      key: 'teamLeaderCount',
      render: (count: number, record: any) => {
        // 레거시 호환: managerCount 필드도 확인
        const displayCount = count ?? record.managerCount ?? 0;
        return (
          <span style={{ color: displayCount > 0 ? GRADE_COLORS.TEAM_LEADER : '#999' }}>
            {displayCount}명
          </span>
        );
      },
    },
    {
      title: (
        <Tooltip title="지사장 수 (구: 지부장/본부장)">
          <span style={{ color: GRADE_COLORS.BRANCH_MANAGER }}>지사장 <InfoCircleOutlined /></span>
        </Tooltip>
      ),
      dataIndex: 'branchManagerCount',
      key: 'branchManagerCount',
      render: (count: number, record: any) => {
        // 레거시 호환: branchChiefCount + divisionChiefCount 필드도 확인
        const displayCount = count ?? ((record.branchChiefCount ?? 0) + (record.divisionChiefCount ?? 0));
        return (
          <span style={{ color: displayCount > 0 ? GRADE_COLORS.BRANCH_MANAGER : '#999' }}>
            {displayCount}명
          </span>
        );
      },
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

  // 레거시 호환 헬퍼 함수: 신규/레거시 필드 모두 지원
  const getTeamCount = (
    totals: typeof data.teamStats.totals,
    newField: string,
    legacyField: string,
    legacyField2?: string
  ) => {
    const totalsAny = totals as any;
    if (totalsAny[newField] !== undefined) {
      return totalsAny[newField];
    }
    const count1 = totalsAny[legacyField] ?? 0;
    const count2 = legacyField2 ? (totalsAny[legacyField2] ?? 0) : 0;
    return count1 + count2;
  };

  // 각 등급별 인원수 (레거시 호환)
  const salespersonCount = getTeamCount(data.teamStats.totals, 'salespersonCount', 'agentCount');
  const teamLeaderCount = getTeamCount(data.teamStats.totals, 'teamLeaderCount', 'managerCount');
  const branchManagerCount = getTeamCount(data.teamStats.totals, 'branchManagerCount', 'branchChiefCount', 'divisionChiefCount');

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
                    <span style={{ color: GRADE_COLORS.SALESPERSON }}>{salespersonCount}명</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <span style={{ color: GRADE_COLORS.TEAM_LEADER }}>{teamLeaderCount}명</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <span style={{ color: GRADE_COLORS.BRANCH_MANAGER }}>{branchManagerCount}명</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {data.teamStats.totals.totalCount}명
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>

          {/* 진행 상황 바 - 신규 등급체계 기준 */}
          <Card title="승급 목표 달성 현황" size="small" className="mt-4">
            <Alert
              message="승급 조건 안내"
              description="현재 한시적 조건 적용 중: 판매원 3명 → 팀장, 팀장 3명 → 지사장"
              type="info"
              showIcon
              style={{ marginBottom: 16, fontSize: 12 }}
            />
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span style={{ color: GRADE_COLORS.TEAM_LEADER }}>
                  <strong>팀장 승급</strong> (판매원 3명 소개)
                </span>
                <span>
                  {salespersonCount}/3명 (
                  {calculateProgress(salespersonCount, 3)}%)
                </span>
              </div>
              <Progress
                percent={calculateProgress(salespersonCount, 3)}
                strokeColor={GRADE_COLORS.SALESPERSON}
                showInfo={false}
              />
              <div className="text-xs text-gray-500 mt-1">
                정상 조건: 판매원 10명 소개
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span style={{ color: GRADE_COLORS.BRANCH_MANAGER }}>
                  <strong>지사장 승급</strong> (팀장 3명 육성)
                </span>
                <span>
                  {teamLeaderCount}/3명 (
                  {calculateProgress(teamLeaderCount, 3)}%)
                </span>
              </div>
              <Progress
                percent={calculateProgress(teamLeaderCount, 3)}
                strokeColor={GRADE_COLORS.TEAM_LEADER}
                showInfo={false}
              />
              <div className="text-xs text-gray-500 mt-1">
                정상 조건: 팀장 10명 육성
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span style={{ color: GRADE_COLORS.CENTER }}>
                  <strong>센터 개설</strong> (지사장 조건 + 시설)
                </span>
                <span>
                  {branchManagerCount}명 지사장
                </span>
              </div>
              <Progress
                percent={branchManagerCount > 0 ? 50 : 0}
                strokeColor={GRADE_COLORS.BRANCH_MANAGER}
                showInfo={false}
              />
              <div className="text-xs text-gray-500 mt-1">
                추가 조건: 사무실, 세미나실, 법인, TV 시설 구비
              </div>
            </div>
          </Card>
        </Col>

        {/* 자격 조건 체크리스트 - 신규 등급체계 */}
        <Col xs={24} lg={10}>
          <Card title="승급 자격 조건" size="small">
            <div className="mb-4">
              <div className="font-semibold mb-2" style={{ color: GRADE_COLORS.TEAM_LEADER }}>
                <Tag style={{ backgroundColor: GRADE_COLORS.TEAM_LEADER, borderColor: GRADE_COLORS.TEAM_LEADER, color: '#fff' }}>
                  팀장 승급
                </Tag>
              </div>
              {/* 신규 필드명 우선, 레거시 필드명 폴백 */}
              {((data.qualifications as any).teamLeaderPromotion || data.qualifications.managerCultivation) &&
                renderQualificationCard(
                  `${GRADE_LABELS.TEAM_LEADER} 승급 조건`,
                  (data.qualifications as any).teamLeaderPromotion || data.qualifications.managerCultivation,
                  GRADE_COLORS.TEAM_LEADER,
                )
              }
            </div>

            <div className="mb-4">
              <div className="font-semibold mb-2" style={{ color: GRADE_COLORS.BRANCH_MANAGER }}>
                <Tag style={{ backgroundColor: GRADE_COLORS.BRANCH_MANAGER, borderColor: GRADE_COLORS.BRANCH_MANAGER, color: '#fff' }}>
                  지사장 승급
                </Tag>
              </div>
              {/* 신규 필드명 우선, 레거시 필드명 폴백 */}
              {((data.qualifications as any).branchManagerPromotion || data.qualifications.branchChiefCultivation) &&
                renderQualificationCard(
                  `${GRADE_LABELS.BRANCH_MANAGER} 승급 조건`,
                  (data.qualifications as any).branchManagerPromotion || data.qualifications.branchChiefCultivation,
                  GRADE_COLORS.BRANCH_MANAGER,
                )
              }
            </div>

            {/* 센터 개설 조건 (있는 경우만 표시) */}
            {((data.qualifications as any).centerPromotion || data.qualifications.divisionChiefCultivation) && (
              <div>
                <div className="font-semibold mb-2" style={{ color: GRADE_COLORS.CENTER }}>
                  <Tag style={{ backgroundColor: GRADE_COLORS.CENTER, borderColor: GRADE_COLORS.CENTER, color: '#fff' }}>
                    센터 개설
                  </Tag>
                </div>
                {renderQualificationCard(
                  `${GRADE_LABELS.CENTER} 개설 조건`,
                  (data.qualifications as any).centerPromotion || data.qualifications.divisionChiefCultivation,
                  GRADE_COLORS.CENTER,
                )}
              </div>
            )}
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
                    <Tag style={{ backgroundColor: GRADE_COLORS[data.memberGrade], borderColor: GRADE_COLORS[data.memberGrade], color: '#fff' }}>
                      {GRADE_LABELS[data.memberGrade]}
                    </Tag>
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
