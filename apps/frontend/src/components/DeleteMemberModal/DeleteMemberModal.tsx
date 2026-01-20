'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Alert,
  Descriptions,
  Select,
  Input,
  Tag,
  Space,
  Spin,
  Divider,
  List,
  message,
} from 'antd';
import { WarningOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import {
  membersService,
  DeleteImpactResponse,
  DownlineHandlingStrategy,
} from '@/services/members.service';
import { MemberGradeLabels, MemberGradeColors, MemberGrade } from '@/types/bonuses';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DeleteMemberModalProps {
  visible: boolean;
  memberId: number | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function DeleteMemberModal({
  visible,
  memberId,
  onCancel,
  onSuccess,
}: DeleteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [impact, setImpact] = useState<DeleteImpactResponse | null>(null);
  const [strategy, setStrategy] = useState<DownlineHandlingStrategy>(
    DownlineHandlingStrategy.BLOCK,
  );
  const [reassignToId, setReassignToId] = useState<number | undefined>();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible && memberId) {
      fetchImpact(memberId);
    } else {
      // 모달 닫힐 때 상태 초기화
      setImpact(null);
      setStrategy(DownlineHandlingStrategy.BLOCK);
      setReassignToId(undefined);
      setReason('');
    }
  }, [visible, memberId]);

  const fetchImpact = async (id: number) => {
    setLoading(true);
    try {
      const data = await membersService.getDeleteImpact(id);
      setImpact(data);
    } catch (error: any) {
      console.error('Failed to fetch delete impact:', error);
      message.error(error.message || '삭제 영향도 조회에 실패했습니다.');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!memberId || !impact) return;

    setDeleting(true);
    try {
      const result = await membersService.deleteMember(memberId, {
        downlineStrategy: strategy,
        reassignToId: strategy === DownlineHandlingStrategy.REASSIGN ? reassignToId : undefined,
        reason: reason || undefined,
      });
      message.success(result.message);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to delete member:', error);
      message.error(error.message || '회원 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const hasDownline =
    impact && (impact.directSponsoreeCount > 0 || impact.directRecommendeeCount > 0);

  const canProceed =
    impact?.canDelete && !(strategy === DownlineHandlingStrategy.BLOCK && hasDownline);

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <span>회원 삭제 확인</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleDelete}
      okText="삭제"
      cancelText="취소"
      okButtonProps={{
        danger: true,
        disabled: !canProceed,
        loading: deleting,
      }}
      width={700}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>삭제 영향도 분석 중...</p>
        </div>
      ) : impact ? (
        <div>
          {/* 삭제 불가 경고 */}
          {!impact.canDelete && (
            <Alert
              type="error"
              message="삭제 불가"
              description={impact.blockReason}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 대상 회원 정보 */}
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="회원 ID">{impact.memberId}</Descriptions.Item>
            <Descriptions.Item label="이름">{impact.memberName}</Descriptions.Item>
            <Descriptions.Item label="등급" span={2}>
              <Tag color={MemberGradeColors[impact.memberGrade as MemberGrade] || 'default'}>
                {MemberGradeLabels[impact.memberGrade as MemberGrade] || impact.memberGrade}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* 영향도 요약 */}
          <Title level={5}>
            <TeamOutlined /> 조직 영향도
          </Title>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="직속 후원 하위">
              <Text
                strong
                style={{
                  color: impact.directSponsoreeCount > 0 ? '#ff4d4f' : '#52c41a',
                }}
              >
                {impact.directSponsoreeCount}명
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="직속 추천 하위">
              <Text
                strong
                style={{
                  color: impact.directRecommendeeCount > 0 ? '#ff4d4f' : '#52c41a',
                }}
              >
                {impact.directRecommendeeCount}명
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="전체 후원계보 하위">
              {impact.totalSponsorDescendantCount}명
            </Descriptions.Item>
            <Descriptions.Item label="전체 추천계보 하위">
              {impact.totalRecommenderDescendantCount}명
            </Descriptions.Item>
          </Descriptions>

          {/* 관련 데이터 */}
          <Title level={5}>
            <FileTextOutlined /> 관련 데이터
          </Title>
          <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="판매">{impact.salesCount}건</Descriptions.Item>
            <Descriptions.Item label="수당">{impact.bonusCount}건</Descriptions.Item>
            <Descriptions.Item label="세미나">{impact.seminarCount}건</Descriptions.Item>
          </Descriptions>

          {/* 하위 회원 미리보기 */}
          {hasDownline && (
            <>
              <Divider />
              <Alert
                type="warning"
                message="하위 회원 처리 필요"
                description="이 회원에게는 하위 회원이 있습니다. 삭제하려면 하위 회원 처리 전략을 선택하세요."
                showIcon
                style={{ marginBottom: 16 }}
              />

              {impact.directSponsorees.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>직속 후원 하위 회원 (최대 10명):</Text>
                  <List
                    size="small"
                    dataSource={impact.directSponsorees}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <Text>{item.name}</Text>
                          <Tag color={MemberGradeColors[item.grade as MemberGrade] || 'default'}>
                            {MemberGradeLabels[item.grade as MemberGrade] || item.grade}
                          </Tag>
                          {item.teamLine && <Text type="secondary">({item.teamLine}팀)</Text>}
                        </Space>
                      </List.Item>
                    )}
                    style={{ maxHeight: 150, overflow: 'auto' }}
                  />
                </div>
              )}

              {/* 하위 회원 처리 전략 선택 */}
              <div style={{ marginBottom: 16 }}>
                <Text strong>하위 회원 처리 전략:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={strategy}
                  onChange={setStrategy}
                >
                  <Select.Option value={DownlineHandlingStrategy.BLOCK}>
                    차단 - 하위 회원이 있으면 삭제 불가
                  </Select.Option>
                  <Select.Option value={DownlineHandlingStrategy.REASSIGN}>
                    재할당 - 하위 회원을 상위 후원인에게 재할당
                    {impact.sponsorName && ` (${impact.sponsorName})`}
                  </Select.Option>
                  <Select.Option value={DownlineHandlingStrategy.ORPHAN}>
                    분리 - 하위 회원의 후원인/추천인 연결 해제 (주의 필요)
                  </Select.Option>
                </Select>
              </div>

              {strategy === DownlineHandlingStrategy.REASSIGN && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>재할당 대상 회원 ID (선택, 비우면 상위 후원인에게 자동 할당):</Text>
                  <Input
                    type="number"
                    placeholder="재할당할 회원 ID"
                    value={reassignToId}
                    onChange={(e) =>
                      setReassignToId(e.target.value ? Number(e.target.value) : undefined)
                    }
                    style={{ marginTop: 8 }}
                  />
                </div>
              )}

              {strategy === DownlineHandlingStrategy.ORPHAN && (
                <Alert
                  type="error"
                  message="주의"
                  description="하위 회원의 후원인/추천인 연결이 해제됩니다. 이 작업은 조직 구조에 심각한 영향을 줄 수 있습니다."
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </>
          )}

          {/* 삭제 사유 */}
          <div style={{ marginTop: 16 }}>
            <Text strong>삭제 사유 (선택):</Text>
            <TextArea
              placeholder="삭제 사유를 입력하세요"
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

export default DeleteMemberModal;
