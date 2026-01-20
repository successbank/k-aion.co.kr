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
} from 'antd';
import {
  ShoppingOutlined,
  GiftOutlined,
  RiseOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { profileService, MyPerformance } from '@/services/profile.service';
import { MemberGradeLabels } from '@/types/bonuses';

const { Title, Text } = Typography;

// 수당 유형 한글 라벨
const BonusTypeLabels: Record<string, string> = {
  DIRECT_SALE: '직접판매 수당',
  REFERRAL: '추천 수당',
  RANK: '직급 수당',
  LEADERSHIP: '리더십 수당',
  TEAM_BONUS: '팀 보너스',
  OTHER: '기타',
};

export default function MyPerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<MyPerformance | null>(null);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const data = await profileService.getMyPerformance();
      setPerformance(data);
    } catch (error: any) {
      console.error('Failed to fetch performance:', error);
      message.error('실적 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  // 판매 내역 테이블 컬럼
  const salesColumns = [
    {
      title: '날짜',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '제품',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: '판매금액',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right' as const,
      render: (price: number) => `${price.toLocaleString()}원`,
    },
    {
      title: 'PV',
      dataIndex: 'totalPv',
      key: 'totalPv',
      align: 'right' as const,
      render: (pv: number) => pv.toLocaleString(),
    },
  ];

  // 수당 내역 테이블 컬럼
  const bonusColumns = [
    {
      title: '정산월',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{BonusTypeLabels[type] || type}</Tag>,
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>+{amount.toLocaleString()}원</Text>
      ),
    },
    {
      title: '생성일',
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
        <RiseOutlined /> 내 실적
      </Title>

      {/* 이번 달 요약 */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            이번 달 실적 ({performance?.monthly.period})
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f0f5ff' }}>
              <Statistic
                title="총 판매금액"
                value={performance?.monthly.sales.totalAmount || 0}
                prefix={<ShoppingOutlined />}
                suffix="원"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <Statistic
                title="총 판매 PV"
                value={performance?.monthly.sales.totalPv || 0}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#fff0f6' }}>
              <Statistic
                title="총 수당"
                value={performance?.monthly.bonuses.totalAmount || 0}
                prefix={<GiftOutlined />}
                suffix="원"
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 수당 유형별 현황 */}
        {performance?.monthly.bonuses.byType && performance.monthly.bonuses.byType.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Text strong style={{ display: 'block', marginBottom: '12px' }}>
              수당 유형별 현황
            </Text>
            <Row gutter={[12, 12]}>
              {performance.monthly.bonuses.byType.map((item) => (
                <Col key={item.type} xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={BonusTypeLabels[item.type] || item.type}
                      value={item.amount}
                      suffix="원"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Card>

      {/* 누적 실적 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24} align="middle">
          <Col xs={24} sm={12}>
            <Statistic
              title="누적 PV"
              value={performance?.member.cumulativePv || 0}
              prefix={<RiseOutlined style={{ color: '#E53935' }} />}
              valueStyle={{ color: '#E53935', fontSize: '28px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical">
              <Text strong>현재 등급</Text>
              <Tag color="green" style={{ fontSize: '16px', padding: '4px 12px' }}>
                {MemberGradeLabels[performance?.member.grade as keyof typeof MemberGradeLabels] ||
                  performance?.member.grade}
              </Tag>
              {performance?.member.agentPromotedAt && (
                <Text type="secondary">
                  AGENT 승급일:{' '}
                  {new Date(performance.member.agentPromotedAt).toLocaleDateString('ko-KR')}
                </Text>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 상세 내역 탭 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'sales',
              label: (
                <Space>
                  <ShoppingOutlined />
                  판매 내역
                </Space>
              ),
              children: (
                <>
                  {performance?.recentSales && performance.recentSales.length > 0 ? (
                    <Table
                      columns={salesColumns}
                      dataSource={performance.recentSales}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ) : (
                    <Empty description="판매 내역이 없습니다" />
                  )}
                </>
              ),
            },
            {
              key: 'bonuses',
              label: (
                <Space>
                  <GiftOutlined />
                  수당 내역
                </Space>
              ),
              children: (
                <>
                  {performance?.recentBonuses && performance.recentBonuses.length > 0 ? (
                    <Table
                      columns={bonusColumns}
                      dataSource={performance.recentBonuses}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  ) : (
                    <Empty description="수당 내역이 없습니다" />
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
