'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Alert,
  Input,
  Space,
  Spin,
  Descriptions,
  message,
  Result,
} from 'antd';
import { WarningOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
  membersService,
  BulkResetTargetCountResponse,
  BulkPasswordResetResponse,
} from '@/services/members.service';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface BulkPasswordResetModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export function BulkPasswordResetModal({
  visible,
  onCancel,
  onSuccess,
}: BulkPasswordResetModalProps) {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [targetCount, setTargetCount] = useState<BulkResetTargetCountResponse | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<BulkPasswordResetResponse | null>(null);

  const CONFIRMATION_STRING = 'RESET_ALL_PASSWORDS';

  useEffect(() => {
    if (visible) {
      fetchTargetCount();
    } else {
      // 모달 닫힐 때 상태 초기화
      setTargetCount(null);
      setConfirmationText('');
      setReason('');
      setResult(null);
    }
  }, [visible]);

  const fetchTargetCount = async () => {
    setLoading(true);
    try {
      const data = await membersService.getBulkResetTargetCount();
      setTargetCount(data);
    } catch (error: any) {
      console.error('Failed to fetch target count:', error);
      message.error(error.message || '대상 회원 수 조회에 실패했습니다.');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirmationText !== CONFIRMATION_STRING) {
      message.error('확인 문자열이 일치하지 않습니다.');
      return;
    }

    setExecuting(true);
    try {
      const response = await membersService.bulkResetPasswords({
        confirmationText,
        reason: reason || undefined,
      });
      setResult(response);
      message.success(response.message);
    } catch (error: any) {
      console.error('Failed to reset passwords:', error);
      message.error(error.message || '비밀번호 초기화에 실패했습니다.');
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    if (result) {
      onSuccess();
    } else {
      onCancel();
    }
  };

  const isConfirmationValid = confirmationText === CONFIRMATION_STRING;

  // 결과 모달 표시
  if (result) {
    return (
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>비밀번호 초기화 완료</span>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        onOk={handleClose}
        okText="확인"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={500}
      >
        <Result
          status="success"
          title="비밀번호가 성공적으로 초기화되었습니다"
          subTitle={
            <div>
              <Descriptions bordered size="small" column={1} style={{ marginTop: 16 }}>
                <Descriptions.Item label="초기화된 회원 수">
                  <Text strong style={{ color: '#1890ff', fontSize: 18 }}>
                    {result.resetCount}명
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="제외된 ADMIN 회원 수">
                  {result.excludedAdminCount}명
                </Descriptions.Item>
                <Descriptions.Item label="새 비밀번호">
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                    {result.newPassword}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="실행 시각">
                  {new Date(result.executedAt).toLocaleString('ko-KR')}
                </Descriptions.Item>
              </Descriptions>
            </div>
          }
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <span style={{ color: '#ff4d4f' }}>전체 회원 비밀번호 초기화</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleReset}
      okText="초기화 실행"
      cancelText="취소"
      okButtonProps={{
        danger: true,
        disabled: !isConfirmationValid || loading,
        loading: executing,
      }}
      width={600}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>대상 회원 수 조회 중...</p>
        </div>
      ) : targetCount ? (
        <div>
          {/* 위험 경고 */}
          <Alert
            type="error"
            message="주의: 매우 위험한 작업입니다"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>이 작업은 <strong>ADMIN을 제외한 모든 활성 회원</strong>의 비밀번호를 초기화합니다.</li>
                <li>초기화된 비밀번호는 <strong>&quot;1234&quot;</strong>입니다.</li>
                <li>이 작업은 <strong>되돌릴 수 없습니다</strong>.</li>
                <li>작업 기록은 Activity Log에 저장됩니다.</li>
              </ul>
            }
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          {/* 영향 범위 */}
          <Title level={5}>영향 범위</Title>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="초기화 대상 회원">
              <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>
                {targetCount.targetCount}명
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="제외되는 ADMIN">
              <Text style={{ color: '#52c41a' }}>
                {targetCount.adminCount}명
              </Text>
            </Descriptions.Item>
          </Descriptions>

          {/* 확인 문자열 입력 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#ff4d4f' }}>
              확인을 위해 아래 문자열을 정확히 입력하세요:
            </Text>
            <div
              style={{
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: 4,
                padding: '8px 12px',
                margin: '8px 0',
                fontFamily: 'monospace',
                fontSize: 14,
                color: '#cf1322',
              }}
            >
              {CONFIRMATION_STRING}
            </div>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="RESET_ALL_PASSWORDS"
              status={confirmationText && !isConfirmationValid ? 'error' : undefined}
              style={{ marginTop: 8 }}
            />
            {confirmationText && !isConfirmationValid && (
              <Text type="danger" style={{ fontSize: 12 }}>
                확인 문자열이 일치하지 않습니다.
              </Text>
            )}
            {isConfirmationValid && (
              <Text type="success" style={{ fontSize: 12 }}>
                확인 문자열이 일치합니다.
              </Text>
            )}
          </div>

          {/* 초기화 사유 */}
          <div>
            <Text strong>초기화 사유 (선택):</Text>
            <TextArea
              placeholder="초기화 사유를 입력하세요 (예: 신규 시스템 이전으로 인한 비밀번호 초기화)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              style={{ marginTop: 8 }}
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default BulkPasswordResetModal;
