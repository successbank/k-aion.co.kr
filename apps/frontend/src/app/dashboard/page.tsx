'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Progress,
  Button,
  Space,
  Spin,
  Tag,
  message,
  List,
  Empty,
} from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  DollarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  GiftOutlined,
  SettingOutlined,
  BarChartOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  profileService,
  MyProfile,
  MyPerformance,
  MyOrganization,
} from '@/services/profile.service';
import { useAuthStore } from '@/store/auth';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

const { Title, Text } = Typography;

// 승급 조건 정의
const promotionRequirements: Record<string, { next: string; requirement: string; count?: number }> =
  {
    MEMBER: { next: 'AGENT', requirement: '누적 PV 2,000,000 달성', count: 2000000 },
    AGENT: { next: 'MANAGER', requirement: '직속 AGENT 이상 15명 확보' },
    MANAGER: { next: 'BRANCH_CHIEF', requirement: '직속 MANAGER 이상 4명 확보' },
    BRANCH_CHIEF: { next: 'DIVISION_CHIEF', requirement: '직속 BRANCH_CHIEF 이상 5명 확보' },
    DIVISION_CHIEF: { next: 'CENTER', requirement: '직속 DIVISION_CHIEF 이상 5명 확보' },
    CENTER: { next: 'ADMIN', requirement: '관리자 지정 필요' },
    ADMIN: { next: '', requirement: '최고 등급' },
  };

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [performance, setPerformance] = useState<MyPerformance | null>(null);
  const [organization, setOrganization] = useState<MyOrganization | null>(null);

  // 데이터 조회
  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileData, performanceData, orgData] = await Promise.all([
        profileService.getMyProfile(),
        profileService.getMyPerformance(),
        profileService.getMyOrganization(1),
      ]);
      setProfile(profileData);
      setPerformance(performanceData);
      setOrganization(orgData);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 등급 표시
  const getGradeTag = (grade: string) => {
    const label = MemberGradeLabels[grade as keyof typeof MemberGradeLabels] || grade;
    const color = MemberGradeColors[grade as keyof typeof MemberGradeColors] || 'default';
    return <Tag color={color}>{label}</Tag>;
  };

  // 승급 진행률 계산
  const getPromotionProgress = () => {
    if (!profile || !organization) return { percent: 0, text: '' };

    const grade = profile.grade;
    const req = promotionRequirements[grade];

    if (!req || !req.next) {
      return { percent: 100, text: '최고 등급입니다' };
    }

    if (grade === 'MEMBER') {
      // PV 기반 승급
      const percent = Math.min(100, Math.round((profile.cumulativePv / 2000000) * 100));
      return {
        percent,
        text: `누적 PV: ${profile.cumulativePv.toLocaleString()} / 2,000,000`,
      };
    } else {
      // 하위 멤버 수 기반 승급 (간략화)
      const downlineCount = organization.sponsorTree.totalCount;
      return {
        percent: Math.min(100, downlineCount * 10),
        text: req.requirement,
      };
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const promotionProgress = getPromotionProgress();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 환영 메시지 */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              안녕하세요, {profile?.name}님! {getGradeTag(profile?.grade || '')}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>오늘도 좋은 하루 되세요</Text>
          </Col>
          <Col>
            <Button icon={<SettingOutlined />} onClick={() => router.push('/mypage')}>
              마이페이지
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 주요 통계 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="누적 PV"
              value={profile?.cumulativePv || 0}
              prefix={<RiseOutlined style={{ color: '#7CB342' }} />}
              valueStyle={{ color: '#7CB342' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="이번 달 판매"
              value={performance?.monthly.sales.totalAmount || 0}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
              suffix="원"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="이번 달 수당"
              value={performance?.monthly.bonuses.totalAmount || 0}
              prefix={<GiftOutlined style={{ color: '#eb2f96' }} />}
              suffix="원"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 승급 진행률 */}
      <Card
        title={
          <Space>
            <RiseOutlined />
            승급 진행률
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row align="middle" gutter={24}>
          <Col flex={1}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                현재 등급: {getGradeTag(profile?.grade || '')}
                {promotionRequirements[profile?.grade || '']?.next && (
                  <>
                    {' → '}
                    다음 등급: {getGradeTag(promotionRequirements[profile?.grade || '']?.next)}
                  </>
                )}
              </Text>
              <Progress
                percent={promotionProgress.percent}
                strokeColor={{
                  '0%': '#7CB342',
                  '100%': '#558B2F',
                }}
              />
              <Text type="secondary">{promotionProgress.text}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 내 조직 현황 */}
      <Card
        title={
          <Space>
            <TeamOutlined />내 조직 현황
          </Space>
        }
        extra={
          <Button type="link" onClick={() => router.push('/my-organization')}>
            자세히 보기
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        {organization && organization.sponsorTree.totalCount > 0 ? (
          <>
            <Row gutter={16}>
              {organization.sponsorTree.teamStats.map((team) => (
                <Col key={team.teamLine} xs={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Statistic title={`${team.teamLine}팀`} value={team.count} suffix="명" />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      PV: {team.totalPv.toLocaleString()}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Text>
                총 직속 회원: <Text strong>{organization.sponsorTree.totalCount}명</Text>
              </Text>
            </div>
          </>
        ) : (
          <Empty description="아직 하위 회원이 없습니다" />
        )}
      </Card>

      {/* 빠른 메뉴 */}
      <Card title="빠른 메뉴">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<UserOutlined />}
              onClick={() => router.push('/mypage')}
            >
              마이페이지
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => router.push('/my-performance')}
            >
              내 실적
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<ApartmentOutlined />}
              onClick={() => router.push('/my-organization')}
            >
              내 조직
            </Button>
          </Col>
          <Col xs={12} sm={6}>
            <Button
              block
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => router.push('/products')}
            >
              제품 보기
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 최근 활동 */}
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col xs={24} md={12}>
          <Card
            title="최근 판매"
            extra={
              <Button type="link" onClick={() => router.push('/my-performance')}>
                더보기
              </Button>
            }
          >
            {performance && performance.recentSales.length > 0 ? (
              <List
                size="small"
                dataSource={performance.recentSales.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.product.name}
                      description={new Date(item.saleDate).toLocaleDateString('ko-KR')}
                    />
                    <Text strong>{item.totalPrice.toLocaleString()}원</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="최근 판매 내역이 없습니다" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="최근 수당"
            extra={
              <Button type="link" onClick={() => router.push('/my-performance')}>
                더보기
              </Button>
            }
          >
            {performance && performance.recentBonuses.length > 0 ? (
              <List
                size="small"
                dataSource={performance.recentBonuses.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.type} description={item.period} />
                    <Text strong style={{ color: '#52c41a' }}>
                      +{item.amount.toLocaleString()}원
                    </Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="최근 수당 내역이 없습니다" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
