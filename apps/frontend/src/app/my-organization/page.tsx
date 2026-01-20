'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Tabs,
  Spin,
  message,
  Empty,
  Space,
  Button,
  Progress,
} from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { profileService, MyOrganization, OrganizationMember } from '@/services/profile.service';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

const { Title, Text } = Typography;

export default function MyOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<MyOrganization | null>(null);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const data = await profileService.getMyOrganization(3);
      setOrganization(data);
    } catch (error: any) {
      console.error('Failed to fetch organization:', error);
      message.error('조직 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  // 등급 태그
  const getGradeTag = (grade: string) => {
    const label = MemberGradeLabels[grade as keyof typeof MemberGradeLabels] || grade;
    const color = MemberGradeColors[grade as keyof typeof MemberGradeColors] || 'default';
    return <Tag color={color}>{label}</Tag>;
  };

  // 멤버 테이블 컬럼
  const memberColumns = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: OrganizationMember) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
          <Text type="secondary">@{record.username}</Text>
        </Space>
      ),
    },
    {
      title: '등급',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => getGradeTag(grade),
    },
    {
      title: '팀',
      dataIndex: 'teamLine',
      key: 'teamLine',
      render: (teamLine: number | undefined) => (teamLine ? <Tag>{teamLine}팀</Tag> : '-'),
    },
    {
      title: '누적 PV',
      dataIndex: 'cumulativePv',
      key: 'cumulativePv',
      align: 'right' as const,
      render: (pv: number) => pv.toLocaleString(),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 전체 등급별 통계
  const getTotalGradeStats = () => {
    if (!organization) return {};

    const stats: Record<string, number> = {
      ADMIN: 0,
      DIVISION_CHIEF: 0,
      BRANCH_CHIEF: 0,
      MANAGER: 0,
      AGENT: 0,
      MEMBER: 0,
    };

    organization.sponsorTree.teamStats.forEach((team) => {
      Object.keys(team.grades).forEach((grade) => {
        stats[grade] += team.grades[grade as keyof typeof team.grades];
      });
    });

    return stats;
  };

  const gradeStats = getTotalGradeStats();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/dashboard')}
        style={{ marginBottom: '16px' }}
      >
        대시보드로 돌아가기
      </Button>

      <Title level={2} style={{ marginBottom: '24px' }}>
        <ApartmentOutlined /> 내 조직
      </Title>

      {/* 조직 요약 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Text strong style={{ fontSize: '16px' }}>
                나의 정보
              </Text>
              <div style={{ textAlign: 'center' }}>
                <UserOutlined style={{ fontSize: '48px', color: '#7CB342' }} />
                <Title level={4} style={{ margin: '8px 0 4px' }}>
                  {organization?.member.name}
                </Title>
                <Text type="secondary">@{organization?.member.username}</Text>
                <div style={{ marginTop: '8px' }}>
                  {getGradeTag(organization?.member.grade || '')}
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={16}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="후원 계보 (직속)"
                  value={organization?.sponsorTree.totalCount || 0}
                  prefix={<TeamOutlined />}
                  suffix="명"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="추천 계보"
                  value={organization?.recommenderTree.totalCount || 0}
                  prefix={<UserOutlined />}
                  suffix="명"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="누적 PV"
                  value={organization?.member.cumulativePv || 0}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#7CB342' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 팀별 현황 */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            팀별 현황 (후원 계보)
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {organization?.sponsorTree.teamStats.map((team) => (
            <Col key={team.teamLine} xs={24} sm={8}>
              <Card size="small" title={`${team.teamLine}팀`}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Statistic
                    title="인원"
                    value={team.count}
                    suffix="명"
                    valueStyle={{ fontSize: '24px' }}
                  />
                  <Statistic
                    title="총 PV"
                    value={team.totalPv}
                    valueStyle={{ fontSize: '16px', color: '#7CB342' }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      등급 분포
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      {Object.entries(team.grades)
                        .filter(([, count]) => count > 0)
                        .map(([grade, count]) => (
                          <Tag key={grade} style={{ marginBottom: '4px' }}>
                            {MemberGradeLabels[grade as keyof typeof MemberGradeLabels]}: {count}
                          </Tag>
                        ))}
                      {Object.values(team.grades).every((count) => count === 0) && (
                        <Text type="secondary">-</Text>
                      )}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 등급별 통계 */}
      <Card title="전체 등급 분포" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {Object.entries(gradeStats)
            .filter(([, count]) => count > 0)
            .map(([grade, count]) => (
              <Col key={grade} xs={12} sm={8} md={4}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  {getGradeTag(grade)}
                  <div style={{ marginTop: '8px' }}>
                    <Text strong style={{ fontSize: '24px' }}>
                      {count}
                    </Text>
                    <Text type="secondary">명</Text>
                  </div>
                </Card>
              </Col>
            ))}
          {Object.values(gradeStats).every((count) => count === 0) && (
            <Col span={24}>
              <Empty description="하위 회원이 없습니다" />
            </Col>
          )}
        </Row>
      </Card>

      {/* 회원 목록 탭 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'sponsor',
              label: (
                <Space>
                  <TeamOutlined />
                  후원 계보 (직속 {organization?.sponsorTree.totalCount || 0}명)
                </Space>
              ),
              children: (
                <>
                  {organization?.sponsorTree.directDownline &&
                  organization.sponsorTree.directDownline.length > 0 ? (
                    <Table
                      columns={memberColumns}
                      dataSource={organization.sponsorTree.directDownline}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ) : (
                    <Empty description="직속 하위 회원이 없습니다" />
                  )}
                </>
              ),
            },
            {
              key: 'recommender',
              label: (
                <Space>
                  <UserOutlined />
                  추천 계보 ({organization?.recommenderTree.totalCount || 0}명)
                </Space>
              ),
              children: (
                <>
                  {organization?.recommenderTree.recommendees &&
                  organization.recommenderTree.recommendees.length > 0 ? (
                    <Table
                      columns={memberColumns.filter((col) => col.key !== 'teamLine')}
                      dataSource={organization.recommenderTree.recommendees}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ) : (
                    <Empty description="추천한 회원이 없습니다" />
                  )}
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
