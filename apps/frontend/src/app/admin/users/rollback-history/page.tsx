'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Card,
  DatePicker,
  Tooltip,
  Descriptions,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import {
  membersService,
  RollbackHistoryItem,
  RollbackReason,
  RollbackReasonLabels,
} from '@/services/members.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 필드명 한글 변환 맵
const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  phone: '전화번호',
  birthDate: '생년월일',
  grade: '등급',
  email: '이메일',
  recommenderId: '추천인',
  sponsorId: '후원인',
  teamLine: '소속지점',
  bankName: '은행',
  accountNumber: '계좌번호',
  accountHolder: '예금주',
  postalCode: '우편번호',
  address: '주소',
  addressDetail: '상세주소',
  isActive: '활성상태',
};

// 롤백 사유 색상
const REASON_COLORS: Record<RollbackReason, string> = {
  [RollbackReason.INPUT_ERROR]: 'blue',
  [RollbackReason.SYSTEM_ERROR]: 'red',
  [RollbackReason.OTHER]: 'default',
};

export default function RollbackHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RollbackHistoryItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    reason?: RollbackReason;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // 상세 보기 모달
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RollbackHistoryItem | null>(null);

  // 롤백 이력 조회
  const fetchRollbackHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await membersService.getRollbackHistory({
        page,
        limit: pagination.pageSize,
        ...filters,
      });

      setData(response.data);
      setPagination({
        current: page,
        pageSize: pagination.pageSize,
        total: response.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch rollback history:', error);
      message.error(error.message || '롤백 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상세 보기
  const showDetail = (item: RollbackHistoryItem) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    fetchRollbackHistory(1);
  }, [filters]);

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '롤백시간',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <Tooltip title={d.toLocaleString('ko-KR')}>
            {d.toLocaleDateString('ko-KR', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Tooltip>
        );
      },
    },
    {
      title: '대상회원',
      key: 'targetMember',
      width: 150,
      render: (_: any, record: RollbackHistoryItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.targetMemberName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.targetMemberId}
          </Text>
        </Space>
      ),
    },
    {
      title: '실행자',
      key: 'executor',
      width: 120,
      render: (_: any, record: RollbackHistoryItem) => (
        <Text>{record.memberName}</Text>
      ),
    },
    {
      title: '사유',
      dataIndex: 'rollbackReason',
      key: 'rollbackReason',
      width: 130,
      render: (reason: RollbackReason, record: RollbackHistoryItem) => (
        <Tooltip title={record.rollbackReasonDetail}>
          <Tag color={REASON_COLORS[reason]}>
            {record.rollbackReasonLabel}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '복원필드',
      dataIndex: 'restoredFields',
      key: 'restoredFields',
      width: 200,
      render: (fields: string[]) => (
        <Space wrap size={4}>
          {fields.slice(0, 3).map((field) => (
            <Tag key={field} style={{ margin: 0 }}>
              {FIELD_LABELS[field] || field}
            </Tag>
          ))}
          {fields.length > 3 && (
            <Tooltip title={fields.slice(3).map(f => FIELD_LABELS[f] || f).join(', ')}>
              <Tag style={{ margin: 0 }}>+{fields.length - 3}개</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '변경내용',
      key: 'changes',
      width: 250,
      render: (_: any, record: RollbackHistoryItem) => {
        if (record.changes.length === 0) return '-';
        const firstChange = record.changes[0];
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12 }}>
              <Text type="secondary">{FIELD_LABELS[firstChange.field] || firstChange.field}: </Text>
              <Text delete>{String(firstChange.before || '-')}</Text>
              {' → '}
              <Text strong>{String(firstChange.after || '-')}</Text>
            </Text>
            {record.changes.length > 1 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                외 {record.changes.length - 1}건
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '작업',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: RollbackHistoryItem) => (
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => showDetail(record)}
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/users">
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginBottom: 8 }}>
            회원관리로 돌아가기
          </Button>
        </Link>
        <Title level={2}>
          <HistoryOutlined /> 회원 롤백 이력
        </Title>
        <Text type="secondary">전체 회원의 정보 롤백 이력을 조회합니다</Text>
      </div>

      {/* 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="회원명 또는 ID 검색"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="사유 필터"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, reason: value })}
          >
            <Select.Option value={RollbackReason.INPUT_ERROR}>
              입력 오류 수정
            </Select.Option>
            <Select.Option value={RollbackReason.SYSTEM_ERROR}>
              시스템 오류 복구
            </Select.Option>
            <Select.Option value={RollbackReason.OTHER}>기타</Select.Option>
          </Select>
          <RangePicker
            placeholder={['시작일', '종료일']}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  startDate: dates[0].format('YYYY-MM-DD'),
                  endDate: dates[1].format('YYYY-MM-DD'),
                });
              } else {
                const { startDate, endDate, ...rest } = filters;
                setFilters(rest);
              }
            }}
          />
          <Button onClick={() => fetchRollbackHistory(1)}>새로고침</Button>
        </Space>
      </Card>

      {/* 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
          }}
          onChange={(p) => fetchRollbackHistory(p.current || 1)}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: '롤백 이력이 없습니다',
          }}
        />
      </Card>

      {/* 상세 보기 모달 */}
      <Modal
        title="롤백 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            닫기
          </Button>,
        ]}
        width={700}
      >
        {selectedItem && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="롤백 시간" span={2}>
              {new Date(selectedItem.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="대상 회원">
              {selectedItem.targetMemberName} (ID: {selectedItem.targetMemberId})
            </Descriptions.Item>
            <Descriptions.Item label="실행자">
              {selectedItem.memberName} (ID: {selectedItem.memberId})
            </Descriptions.Item>
            <Descriptions.Item label="롤백 사유">
              <Tag color={REASON_COLORS[selectedItem.rollbackReason]}>
                {selectedItem.rollbackReasonLabel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="상세 사유">
              {selectedItem.rollbackReasonDetail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="복원 필드" span={2}>
              <Space wrap>
                {selectedItem.restoredFields.map((field) => (
                  <Tag key={field}>{FIELD_LABELS[field] || field}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="변경 내용" span={2}>
              {selectedItem.changes.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedItem.changes.map((change, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 0',
                        borderBottom:
                          index < selectedItem.changes.length - 1
                            ? '1px solid #f0f0f0'
                            : 'none',
                      }}
                    >
                      <Text strong>{FIELD_LABELS[change.field] || change.field}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text delete type="danger">
                          {String(change.before || '(없음)')}
                        </Text>
                        <Text style={{ margin: '0 8px' }}>→</Text>
                        <Text strong type="success">
                          {String(change.after || '(없음)')}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
