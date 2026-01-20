'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  message,
  Modal,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { tempMembersService, TempMember } from '@/services/temp-members.service';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function TempJoinListPage() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<TempMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TempMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TempMember | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterMigrated, setFilterMigrated] = useState<string>('all');

  // 목록 조회
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await tempMembersService.getAll();
      setMembers(data);
      applyFilter(data, filterMigrated);
    } catch (error: any) {
      console.error('Failed to fetch temp members:', error);
      message.error('임시 회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용
  const applyFilter = (data: TempMember[], filter: string) => {
    if (filter === 'all') {
      setFilteredMembers(data);
    } else if (filter === 'migrated') {
      setFilteredMembers(data.filter((m) => m.isMigrated));
    } else if (filter === 'notMigrated') {
      setFilteredMembers(data.filter((m) => !m.isMigrated));
    }
  };

  // 필터 변경
  const handleFilterChange = (value: string) => {
    setFilterMigrated(value);
    applyFilter(members, value);
  };

  // 상세보기
  const handleViewDetail = async (id: number) => {
    try {
      const member = await tempMembersService.getOne(id);
      setSelectedMember(member);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error('회원 정보를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 테이블 컬럼 정의
  const columns: ColumnsType<TempMember> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '비밀번호',
      dataIndex: 'password',
      key: 'password',
      width: 150,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '주민번호',
      dataIndex: 'residentNumber',
      key: 'residentNumber',
      width: 150,
      render: (residentNumber: string) => {
        // 주민번호 뒷자리 마스킹
        const parts = residentNumber.split('-');
        if (parts.length === 2) {
          return `${parts[0]}-${'*'.repeat(parts[1].length)}`;
        }
        return residentNumber;
      },
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '주소',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      render: (_: any, record: TempMember) => {
        if (!record.address) return '-';
        return `${record.postalCode ? `(${record.postalCode}) ` : ''}${record.address} ${record.addressDetail || ''}`.trim();
      },
    },
    {
      title: '은행',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 100,
      render: (bankName: string | null) => bankName || '-',
    },
    {
      title: '계좌번호',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 150,
      render: (accountNumber: string | null) => accountNumber || '-',
    },
    {
      title: '추천인',
      dataIndex: 'recommenderPhone',
      key: 'recommenderPhone',
      width: 140,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '후원인',
      dataIndex: 'sponsorPhone',
      key: 'sponsorPhone',
      width: 140,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '소속지점',
      dataIndex: 'centerName',
      key: 'centerName',
      width: 120,
      render: (centerName: string | null) => centerName || '-',
    },
    {
      title: '이전 상태',
      dataIndex: 'isMigrated',
      key: 'isMigrated',
      width: 120,
      render: (isMigrated: boolean) => (
        <Tag
          icon={isMigrated ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={isMigrated ? 'success' : 'warning'}
        >
          {isMigrated ? '이전 완료' : '대기 중'}
        </Tag>
      ),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('ko-KR'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: TempMember) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
          상세
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={2}>
            <UserOutlined /> 임시 회원가입 목록
          </Title>
          <Text type="secondary">시스템 완성 전 임시로 가입한 회원들의 목록입니다.</Text>
        </div>
        <Space>
          <Select value={filterMigrated} onChange={handleFilterChange} style={{ width: 150 }}>
            <Select.Option value="all">전체</Select.Option>
            <Select.Option value="notMigrated">대기 중</Select.Option>
            <Select.Option value="migrated">이전 완료</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchMembers} loading={loading}>
            새로고침
          </Button>
        </Space>
      </div>

      {/* 통계 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <Text type="secondary">전체 회원</Text>
            <div>
              <Text strong style={{ fontSize: 24 }}>
                {members.length}
              </Text>
              <Text type="secondary"> 명</Text>
            </div>
          </div>
          <div>
            <Text type="secondary">대기 중</Text>
            <div>
              <Text strong style={{ fontSize: 24, color: '#faad14' }}>
                {members.filter((m) => !m.isMigrated).length}
              </Text>
              <Text type="secondary"> 명</Text>
            </div>
          </div>
          <div>
            <Text type="secondary">이전 완료</Text>
            <div>
              <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                {members.filter((m) => m.isMigrated).length}
              </Text>
              <Text type="secondary"> 명</Text>
            </div>
          </div>
        </Space>
      </Card>

      {/* 회원 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredMembers}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}명`,
          }}
          scroll={{ x: 2000 }}
        />
      </Card>

      {/* 상세 모달 */}
      <Modal
        title="임시 회원 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            닫기
          </Button>,
        ]}
        width={800}
      >
        {selectedMember && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{selectedMember.id}</Descriptions.Item>
            <Descriptions.Item label="아이디">{selectedMember.username}</Descriptions.Item>
            <Descriptions.Item label="비밀번호">{selectedMember.password}</Descriptions.Item>
            <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
            <Descriptions.Item label="주민번호">{selectedMember.residentNumber}</Descriptions.Item>
            <Descriptions.Item label="전화번호">{selectedMember.phone}</Descriptions.Item>
            <Descriptions.Item label="이전 상태">
              <Tag
                icon={selectedMember.isMigrated ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                color={selectedMember.isMigrated ? 'success' : 'warning'}
              >
                {selectedMember.isMigrated ? '이전 완료' : '대기 중'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="주소" span={2}>
              {selectedMember.postalCode && `(${selectedMember.postalCode}) `}
              {selectedMember.address} {selectedMember.addressDetail}
            </Descriptions.Item>
            <Descriptions.Item label="은행">{selectedMember.bankName || '-'}</Descriptions.Item>
            <Descriptions.Item label="계좌번호">
              {selectedMember.accountNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="예금주">
              {selectedMember.accountHolder || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="추천인 전화번호">
              {selectedMember.recommenderPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="후원인 전화번호">
              {selectedMember.sponsorPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="소속지점(센터)">
              {selectedMember.centerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="가입일">
              {new Date(selectedMember.createdAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
            <Descriptions.Item label="수정일">
              {new Date(selectedMember.updatedAt).toLocaleString('ko-KR')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
