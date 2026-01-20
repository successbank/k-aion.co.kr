'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tabs,
  Tag,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Modal,
  Checkbox,
  Alert,
  Empty,
  Tooltip,
  message,
} from 'antd';
import {
  SafetyOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  ReloadOutlined,
  BugOutlined,
  UserOutlined,
  TeamOutlined,
  NodeIndexOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  integrityCheckService,
  IntegrityReport,
  IntegrityCheckHistoryItem,
  ViolationType,
  ViolationTypeLabels,
  ViolationTypeDescriptions,
  ViolationFixMethods,
  IntegrityViolation,
} from '@/services/integrity-check.service';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function IntegrityCheckPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [history, setHistory] = useState<IntegrityCheckHistoryItem[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [autoFixConfirmVisible, setAutoFixConfirmVisible] = useState(false);
  const [autoFix, setAutoFix] = useState(false);

  // 초기 로드
  useEffect(() => {
    fetchHistory();
  }, []);

  // 무결성 검사 실행
  const runIntegrityCheck = async (shouldAutoFix: boolean = false) => {
    try {
      setLoading(true);
      const result = await integrityCheckService.runCheck(shouldAutoFix);
      setReport(result);

      if (result.healthy) {
        message.success('무결성 검사 완료: 모든 데이터가 정상입니다.');
      } else if (shouldAutoFix && result.fixes) {
        message.warning(
          `무결성 검사 완료: ${result.summary.totalViolations}건 발견, ${result.fixes.totalFixed}건 자동 수정됨`,
        );
      } else {
        message.warning(`무결성 검사 완료: ${result.summary.totalViolations}건 위반 발견`);
      }

      // 이력 갱신
      fetchHistory();
    } catch (error: any) {
      console.error('Integrity check failed:', error);
      message.error(error.message || '무결성 검사 실행에 실패했습니다.');
    } finally {
      setLoading(false);
      setAutoFixConfirmVisible(false);
    }
  };

  // 이력 조회
  const fetchHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const response = await integrityCheckService.getHistory({
        page,
        limit: historyPagination.pageSize,
      });
      setHistory(response.data);
      setHistoryPagination({
        ...historyPagination,
        current: page,
        total: response.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 자동 수정 확인 모달 열기
  const openAutoFixConfirm = () => {
    setAutoFix(true);
    setAutoFixConfirmVisible(true);
  };

  // 위반 유형별 아이콘
  const getViolationIcon = (type: ViolationType) => {
    switch (type) {
      case ViolationType.CIRCULAR_REFERENCE:
        return <SyncOutlined spin={false} style={{ color: '#eb2f96' }} />;
      case ViolationType.ORPHAN_NODE:
        return <UserOutlined style={{ color: '#fa8c16' }} />;
      case ViolationType.INVALID_TEAM_LINE:
        return <TeamOutlined style={{ color: '#722ed1' }} />;
      case ViolationType.SELF_REFERENCE:
        return <StopOutlined style={{ color: '#f5222d' }} />;
      case ViolationType.INACTIVE_PARENT:
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return <BugOutlined />;
    }
  };

  // 위반 유형별 색상
  const getViolationColor = (type: ViolationType) => {
    switch (type) {
      case ViolationType.CIRCULAR_REFERENCE:
        return 'magenta';
      case ViolationType.ORPHAN_NODE:
        return 'orange';
      case ViolationType.INVALID_TEAM_LINE:
        return 'purple';
      case ViolationType.SELF_REFERENCE:
        return 'red';
      case ViolationType.INACTIVE_PARENT:
        return 'gold';
      default:
        return 'default';
    }
  };

  // 위반 테이블 컬럼
  const violationColumns: ColumnsType<any> = [
    {
      title: '회원 ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 100,
    },
    {
      title: '회원명',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120,
    },
    {
      title: '위반 유형',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: ViolationType) => (
        <Tag icon={getViolationIcon(type)} color={getViolationColor(type)}>
          {ViolationTypeLabels[type]}
        </Tag>
      ),
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '자동 수정 방법',
      key: 'fixMethod',
      width: 200,
      render: (_: any, record: any) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {ViolationFixMethods[record.type as ViolationType]}
        </Text>
      ),
    },
  ];

  // 이력 테이블 컬럼
  const historyColumns: ColumnsType<IntegrityCheckHistoryItem> = [
    {
      title: '검사 시간',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
    {
      title: '실행자',
      dataIndex: 'executedBy',
      key: 'executedBy',
      width: 120,
      render: (executedBy: { id: number; name: string } | null) =>
        executedBy ? executedBy.name : '시스템 자동',
    },
    {
      title: '전체 회원',
      dataIndex: 'totalMembers',
      key: 'totalMembers',
      width: 100,
      align: 'right',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '발견된 위반',
      dataIndex: 'totalViolations',
      key: 'totalViolations',
      width: 120,
      align: 'right',
      render: (count: number) =>
        count > 0 ? (
          <Text type="danger">{count}건</Text>
        ) : (
          <Text type="success">0건</Text>
        ),
    },
    {
      title: '자동 수정',
      key: 'autoFix',
      width: 120,
      render: (_, record) =>
        record.wasAutoFixed ? (
          <Tag color="green">{record.fixedCount}건 수정</Tag>
        ) : (
          <Tag>미수정</Tag>
        ),
    },
    {
      title: '상태',
      dataIndex: 'healthy',
      key: 'healthy',
      width: 100,
      render: (healthy: boolean) =>
        healthy ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            정상
          </Tag>
        ) : (
          <Tag icon={<ExclamationCircleOutlined />} color="warning">
            이상
          </Tag>
        ),
    },
  ];

  // 모든 위반 사항을 하나의 배열로 합치기
  const getAllViolations = (): any[] => {
    if (!report) return [];

    return [
      ...report.violations.circularReferences.map((v) => ({ ...v, key: `cr-${v.memberId}` })),
      ...report.violations.orphanNodes.map((v) => ({ ...v, key: `on-${v.memberId}-${v.fieldName}` })),
      ...report.violations.invalidTeamLines.map((v) => ({ ...v, key: `itl-${v.memberId}` })),
      ...report.violations.selfReferences.map((v) => ({ ...v, key: `sr-${v.memberId}-${v.fieldName}` })),
      ...report.violations.inactiveParentReferences.map((v) => ({ ...v, key: `ipr-${v.memberId}-${v.fieldName}` })),
    ];
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <SafetyOutlined style={{ marginRight: '12px' }} />
          회원 데이터 무결성 검사
        </Title>
        <Paragraph type="secondary" style={{ marginTop: '8px' }}>
          회원 데이터의 무결성 위반 사항을 탐지하고 자동으로 수정합니다.
          순환 참조, 고아 노드, 유효하지 않은 팀라인 등을 검사합니다.
        </Paragraph>
      </div>

      {/* 검사 실행 버튼 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="middle">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => runIntegrityCheck(false)}
            loading={loading}
            size="large"
          >
            검사 실행
          </Button>
          <Button
            type="primary"
            danger
            icon={<SyncOutlined />}
            onClick={openAutoFixConfirm}
            loading={loading}
            size="large"
          >
            검사 + 자동 수정
          </Button>
          <Text type="secondary">
            일일 자동 검사: 매일 오전 3시에 자동 수정 모드로 실행됩니다.
          </Text>
        </Space>
      </Card>

      {/* 검사 결과 요약 */}
      {report && (
        <Card
          title={
            <Space>
              {report.healthy ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              )}
              <span>검사 결과</span>
              <Tag>{new Date(report.executedAt).toLocaleString('ko-KR')}</Tag>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          {report.healthy ? (
            <Alert
              message="모든 데이터가 정상입니다"
              description={`전체 ${report.totalMembers.toLocaleString()}명 검사 완료`}
              type="success"
              showIcon
            />
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={4}>
                  <Statistic
                    title="전체 회원"
                    value={report.totalMembers}
                    suffix="명"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="총 위반"
                    value={report.summary.totalViolations}
                    suffix="건"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="순환 참조"
                    value={report.summary.circularReferences}
                    suffix="건"
                    valueStyle={{
                      color: report.summary.circularReferences > 0 ? '#eb2f96' : undefined,
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="고아 노드"
                    value={report.summary.orphanNodes}
                    suffix="건"
                    valueStyle={{
                      color: report.summary.orphanNodes > 0 ? '#fa8c16' : undefined,
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="유효하지 않은 팀라인"
                    value={report.summary.invalidTeamLines}
                    suffix="건"
                    valueStyle={{
                      color: report.summary.invalidTeamLines > 0 ? '#722ed1' : undefined,
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="비활성 상위자"
                    value={report.summary.inactiveParentReferences}
                    suffix="건"
                    valueStyle={{
                      color: report.summary.inactiveParentReferences > 0 ? '#faad14' : undefined,
                    }}
                  />
                </Col>
              </Row>

              {report.fixes && (
                <Alert
                  message={`자동 수정 완료: ${report.fixes.totalFixed}건`}
                  description={
                    report.fixes.failedFixes.length > 0
                      ? `수정 실패: ${report.fixes.failedFixes.length}건`
                      : '모든 위반 사항이 정상적으로 수정되었습니다.'
                  }
                  type={report.fixes.failedFixes.length > 0 ? 'warning' : 'success'}
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              )}
            </>
          )}
        </Card>
      )}

      {/* 상세 결과 탭 */}
      <Card>
        <Tabs defaultActiveKey="violations">
          <TabPane
            tab={
              <span>
                <WarningOutlined />
                위반 사항 {report && !report.healthy && `(${report.summary.totalViolations})`}
              </span>
            }
            key="violations"
          >
            {report && !report.healthy ? (
              <Table
                columns={violationColumns}
                dataSource={getAllViolations()}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `총 ${total}건`,
                }}
                scroll={{ x: 900 }}
                size="small"
              />
            ) : (
              <Empty
                description={
                  report
                    ? '위반 사항이 없습니다.'
                    : '검사를 실행하면 위반 사항이 여기에 표시됩니다.'
                }
              />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                검사 이력
              </span>
            }
            key="history"
          >
            <Table
              columns={historyColumns}
              dataSource={history.map((h) => ({ ...h, key: h.id }))}
              loading={historyLoading}
              pagination={{
                ...historyPagination,
                onChange: (page) => fetchHistory(page),
                showTotal: (total) => `총 ${total}건`,
              }}
              scroll={{ x: 800 }}
              size="small"
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <NodeIndexOutlined />
                검사 항목 안내
              </span>
            }
            key="guide"
          >
            <Row gutter={[16, 16]}>
              {Object.values(ViolationType).map((type) => (
                <Col span={12} key={type}>
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        {getViolationIcon(type)}
                        <Text strong>{ViolationTypeLabels[type]}</Text>
                        <Tag color={getViolationColor(type)}>{type}</Tag>
                      </Space>
                      <Text type="secondary">{ViolationTypeDescriptions[type]}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          자동 수정: {ViolationFixMethods[type]}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 자동 수정 확인 모달 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>자동 수정 확인</span>
          </Space>
        }
        open={autoFixConfirmVisible}
        onOk={() => runIntegrityCheck(true)}
        onCancel={() => setAutoFixConfirmVisible(false)}
        okText="검사 및 수정 실행"
        cancelText="취소"
        okButtonProps={{ danger: true, loading }}
      >
        <Alert
          message="주의"
          description={
            <>
              <p>
                자동 수정을 실행하면 발견된 모든 위반 사항이 자동으로 수정됩니다.
              </p>
              <p>
                <strong>수정 방법:</strong>
              </p>
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>순환 참조: 루프의 마지막 노드 참조를 null로 설정</li>
                <li>고아 노드: 존재하지 않는 참조를 null로 설정</li>
                <li>유효하지 않은 팀라인: teamLine을 null로 설정</li>
                <li>자기 참조: 자기 참조를 null로 설정</li>
                <li>비활성 상위자: 비활성 상위자 참조를 null로 설정</li>
              </ul>
              <p>
                수정된 회원은 후원인/추천인 관계가 해제될 수 있으므로
                필요시 수동으로 재설정해야 합니다.
              </p>
            </>
          }
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
}
