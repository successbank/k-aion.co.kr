'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Input,
  Table,
  Typography,
  Alert,
  Space,
  Tag,
  message,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ShopOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { membersService, CenterMember } from '@/services/members.service';

const { Text, Title } = Typography;

// 등급 한글 매핑
const GRADE_LABELS: Record<string, string> = {
  ADMIN: '최고관리자',
  CENTER: '센터',
  DIVISION_CHIEF: '본부장',
  BRANCH_CHIEF: '지부장',
  MANAGER: '매니저',
  AGENT: '에이전트',
  MEMBER: '회원',
};

interface AddMemberToCenterModalProps {
  visible: boolean;
  centerName: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface MemberWithCenter extends CenterMember {
  isFromOtherCenter?: boolean;
}

export default function AddMemberToCenterModal({
  visible,
  centerName,
  onCancel,
  onSuccess,
}: AddMemberToCenterModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberWithCenter[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 회원 목록 조회 (미지정 회원 + 다른 센터 회원 모두 포함)
  const fetchMembers = useCallback(async (page = 1) => {
    if (!visible) return;

    try {
      setLoading(true);
      // ADMIN, CENTER 등급 제외한 회원 조회
      const response = await membersService.getMembers({
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      });

      // 현재 센터 소속이 아닌 회원만 필터링 + 다른 센터 소속 표시
      const filteredMembers: MemberWithCenter[] = response.data
        .filter(
          (m) =>
            m.grade !== 'ADMIN' &&
            m.grade !== 'CENTER' &&
            m.centerName !== centerName
        )
        .map((m) => ({
          id: m.id,
          username: m.username,
          name: m.name,
          phone: m.phone,
          grade: m.grade,
          cumulativePv: m.cumulativePv,
          createdAt: m.createdAt,
          centerName: m.centerName || null,
          isFromOtherCenter: !!m.centerName,
        }));

      setMembers(filteredMembers);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.meta.total,
      }));
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      message.error('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [visible, search, pagination.pageSize, centerName]);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelectedRowKeys([]);
      fetchMembers(1);
    }
  }, [visible]);

  // 검색 실행
  const handleSearch = () => {
    fetchMembers(1);
  };

  // 센터 할당 처리
  const handleAssign = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('추가할 회원을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await membersService.assignCenterBulk({
        memberIds: selectedRowKeys.map((key) => Number(key)),
        centerName,
      });
      message.success(`${selectedRowKeys.length}명이 ${centerName}에 추가되었습니다.`);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to assign center:', error);
      message.error(error.message || '센터 할당에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 다른 센터에서 이동하는 회원 수 계산
  const membersFromOtherCenter = selectedRowKeys.filter((key) => {
    const member = members.find((m) => m.id === key);
    return member?.isFromOtherCenter;
  }).length;

  // 테이블 컬럼
  const columns: ColumnsType<MemberWithCenter> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '등급',
      dataIndex: 'grade',
      key: 'grade',
      width: 90,
      render: (grade: string) => (
        <Tag color={grade === 'AGENT' ? 'blue' : 'default'}>
          {GRADE_LABELS[grade] || grade}
        </Tag>
      ),
    },
    {
      title: '현재 센터',
      dataIndex: 'centerName',
      key: 'centerName',
      width: 120,
      render: (center: string | null) =>
        center ? (
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <Text type="warning">{center}</Text>
          </Space>
        ) : (
          <Text type="secondary">미지정</Text>
        ),
    },
  ];

  // 행 선택 설정
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <Modal
      title={
        <Space>
          <ShopOutlined style={{ color: '#eb2f96' }} />
          <span>{centerName}에 회원 추가</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleAssign}
      okText={`추가 (${selectedRowKeys.length}명)`}
      cancelText="취소"
      confirmLoading={submitting}
      okButtonProps={{ disabled: selectedRowKeys.length === 0 }}
      width={700}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 검색 */}
        <Input.Search
          placeholder="이름 또는 아이디로 검색"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={handleSearch}
          onPressEnter={handleSearch}
          allowClear
          enterButton="검색"
        />

        {/* 회원 목록 테이블 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={members}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: false,
            showTotal: (total) => `총 ${total}명`,
          }}
          onChange={(p) => fetchMembers(p.current || 1)}
          scroll={{ y: 300 }}
          locale={{ emptyText: '추가 가능한 회원이 없습니다' }}
        />

        {/* 다른 센터에서 이동하는 회원 경고 */}
        {membersFromOtherCenter > 0 && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message={`${membersFromOtherCenter}명이 다른 센터에서 이동합니다`}
            description="선택한 회원 중 일부가 이미 다른 센터에 소속되어 있습니다. 추가 시 해당 회원들은 현재 센터로 이동됩니다."
            showIcon
          />
        )}

        {/* 안내 메시지 */}
        <Alert
          type="info"
          showIcon
          message="회원 추가 안내"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>선택한 회원들이 {centerName}에 추가됩니다.</li>
              <li>다른 센터에 소속된 회원은 새 센터로 이동됩니다.</li>
            </ul>
          }
        />
      </Space>
    </Modal>
  );
}
