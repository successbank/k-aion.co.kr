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
  Alert,
  Empty,
  Tooltip,
  message,
} from 'antd';
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  SyncOutlined,
  ReloadOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  HddOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { backupService } from '@/services/backup.service';
import {
  BackupFile,
  BackupStatus,
  BackupLogItem,
  OperationLabels,
  StatusLabels,
  BackupOperation,
  BackupLogStatus,
} from '@/types/backup';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [backupList, setBackupList] = useState<BackupFile[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [logs, setLogs] = useState<BackupLogItem[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreConfirmVisible, setRestoreConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BackupFile | null>(null);

  // 초기 로드
  useEffect(() => {
    fetchAll();
  }, []);

  // 모든 데이터 로드
  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBackupList(), fetchStatus(), fetchLogs()]);
    } finally {
      setLoading(false);
    }
  };

  // 백업 목록 조회
  const fetchBackupList = async () => {
    try {
      const data = await backupService.getBackupList();
      setBackupList(data);
    } catch (error: any) {
      console.error('Failed to fetch backup list:', error);
    }
  };

  // 상태 대시보드 조회
  const fetchStatus = async () => {
    try {
      const data = await backupService.getStatus();
      setStatus(data);
    } catch (error: any) {
      console.error('Failed to fetch status:', error);
    }
  };

  // 작업 로그 조회
  const fetchLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const response = await backupService.getLogs({
        page,
        limit: logsPagination.pageSize,
      });
      setLogs(response.data);
      setLogsPagination({
        ...logsPagination,
        current: page,
        total: response.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // 수동 백업 생성
  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const result = await backupService.createBackup();
      if (result.success) {
        message.success(`백업이 생성되었습니다: ${result.filename}`);
        await fetchAll();
      } else {
        message.error(result.message || '백업 생성에 실패했습니다');
      }
    } catch (error: any) {
      message.error(error.message || '백업 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  // 백업 복구
  const handleRestore = async () => {
    if (!selectedFile) return;

    try {
      setRestoring(true);
      const result = await backupService.restore(selectedFile.filename);
      if (result.success) {
        message.success('데이터베이스가 복구되었습니다');
        await fetchAll();
      } else {
        message.error(result.message || '복구에 실패했습니다');
      }
    } catch (error: any) {
      message.error(error.message || '복구에 실패했습니다');
    } finally {
      setRestoring(false);
      setRestoreConfirmVisible(false);
      setSelectedFile(null);
    }
  };

  // 백업 다운로드
  const handleDownload = async (file: BackupFile) => {
    try {
      message.loading({ content: '다운로드 준비 중...', key: 'download' });
      await backupService.downloadBackup(file.filename);
      message.success({ content: '다운로드가 완료되었습니다', key: 'download' });
    } catch (error: any) {
      message.error({ content: error.message || '다운로드에 실패했습니다', key: 'download' });
    }
  };

  // 백업 삭제
  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      const result = await backupService.deleteBackup(selectedFile.filename);
      if (result.success) {
        message.success('백업이 삭제되었습니다');
        await fetchAll();
      } else {
        message.error(result.message || '삭제에 실패했습니다');
      }
    } catch (error: any) {
      message.error(error.message || '삭제에 실패했습니다');
    } finally {
      setDeleteConfirmVisible(false);
      setSelectedFile(null);
    }
  };

  // 복구 확인 모달 열기
  const openRestoreConfirm = (file: BackupFile) => {
    setSelectedFile(file);
    setRestoreConfirmVisible(true);
  };

  // 삭제 확인 모달 열기
  const openDeleteConfirm = (file: BackupFile) => {
    setSelectedFile(file);
    setDeleteConfirmVisible(true);
  };

  // 시간 경과 표시
  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return '없음';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  // 다음 백업까지 남은 시간
  const formatTimeUntil = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}분 후`;
    return `${diffHours}시간 후`;
  };

  // 작업 유형별 아이콘
  const getOperationIcon = (operation: BackupOperation) => {
    switch (operation) {
      case 'BACKUP':
        return <CloudUploadOutlined style={{ color: '#52c41a' }} />;
      case 'RESTORE':
        return <SyncOutlined style={{ color: '#1890ff' }} />;
      case 'DELETE':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  // 작업 유형별 색상
  const getOperationColor = (operation: BackupOperation): string => {
    switch (operation) {
      case 'BACKUP':
        return 'green';
      case 'RESTORE':
        return 'blue';
      case 'DELETE':
        return 'red';
    }
  };

  // 백업 목록 테이블 컬럼
  const backupColumns: ColumnsType<BackupFile> = [
    {
      title: '파일명',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
    },
    {
      title: '크기',
      dataIndex: 'sizeDisplay',
      key: 'sizeDisplay',
      width: 100,
      align: 'right',
    },
    {
      title: '생성 일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'center',
      render: (type: 'auto' | 'manual') => (
        <Tag color={type === 'auto' ? 'blue' : 'green'}>
          {type === 'auto' ? '자동' : '수동'}
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="다운로드">
            <Button
              type="text"
              size="small"
              icon={<CloudDownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="복구">
            <Button
              type="text"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => openRestoreConfirm(record)}
            />
          </Tooltip>
          <Tooltip title="삭제">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => openDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 작업 로그 테이블 컬럼
  const logColumns: ColumnsType<BackupLogItem> = [
    {
      title: '실행 시간',
      dataIndex: 'executedAt',
      key: 'executedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
    },
    {
      title: '작업',
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: (operation: BackupOperation) => (
        <Tag icon={getOperationIcon(operation)} color={getOperationColor(operation)}>
          {OperationLabels[operation]}
        </Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BackupLogStatus) =>
        status === 'SUCCESS' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            성공
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            실패
          </Tag>
        ),
    },
    {
      title: '파일명',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (filename: string | null) => filename || '-',
    },
    {
      title: '메시지',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '실행자',
      dataIndex: 'executedBy',
      key: 'executedBy',
      width: 120,
      render: (executedBy: { id: number; name: string } | null) =>
        executedBy ? executedBy.name : '시스템 자동',
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <CloudServerOutlined style={{ marginRight: '12px' }} />
            백업/복구 관리
          </Title>
        <Paragraph type="secondary" style={{ marginTop: '8px' }}>
          데이터베이스 백업 및 복구를 관리합니다. 매일 새벽 2시에 자동 백업이 실행됩니다.
        </Paragraph>
      </div>

      {/* 상태 대시보드 */}
      {status && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="마지막 백업"
                value={formatTimeAgo(status.lastBackupAt)}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="총 백업"
                value={status.totalBackups}
                suffix="개"
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="저장 공간"
                value={status.totalSizeDisplay}
                prefix={<HddOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="다음 자동 백업"
                value={formatTimeUntil(status.nextScheduledBackup)}
                prefix={<CalendarOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 작업 버튼 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="middle">
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleCreateBackup}
            loading={creating}
            size="large"
            style={{ backgroundColor: '#7CB342', borderColor: '#7CB342' }}
          >
            백업 생성
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAll}
            loading={loading}
            size="large"
          >
            목록 새로고침
          </Button>
          <Text type="secondary">
            백업 파일은 {status?.retentionDays || 30}일 후 자동 삭제됩니다.
          </Text>
        </Space>
      </Card>

      {/* 탭 콘텐츠 */}
      <Card>
        <Tabs defaultActiveKey="backups">
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                백업 목록 ({backupList.length})
              </span>
            }
            key="backups"
          >
            {backupList.length > 0 ? (
              <Table
                columns={backupColumns}
                dataSource={backupList.map((b) => ({ ...b, key: b.filename }))}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `총 ${total}개`,
                }}
                scroll={{ x: 800 }}
                size="small"
              />
            ) : (
              <Empty description="백업 파일이 없습니다" />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                작업 이력
              </span>
            }
            key="logs"
          >
            <Table
              columns={logColumns}
              dataSource={logs.map((l) => ({ ...l, key: l.id }))}
              loading={logsLoading}
              pagination={{
                ...logsPagination,
                onChange: (page) => fetchLogs(page),
                showTotal: (total) => `총 ${total}건`,
              }}
              scroll={{ x: 900 }}
              size="small"
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <InfoCircleOutlined />
                안내
              </span>
            }
            key="guide"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="자동 백업">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>매일 새벽 2시에 자동으로 데이터베이스 백업이 생성됩니다.</Text>
                    <Text>{status?.retentionDays || 30}일 이상 된 백업 파일은 자동으로 삭제됩니다.</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="수동 백업">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>"백업 생성" 버튼을 클릭하여 즉시 백업을 생성할 수 있습니다.</Text>
                    <Text>중요한 작업 전에 수동 백업을 권장합니다.</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="복구">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>백업 파일을 선택하여 데이터베이스를 복구할 수 있습니다.</Text>
                    <Text type="warning">복구 시 현재 데이터가 교체되며, 안전 백업이 자동 생성됩니다.</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="다운로드">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>백업 파일을 로컬로 다운로드할 수 있습니다.</Text>
                    <Text>파일 형식: .sql.gz (gzip 압축된 SQL 덤프)</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 복구 확인 모달 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>복구 확인</span>
          </Space>
        }
        open={restoreConfirmVisible}
        onOk={handleRestore}
        onCancel={() => {
          setRestoreConfirmVisible(false);
          setSelectedFile(null);
        }}
        okText="복구 실행"
        cancelText="취소"
        okButtonProps={{ danger: true, loading: restoring }}
      >
        <Alert
          message="주의"
          description={
            <>
              <p>
                <strong>{selectedFile?.filename}</strong> 파일로 데이터베이스를 복구합니다.
              </p>
              <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                현재 데이터베이스의 모든 데이터가 백업 시점의 데이터로 교체됩니다.
              </p>
              <p>복구 전 현재 상태의 안전 백업이 자동으로 생성됩니다.</p>
            </>
          }
          type="warning"
          showIcon
        />
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>삭제 확인</span>
          </Space>
        }
        open={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setSelectedFile(null);
        }}
        okText="삭제"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <p>
          <strong>{selectedFile?.filename}</strong> 백업 파일을 삭제하시겠습니까?
        </p>
        <p style={{ color: '#ff4d4f' }}>삭제된 파일은 복구할 수 없습니다.</p>
      </Modal>
      </div>
    </DashboardLayout>
  );
}
