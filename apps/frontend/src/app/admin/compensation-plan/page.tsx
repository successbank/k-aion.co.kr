'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tabs,
  Table,
  Tag,
  Statistic,
  Collapse,
  Space,
  Alert,
  Divider,
  Timeline,
  Image,
  Spin,
  message,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CrownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import compensationPlanService, {
  type CompensationOverviewDto,
} from '@/services/compensation-plan.service';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export default function CompensationPlanPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CompensationOverviewDto | null>(
    null
  );

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await compensationPlanService.getOverview();
      setOverview(data);
    } catch (error: any) {
      console.error('보상플랜 개요 조회 실패:', error);
      message.error(
        error.response?.data?.message || '보상플랜 정보를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            tip="보상플랜 정보를 불러오는 중..."
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!overview) {
    return (
      <DashboardLayout>
        <Alert
          message="데이터 없음"
          description="보상플랜 정보를 불러올 수 없습니다."
          type="error"
          showIcon
        />
      </DashboardLayout>
    );
  }

  // 보너스 유형 테이블 컬럼
  const bonusColumns = [
    {
      title: '보너스 유형',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <DollarOutlined style={{ color: '#E53935', fontSize: 20 }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '지급 금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => (
        <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
          {amount}
        </Tag>
      ),
    },
    {
      title: '지급 조건',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  // 등급 체계 데이터 변환
  const gradeData = overview.gradeSystem.map((grade, index) => ({
    key: String(index + 1),
    grade: grade.name,
    icon: getGradeIcon(grade.grade),
    condition: grade.requirements,
    color: getGradeColor(grade.grade),
    benefits: grade.benefits,
  }));

  function getGradeIcon(grade: string): string {
    const icons: Record<string, string> = {
      MEMBER: '👤',
      AGENT: '⭐',
      MANAGER: '💼',
      BRANCH_CHIEF: '👑',
      DIVISION_CHIEF: '🏆',
    };
    return icons[grade] || '👤';
  }

  function getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      MEMBER: '#faad14',
      AGENT: '#52c41a',
      MANAGER: '#1890ff',
      BRANCH_CHIEF: '#722ed1',
      DIVISION_CHIEF: '#eb2f96',
    };
    return colors[grade] || '#faad14';
  }

  // ========== 탭 1: 개요 ==========
  const renderOverview = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <Title level={3}>
            <TrophyOutlined /> 보상플랜 개요
          </Title>
          <Paragraph>
            케이아이온 보상플랜은 <strong>6가지 보너스 유형</strong>과{' '}
            <strong>5단계 등급 체계</strong>로 구성됩니다.
            <br />
            매주 일요일~월요일에 정산이 마감되며, <strong>다음 주 수요일</strong>
            에 보너스가 지급됩니다.
          </Paragraph>
        </Card>
      </Col>

      <Col span={24}>
        <Card title="💰 보너스 유형 (6가지)">
          <Table
            dataSource={overview.bonusTypes}
            columns={bonusColumns}
            pagination={false}
            rowKey="type"
          />
        </Card>
      </Col>

      <Col span={24}>
        <Card title="📅 정산 스케줄">
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <>
                    <strong>매주 일요일~월요일:</strong> 정산 마감
                  </>
                ),
              },
              {
                color: 'orange',
                children: (
                  <>
                    <strong>화요일:</strong> 정산 검증 및 승인
                  </>
                ),
              },
              {
                color: 'green',
                dot: <CheckCircleOutlined />,
                children: (
                  <>
                    <strong>수요일:</strong> 보너스 지급
                  </>
                ),
              },
            ]}
          />
          <Alert
            message={overview.settlementSchedule.description}
            type="info"
            showIcon
            icon={<CalendarOutlined />}
            style={{ marginTop: 16 }}
          />
        </Card>
      </Col>
    </Row>
  );

  // ========== 탭 2: 등급 체계 ==========
  const renderGradeSystem = () => (
    <Row gutter={[16, 16]}>
      {gradeData.map((grade) => (
        <Col xs={24} sm={12} lg={8} key={grade.key}>
          <Card
            hoverable
            style={{
              borderLeft: `4px solid ${grade.color}`,
              height: '100%',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{grade.icon}</div>
              <Title level={4} style={{ margin: 0 }}>
                {grade.grade}
              </Title>
            </div>
            <Divider />
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">승급 조건:</Text>
                <br />
                <Text>{grade.condition}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text type="secondary">혜택:</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {grade.benefits.map((benefit, idx) => (
                    <li key={idx}>
                      <Text>{benefit}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // ========== 탭 3: 보너스 상세 ==========
  const renderBonusDetails = () => (
    <Collapse accordion defaultActiveKey={['1']}>
      {overview.bonusTypes.map((bonus, index) => (
        <Panel
          header={
            <Space>
              <DollarOutlined style={{ color: '#E53935' }} />
              <strong>{bonus.name}</strong>
              <Tag color="green">{bonus.amount}</Tag>
            </Space>
          }
          key={String(index + 1)}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>지급 금액:</Text>
              <br />
              <Tag
                color="green"
                style={{ fontSize: '16px', padding: '6px 16px' }}
              >
                {bonus.amount}
              </Tag>
            </div>
            <div>
              <Text strong>지급 조건:</Text>
              <br />
              <Text>{bonus.condition}</Text>
            </div>
            <div>
              <Text strong>설명:</Text>
              <br />
              <Paragraph>{bonus.description}</Paragraph>
            </div>
          </Space>
        </Panel>
      ))}
    </Collapse>
  );

  // ========== 탭 4: 중요 규칙 ==========
  const renderImportantRules = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="⚠️ 중요 규칙"
        description={
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>모든 보너스는 정산 주기(주간)에 따라 지급됩니다.</li>
            <li>보너스 지급은 실제 판매가 확정된 후에만 이루어집니다.</li>
            <li>승급 조건을 충족하지 못하면 이전 등급으로 강등될 수 있습니다.</li>
            <li>
              부정한 방법으로 보너스를 취득한 경우 회원 자격이 박탈될 수 있습니다.
            </li>
          </ul>
        }
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
      />

      <Alert
        message="✅ 보너스 수령 자격"
        description={
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>활성 회원 상태여야 합니다.</li>
            <li>은행 계좌가 등록되어 있어야 합니다.</li>
            <li>필수 교육 과정을 이수해야 합니다 (매니저 이상).</li>
            <li>정산 주기 내에 최소 활동 기준을 충족해야 합니다.</li>
          </ul>
        }
        type="info"
        showIcon
        icon={<CheckCircleOutlined />}
      />

      <Card title="📋 정산 프로세스">
        <Timeline
          items={[
            {
              children: '1단계: 판매 및 활동 데이터 집계 (일요일~월요일)',
            },
            {
              children: '2단계: 보너스 자동 계산 (월요일 밤)',
            },
            {
              children: '3단계: 관리자 검수 및 승인 (화요일)',
            },
            {
              children: '4단계: 보너스 지급 (수요일)',
              color: 'green',
            },
            {
              children: '5단계: 회원 확인 및 문의 대응 (수요일~금요일)',
            },
          ]}
        />
      </Card>

      <Card title="💡 FAQ">
        <Collapse>
          <Panel header="보너스는 언제 지급되나요?" key="1">
            매주 수요일에 지급됩니다. 전주 일요일부터 월요일까지의 활동에 대한
            보너스가 지급됩니다.
          </Panel>
          <Panel header="등급은 어떻게 승급하나요?" key="2">
            각 등급별 조건을 충족하면 자동으로 승급됩니다. 등급 체계 탭에서 상세
            조건을 확인하세요.
          </Panel>
          <Panel header="보너스가 지급되지 않았어요" key="3">
            계좌 정보가 정확한지, 활성 회원 상태인지 확인하세요. 문제가 지속되면
            고객센터로 문의하세요.
          </Panel>
          <Panel header="판권 보너스는 어떻게 받나요?" key="4">
            하위 회원을 육성하여 승급시키면 받을 수 있습니다. 육성한 회원의 등급에
            따라 차등 지급됩니다.
          </Panel>
        </Collapse>
      </Card>
    </Space>
  );

  // ========== 탭 5: 원본 문서 ==========
  const renderOriginalDocs = () => {
    const imageFiles = Array.from({ length: 13 }, (_, i) => ({
      id: i + 1,
      src: `/보상플랜/뷰젬 보상플랜만_${i + 1}.png`,
      alt: `보상플랜 문서 ${i + 1}페이지`,
    }));

    return (
      <Card title="📄 보상플랜 원본 문서 (13페이지)">
        <Alert
          message="원본 문서를 클릭하면 확대하여 볼 수 있습니다"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={[16, 16]}>
          {imageFiles.map((img) => (
            <Col xs={24} sm={12} md={8} lg={6} key={img.id}>
              <Card
                hoverable
                cover={
                  <Image
                    src={img.src}
                    alt={img.alt}
                    style={{ width: '100%', height: 'auto' }}
                    preview={{
                      mask: '확대하여 보기',
                    }}
                  />
                }
              >
                <Card.Meta
                  title={`${img.id}페이지`}
                  description={`보상플랜 문서 ${img.id}/13`}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 탭 아이템 정의
  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: (
        <span>
          <FileTextOutlined />
          개요
        </span>
      ),
      children: renderOverview(),
    },
    {
      key: 'grade',
      label: (
        <span>
          <CrownOutlined />
          등급 체계
        </span>
      ),
      children: renderGradeSystem(),
    },
    {
      key: 'bonus',
      label: (
        <span>
          <DollarOutlined />
          보너스 상세
        </span>
      ),
      children: renderBonusDetails(),
    },
    {
      key: 'rules',
      label: (
        <span>
          <InfoCircleOutlined />
          중요 규칙
        </span>
      ),
      children: renderImportantRules(),
    },
    {
      key: 'docs',
      label: (
        <span>
          <FileTextOutlined />
          원본 문서
        </span>
      ),
      children: renderOriginalDocs(),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <TrophyOutlined style={{ color: '#E53935' }} /> 보상플랜
          </Title>
          <Paragraph type="secondary">
            케이아이온 네트워크 마케팅 보상 체계를 확인하세요
          </Paragraph>
        </div>

        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={setActiveTab}
          size="large"
        />
      </div>
    </DashboardLayout>
  );
}
