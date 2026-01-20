'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Radio,
  Checkbox,
  Input,
  Alert,
  Typography,
  Spin,
  Timeline,
  Tag,
  Divider,
  message,
  Space,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  membersService,
  ChangeHistoryItem,
  ChangeHistoryResponse,
  RollbackReason,
  RollbackReasonLabels,
} from '@/services/members.service';

const { Text, Title } = Typography;
const { TextArea } = Input;

// 필드명 한글 매핑
const FieldLabels: Record<string, string> = {
  name: '이름',
  phone: '전화번호',
  birthDate: '생년월일',
  grade: '등급',
  email: '이메일',
  recommenderId: '추천인 ID',
  sponsorId: '후원인 ID',
  teamLine: '소속지점',
  bankName: '은행명',
  accountNumber: '계좌번호',
  accountHolder: '예금주',
  postalCode: '우편번호',
  address: '주소',
  addressDetail: '상세주소',
  isActive: '활성 상태',
};

interface RollbackMemberModalProps {
  visible: boolean;
  memberId: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function RollbackMemberModal({
  visible,
  memberId,
  onCancel,
  onSuccess,
}: RollbackMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyData, setHistoryData] = useState<ChangeHistoryResponse | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reason, setReason] = useState<RollbackReason>(RollbackReason.INPUT_ERROR);
  const [reasonDetail, setReasonDetail] = useState('');

  // 변경 이력 조회
  useEffect(() => {
    if (visible && memberId) {
      fetchChangeHistory();
    } else {
      resetState();
    }
  }, [visible, memberId]);

  const resetState = () => {
    setHistoryData(null);
    setSelectedLogId(null);
    setSelectedFields([]);
    setReason(RollbackReason.INPUT_ERROR);
    setReasonDetail('');
  };

  const fetchChangeHistory = async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      const data = await membersService.getChangeHistory(memberId);
      setHistoryData(data);
    } catch (error: any) {
      message.error(error.message || '변경 이력을 불러오는데 실패했습니다.');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  // 선택한 이력의 변경 필드 추출
  const getSelectedHistoryFields = (): string[] => {
    if (!selectedLogId || !historyData) return [];
    const selectedHistory = historyData.changeHistory.find((h) => h.logId === selectedLogId);
    return selectedHistory?.changedFields || [];
  };

  // 이력 선택 시 모든 필드 자동 선택
  const handleLogSelect = (logId: number) => {
    setSelectedLogId(logId);
    const history = historyData?.changeHistory.find((h) => h.logId === logId);
    if (history) {
      setSelectedFields(history.changedFields);
    }
  };

  // 롤백 실행
  const handleRollback = async () => {
    if (!memberId || !selectedLogId) {
      message.warning('롤백할 변경 이력을 선택해주세요.');
      return;
    }

    if (selectedFields.length === 0) {
      message.warning('롤백할 필드를 하나 이상 선택해주세요.');
      return;
    }

    if (reason === RollbackReason.OTHER && !reasonDetail.trim()) {
      message.warning('"기타" 사유를 선택한 경우 상세 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const result = await membersService.rollbackMember(memberId, {
        rollbackToLogId: selectedLogId,
        reason,
        reasonDetail: reasonDetail.trim() || undefined,
        fieldsToRollback: selectedFields,
      });

      if (result.success) {
        message.success(result.message);

        if (result.notificationSent) {
          message.info('시스템 오류 롤백 알림이 개발팀에 발송되었습니다.');
        }

        onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || '롤백에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 변경 값 포맷팅
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '없음';
    if (typeof value === 'boolean') return value ? '활성' : '비활성';
    return String(value);
  };

  // 선택한 이력의 변경 사항 렌더링
  const renderSelectedChanges = () => {
    if (!selectedLogId || !historyData) return null;

    const selectedHistory = historyData.changeHistory.find((h) => h.logId === selectedLogId);
    if (!selectedHistory) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Text strong>변경 상세:</Text>
        <div style={{ marginTop: 8 }}>
          {selectedHistory.changes.map((change, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                padding: '8px 12px',
                background: selectedFields.includes(change.field) ? '#e6f7ff' : '#f5f5f5',
                borderRadius: 4,
                border: selectedFields.includes(change.field)
                  ? '1px solid #1890ff'
                  : '1px solid #d9d9d9',
              }}
            >
              <Checkbox
                checked={selectedFields.includes(change.field)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFields([...selectedFields, change.field]);
                  } else {
                    setSelectedFields(selectedFields.filter((f) => f !== change.field));
                  }
                }}
              />
              <Text strong style={{ width: 80 }}>
                {FieldLabels[change.field] || change.field}:
              </Text>
              <Text type="danger" delete>
                {formatValue(change.after)}
              </Text>
              <Text type="secondary">→</Text>
              <Text type="success">{formatValue(change.before)}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          회원 정보 롤백
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleRollback}
      okText="롤백 실행"
      cancelText="취소"
      okButtonProps={{
        disabled: !selectedLogId || selectedFields.length === 0,
        loading: submitting,
        danger: true,
      }}
      width={700}
      destroyOnClose
    >
      {loading ? (
        <Spin tip="변경 이력을 불러오는 중...">
          <div style={{ textAlign: 'center', padding: '40px 0', minHeight: '100px' }} />
        </Spin>
      ) : historyData ? (
        <div>
          {/* 현재 회원 정보 */}
          <Alert
            message={
              <span>
                현재 회원: <strong>{historyData.memberName}</strong> (ID: {historyData.memberId})
              </span>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          {/* 변경 이력 목록 */}
          <Title level={5}>
            <HistoryOutlined /> 변경 이력 (최근 {historyData.maxRollbackDepth}건)
          </Title>

          {historyData.changeHistory.length === 0 ? (
            <Empty description="변경 이력이 없습니다." style={{ margin: '24px 0' }} />
          ) : (
            <Timeline
              style={{ marginTop: 16 }}
              items={historyData.changeHistory.map((history) => ({
                color: selectedLogId === history.logId ? 'blue' : history.canRollback ? 'green' : 'gray',
                dot: selectedLogId === history.logId ? (
                  <CheckCircleOutlined style={{ fontSize: 16 }} />
                ) : !history.canRollback ? (
                  <CloseCircleOutlined style={{ fontSize: 16 }} />
                ) : undefined,
                children: (
                  <div
                    onClick={() => history.canRollback && handleLogSelect(history.logId)}
                    style={{
                      cursor: history.canRollback ? 'pointer' : 'not-allowed',
                      padding: '8px 12px',
                      borderRadius: 4,
                      background:
                        selectedLogId === history.logId
                          ? '#e6f7ff'
                          : history.canRollback
                            ? '#fafafa'
                            : '#f5f5f5',
                      border:
                        selectedLogId === history.logId
                          ? '1px solid #1890ff'
                          : '1px solid transparent',
                      opacity: history.canRollback ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>
                        {new Date(history.changedAt).toLocaleString('ko-KR')}
                        {selectedLogId === history.logId && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            선택됨
                          </Tag>
                        )}
                      </Text>
                      {history.changedBy && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          변경자: {history.changedBy.name}
                        </Text>
                      )}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {history.changedFields.map((field) => (
                        <Tag key={field} style={{ marginBottom: 4 }}>
                          {FieldLabels[field] || field}
                        </Tag>
                      ))}
                    </div>
                    {!history.canRollback && (
                      <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        <CloseCircleOutlined /> {history.rollbackBlockReason}
                      </Text>
                    )}
                  </div>
                ),
              }))}
            />
          )}

          {/* 선택한 이력의 변경 사항 */}
          {renderSelectedChanges()}

          <Divider />

          {/* 롤백 사유 선택 */}
          <Title level={5}>롤백 사유 *</Title>
          <Radio.Group
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ marginTop: 8 }}
          >
            <Space direction="vertical">
              <Radio value={RollbackReason.INPUT_ERROR}>
                {RollbackReasonLabels[RollbackReason.INPUT_ERROR]}
              </Radio>
              <Radio value={RollbackReason.SYSTEM_ERROR}>
                <Space>
                  {RollbackReasonLabels[RollbackReason.SYSTEM_ERROR]}
                  <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                    개발팀 알림
                  </Tag>
                </Space>
              </Radio>
              <Radio value={RollbackReason.OTHER}>{RollbackReasonLabels[RollbackReason.OTHER]}</Radio>
            </Space>
          </Radio.Group>

          {/* 시스템 오류 경고 */}
          {reason === RollbackReason.SYSTEM_ERROR && (
            <Alert
              message="시스템 오류 복구"
              description="'시스템 오류 복구' 선택 시 개발팀에 Slack 알림이 자동 발송됩니다. 디버깅을 위한 관련 로그 정보가 함께 전달됩니다."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginTop: 12 }}
            />
          )}

          {/* 기타 사유 입력 */}
          {(reason === RollbackReason.OTHER || reason === RollbackReason.SYSTEM_ERROR) && (
            <div style={{ marginTop: 16 }}>
              <Text strong>상세 내용 {reason === RollbackReason.OTHER && '*'}</Text>
              <TextArea
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder={
                  reason === RollbackReason.SYSTEM_ERROR
                    ? '시스템 오류 상황을 상세히 기술해주세요 (선택사항)'
                    : '롤백 사유를 상세히 입력해주세요 (필수)'
                }
                rows={3}
                maxLength={500}
                showCount
                style={{ marginTop: 8 }}
              />
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
