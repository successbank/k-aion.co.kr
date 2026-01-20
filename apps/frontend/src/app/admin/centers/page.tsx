'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Tabs,
  Checkbox,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UserOutlined,
  TeamOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import {
  membersService,
  Member,
  CenterStats,
  CenterMember,
  CenterStatsResponse,
} from '@/services/members.service';
import { profileService } from '@/services/profile.service';
import DeleteMemberModal from '@/components/DeleteMemberModal';
import AddCenterModal from '@/components/AddCenterModal';
import AssignCenterModal from '@/components/AssignCenterModal';
import AddMemberToCenterModal from '@/components/AddMemberToCenterModal';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// MemberGrade 한글 매핑
const GRADE_LABELS: Record<string, string> = {
  ADMIN: '최고관리자',
  CENTER: '센터',
  DIVISION_CHIEF: '본부장',
  BRANCH_CHIEF: '지부장',
  MANAGER: '매니저',
  AGENT: '에이전트',
  MEMBER: '회원',
};

// 한국 주요 은행 목록
const KOREAN_BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  '기업은행',
  'SC제일은행',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '새마을금고',
  '신협',
  '우체국',
  '수협은행',
  '부산은행',
  '대구은행',
  '광주은행',
  '전북은행',
  '경남은행',
  '제주은행',
];

// 센터 목록 + 회원 수 정보
interface CenterWithMembers extends Member {
  memberCount: number;
}

export default function CentersPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('centers');

  // 센터 관련 상태
  const [centers, setCenters] = useState<Member[]>([]);
  const [centerStats, setCenterStats] = useState<CenterStatsResponse | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    search?: string;
    isActive?: boolean;
  }>({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // 미지정 회원 관련 상태
  const [unassignedMembers, setUnassignedMembers] = useState<CenterMember[]>([]);
  const [unassignedPagination, setUnassignedPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedMemberNames, setSelectedMemberNames] = useState<string[]>([]);

  // 확장된 센터 행 상태
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [expandedCenterMembers, setExpandedCenterMembers] = useState<
    Record<string, CenterMember[]>
  >({});
  const [expandedCenterLoading, setExpandedCenterLoading] = useState<Record<string, boolean>>({});

  // 모달 상태
  const [addCenterModalVisible, setAddCenterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingCenterId, setDeletingCenterId] = useState<number | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<Member | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 센터 내 회원 관리 상태
  const [addMemberToCenterVisible, setAddMemberToCenterVisible] = useState(false);
  const [targetCenterForAdd, setTargetCenterForAdd] = useState<string | null>(null);
  const [editCenterMemberVisible, setEditCenterMemberVisible] = useState(false);
  const [editingCenterMember, setEditingCenterMember] = useState<CenterMember | null>(null);
  const [deleteCenterMemberVisible, setDeleteCenterMemberVisible] = useState(false);
  const [deletingCenterMemberId, setDeletingCenterMemberId] = useState<number | null>(null);
  const [memberEditForm] = Form.useForm();

  // 센터 통계 조회
  const fetchCenterStats = async () => {
    try {
      const response = await membersService.getCenterStats();
      setCenterStats(response);
    } catch (error: any) {
      console.error('Failed to fetch center stats:', error);
    }
  };

  // 센터 목록 조회 (CENTER 등급만)
  const fetchCenters = async (page = 1) => {
    try {
      setLoading(true);
      const response = await membersService.getMembers({
        page,
        limit: pagination.pageSize,
        grade: 'CENTER',
        ...filters,
      });

      setCenters(response.data);
      setPagination({
        current: page,
        pageSize: pagination.pageSize,
        total: response.meta.total,
      });

      // 통계 계산
      calculateStats(response.data, response.meta.total);

      // 센터 통계도 함께 조회
      await fetchCenterStats();
    } catch (error: any) {
      console.error('Failed to fetch centers:', error);
      message.error(error.message || '센터 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 미지정 회원 목록 조회
  const fetchUnassignedMembers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await membersService.getUnassignedMembers({
        page,
        limit: unassignedPagination.pageSize,
        search: unassignedSearch || undefined,
      });

      setUnassignedMembers(response.data);
      setUnassignedPagination({
        current: page,
        pageSize: unassignedPagination.pageSize,
        total: response.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch unassigned members:', error);
      message.error(error.message || '미지정 회원 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 센터별 회원 목록 조회 (확장 행용)
  const fetchCenterMembers = async (centerName: string) => {
    try {
      setExpandedCenterLoading((prev) => ({ ...prev, [centerName]: true }));
      const response = await membersService.getMembersByCenter(centerName, {
        page: 1,
        limit: 100, // 확장 행에서는 많이 보여줌
      });

      setExpandedCenterMembers((prev) => ({
        ...prev,
        [centerName]: response.data,
      }));
    } catch (error: any) {
      console.error(`Failed to fetch members for center ${centerName}:`, error);
      message.error(`${centerName} 소속 회원을 불러오는데 실패했습니다.`);
    } finally {
      setExpandedCenterLoading((prev) => ({ ...prev, [centerName]: false }));
    }
  };

  // 통계 계산
  const calculateStats = (data: Member[], total: number) => {
    const activeCount = data.filter((c) => c.isActive).length;

    setStats({
      total,
      active: activeCount,
      inactive: data.length - activeCount,
    });
  };

  // 센터 수정 모달 열기
  const openEditModal = (center: Member) => {
    setSelectedCenter(center);
    form.setFieldsValue({
      name: center.name,
      phone: center.phone,
      bankName: center.bankName,
      accountNumber: center.accountNumber,
      accountHolder: center.accountHolder,
      isActive: center.isActive,
    });
    setEditModalVisible(true);
  };

  // 센터 정보 수정
  const handleEdit = async (values: any) => {
    if (!selectedCenter) return;

    try {
      await membersService.updateMember(selectedCenter.id, values);
      message.success('센터 정보가 수정되었습니다.');
      setEditModalVisible(false);
      fetchCenters(pagination.current);
    } catch (error: any) {
      message.error(error.message || '센터 정보 수정에 실패했습니다.');
    }
  };

  // 센터 삭제 모달 열기
  const handleDeleteClick = (id: number) => {
    setDeletingCenterId(id);
    setDeleteModalVisible(true);
  };

  // 센터 삭제 성공 처리
  const handleDeleteSuccess = () => {
    setDeleteModalVisible(false);
    setDeletingCenterId(null);
    fetchCenters(pagination.current);
  };

  // 센터 삭제 취소 처리
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeletingCenterId(null);
  };

  // 비밀번호 초기화
  const handleResetPassword = async (center: Member) => {
    Modal.confirm({
      title: '비밀번호 초기화',
      content: (
        <div>
          <p>
            <strong>{center.name}</strong> 센터의 비밀번호를 초기화하시겠습니까?
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>* 임시 비밀번호가 생성됩니다.</p>
        </div>
      ),
      okText: '초기화',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          const result = await profileService.resetMemberPassword(center.id);
          Modal.success({
            title: '비밀번호 초기화 완료',
            content: (
              <div>
                <p>
                  <strong>{result.memberName}</strong> 센터의 비밀번호가 초기화되었습니다.
                </p>
                <p style={{ marginTop: '16px' }}>
                  임시 비밀번호:{' '}
                  <strong style={{ color: '#1890ff', fontSize: '18px' }}>
                    {result.tempPassword}
                  </strong>
                </p>
                <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>
                  * 이 비밀번호는 다시 확인할 수 없습니다. 반드시 메모해 주세요.
                </p>
              </div>
            ),
          });
        } catch (error: any) {
          message.error(error.message || '비밀번호 초기화에 실패했습니다.');
        }
      },
    });
  };

  // 회원 센터 해제
  const handleUnassignMember = async (memberId: number, memberName: string) => {
    Modal.confirm({
      title: '센터 지정 해제',
      content: (
        <div>
          <p>
            <strong>{memberName}</strong>님의 센터 지정을 해제하시겠습니까?
          </p>
          <p style={{ color: '#faad14', fontSize: '12px' }}>
            * 해당 회원은 미지정 회원 목록으로 이동됩니다.
          </p>
        </div>
      ),
      okText: '해제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          await membersService.unassignCenter(memberId);
          message.success(`${memberName}님의 센터 지정이 해제되었습니다.`);
          // 현재 확장된 센터 회원 목록 새로고침
          const refreshCenters = [...expandedRowKeys];
          for (const key of refreshCenters) {
            const center = centers.find((c) => c.id === key);
            if (center) {
              await fetchCenterMembers(center.name);
            }
          }
          // 통계 새로고침
          await fetchCenterStats();
          // 미지정 탭이 활성화되어 있으면 새로고침
          if (activeTab === 'unassigned') {
            await fetchUnassignedMembers(unassignedPagination.current);
          }
        } catch (error: any) {
          message.error(error.message || '센터 해제에 실패했습니다.');
        }
      },
    });
  };

  // 센터 지정 성공 처리
  const handleAssignSuccess = () => {
    setAssignModalVisible(false);
    setSelectedRowKeys([]);
    setSelectedMemberNames([]);
    message.success('센터 지정이 완료되었습니다.');
    fetchUnassignedMembers(unassignedPagination.current);
    fetchCenterStats();
    // 확장된 센터 회원 목록도 새로고침
    for (const key of expandedRowKeys) {
      const center = centers.find((c) => c.id === key);
      if (center) {
        fetchCenterMembers(center.name);
      }
    }
  };

  // 센터에 회원 추가 모달 열기
  const openAddMemberToCenter = (centerName: string) => {
    setTargetCenterForAdd(centerName);
    setAddMemberToCenterVisible(true);
  };

  // 센터에 회원 추가 성공 처리
  const handleAddMemberToCenterSuccess = () => {
    setAddMemberToCenterVisible(false);
    setTargetCenterForAdd(null);
    // 해당 센터 회원 목록 새로고침
    if (targetCenterForAdd) {
      fetchCenterMembers(targetCenterForAdd);
    }
    fetchCenterStats();
  };

  // 센터 회원 수정 모달 열기
  const openEditCenterMember = (member: CenterMember) => {
    setEditingCenterMember(member);
    memberEditForm.setFieldsValue({
      name: member.name,
      phone: member.phone || '',
    });
    setEditCenterMemberVisible(true);
  };

  // 센터 회원 수정 처리
  const handleEditCenterMember = async (values: { name: string; phone: string }) => {
    if (!editingCenterMember) return;

    try {
      await membersService.updateMember(editingCenterMember.id, {
        name: values.name,
        phone: values.phone || undefined,
      });
      message.success('회원 정보가 수정되었습니다.');
      setEditCenterMemberVisible(false);
      setEditingCenterMember(null);
      // 확장된 센터 회원 목록 새로고침
      for (const key of expandedRowKeys) {
        const center = centers.find((c) => c.id === key);
        if (center) {
          fetchCenterMembers(center.name);
        }
      }
    } catch (error: any) {
      message.error(error.message || '회원 정보 수정에 실패했습니다.');
    }
  };

  // 센터 회원 삭제 모달 열기
  const openDeleteCenterMember = (memberId: number) => {
    setDeletingCenterMemberId(memberId);
    setDeleteCenterMemberVisible(true);
  };

  // 센터 회원 삭제 성공 처리
  const handleDeleteCenterMemberSuccess = () => {
    setDeleteCenterMemberVisible(false);
    setDeletingCenterMemberId(null);
    // 확장된 센터 회원 목록 새로고침
    for (const key of expandedRowKeys) {
      const center = centers.find((c) => c.id === key);
      if (center) {
        fetchCenterMembers(center.name);
      }
    }
    fetchCenterStats();
  };

  // 행 확장 처리
  const handleExpand = (expanded: boolean, record: Member) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.id]);
      fetchCenterMembers(record.name);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.id));
    }
  };

  // 선택 변경 처리
  const onSelectChange = (newSelectedRowKeys: React.Key[], selectedRows: CenterMember[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    setSelectedMemberNames(selectedRows.map((row) => row.name));
  };

  useEffect(() => {
    fetchCenters(pagination.current);
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'unassigned') {
      fetchUnassignedMembers(1);
    }
  }, [activeTab]);

  // 센터명으로 회원 수 찾기
  const getMemberCount = (centerName: string): number => {
    const stat = centerStats?.centers.find((c) => c.centerName === centerName);
    return stat?.memberCount || 0;
  };

  // 센터 테이블 컬럼 정의
  const centerColumns: ColumnsType<Member> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '센터명',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string) => (
        <Space>
          <ShopOutlined style={{ color: '#eb2f96' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Badge
            count={getMemberCount(text)}
            style={{ backgroundColor: '#1890ff' }}
            overflowCount={999}
          />
        </Space>
      ),
    },
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '-',
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
      title: '예금주',
      dataIndex: 'accountHolder',
      key: 'accountHolder',
      width: 100,
      render: (accountHolder: string | null) => accountHolder || '-',
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '활성' : '비활성'}</Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
    {
      title: '작업',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: Member) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            수정
          </Button>
          <Button type="text" icon={<LockOutlined />} onClick={() => handleResetPassword(record)}>
            PW
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteClick(record.id)}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  // 확장 행 내부 회원 테이블 컬럼
  const expandedMemberColumns: ColumnsType<CenterMember> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '등급',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      render: (grade: string) => (
        <Tag color={grade === 'AGENT' ? 'blue' : 'default'}>{GRADE_LABELS[grade] || grade}</Tag>
      ),
    },
    {
      title: '누적PV',
      dataIndex: 'cumulativePv',
      key: 'cumulativePv',
      width: 120,
      render: (pv: number) => pv.toLocaleString(),
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      render: (_: any, record: CenterMember) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openEditCenterMember(record);
            }}
          >
            수정
          </Button>
          <Button
            type="text"
            danger
            icon={<MinusCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleUnassignMember(record.id, record.name);
            }}
          >
            해제
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openDeleteCenterMember(record.id);
            }}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  // 미지정 회원 테이블 컬럼
  const unassignedColumns: ColumnsType<CenterMember> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '아이디',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '등급',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      render: (grade: string) => (
        <Tag color={grade === 'AGENT' ? 'blue' : 'default'}>{GRADE_LABELS[grade] || grade}</Tag>
      ),
    },
    {
      title: '누적PV',
      dataIndex: 'cumulativePv',
      key: 'cumulativePv',
      width: 120,
      render: (pv: number) => pv.toLocaleString(),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ko-KR'),
    },
  ];

  // 확장 행 렌더링
  const expandedRowRender = (record: Member) => {
    const members = expandedCenterMembers[record.name] || [];
    const isLoading = expandedCenterLoading[record.name] || false;

    return (
      <div style={{ padding: '16px 0' }}>
        <div
          style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text strong>
            <TeamOutlined style={{ marginRight: 8 }} />
            {record.name} 소속 회원 ({members.length}명)
          </Text>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openAddMemberToCenter(record.name);
            }}
            style={{ background: '#1890ff', borderColor: '#1890ff' }}
          >
            회원 추가
          </Button>
        </div>
        <Table
          columns={expandedMemberColumns}
          dataSource={members}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: '소속 회원이 없습니다' }}
        />
      </div>
    );
  };

  // 행 선택 설정
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

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
            <ShopOutlined style={{ color: '#eb2f96' }} /> 센터 관리
          </Title>
          <Text type="secondary">센터 목록 조회 및 회원 관리</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setAddCenterModalVisible(true)}
          style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
        >
          센터 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="전체 센터"
              value={pagination.total}
              prefix={<ShopOutlined style={{ color: '#eb2f96' }} />}
              suffix="개"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="활성 센터"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix="개"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="센터 소속 회원"
              value={(centerStats?.totalMembers || 0) - (centerStats?.unassignedCount || 0)}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="미지정 회원"
              value={centerStats?.unassignedCount || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<CloseCircleOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      {/* 탭 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <ShopOutlined />
                센터 목록
              </span>
            }
            key="centers"
          >
            {/* 검색 및 필터 */}
            <Space size="middle" wrap style={{ marginBottom: 16 }}>
              <Input
                placeholder="센터명 또는 아이디 검색"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                allowClear
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select
                placeholder="상태 필터"
                style={{ width: 150 }}
                allowClear
                onChange={(value) => setFilters({ ...filters, isActive: value })}
              >
                <Select.Option value={true}>활성</Select.Option>
                <Select.Option value={false}>비활성</Select.Option>
              </Select>
              <Button onClick={() => fetchCenters(1)}>새로고침</Button>
            </Space>

            {/* 센터 테이블 */}
            <Table
              columns={centerColumns}
              dataSource={centers}
              loading={loading}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개`,
              }}
              onChange={(p) => fetchCenters(p.current || 1)}
              scroll={{ x: 1400 }}
              expandable={{
                expandedRowRender,
                expandedRowKeys,
                onExpand: handleExpand,
                expandRowByClick: true,
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                미지정 회원
                <Badge
                  count={centerStats?.unassignedCount || 0}
                  style={{ marginLeft: 8, backgroundColor: '#faad14' }}
                  overflowCount={999}
                />
              </span>
            }
            key="unassigned"
          >
            {/* 검색 및 일괄 지정 */}
            <Space
              size="middle"
              wrap
              style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}
            >
              <Space>
                <Input
                  placeholder="이름 또는 아이디 검색"
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                  allowClear
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  onPressEnter={() => fetchUnassignedMembers(1)}
                />
                <Button onClick={() => fetchUnassignedMembers(1)}>검색</Button>
              </Space>
              <Button
                type="primary"
                icon={<ShopOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => setAssignModalVisible(true)}
                style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
              >
                선택 회원 센터 지정 ({selectedRowKeys.length}명)
              </Button>
            </Space>

            {/* 미지정 회원 테이블 */}
            <Table
              rowSelection={rowSelection}
              columns={unassignedColumns}
              dataSource={unassignedMembers}
              loading={loading}
              rowKey="id"
              pagination={{
                ...unassignedPagination,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}명`,
              }}
              onChange={(p) => fetchUnassignedMembers(p.current || 1)}
              scroll={{ x: 900 }}
              locale={{ emptyText: '미지정 회원이 없습니다' }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 센터 수정 모달 */}
      <Modal
        title={
          <span>
            <ShopOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
            센터 정보 수정
          </span>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        width={600}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item
            name="name"
            label="센터명"
            rules={[{ required: true, message: '센터명을 입력해주세요' }]}
          >
            <Input prefix={<ShopOutlined style={{ color: '#eb2f96' }} />} />
          </Form.Item>
          <Form.Item name="phone" label="전화번호">
            <Input placeholder="010-1234-5678" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="bankName" label="은행">
                <Select placeholder="은행 선택" showSearch optionFilterProp="children" allowClear>
                  {KOREAN_BANKS.map((bank) => (
                    <Select.Option key={bank} value={bank}>
                      {bank}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="accountNumber" label="계좌번호">
                <Input placeholder="123-456-789012" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="accountHolder" label="예금주">
            <Input placeholder="예금주 이름" />
          </Form.Item>
          <Form.Item name="isActive" label="활성 상태">
            <Select>
              <Select.Option value={true}>활성</Select.Option>
              <Select.Option value={false}>비활성</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 센터 추가 모달 */}
      <AddCenterModal
        visible={addCenterModalVisible}
        onCancel={() => setAddCenterModalVisible(false)}
        onSuccess={() => {
          setAddCenterModalVisible(false);
          fetchCenters(1);
        }}
      />

      {/* 센터 삭제 확인 모달 */}
      <DeleteMemberModal
        visible={deleteModalVisible}
        memberId={deletingCenterId}
        onCancel={handleDeleteCancel}
        onSuccess={handleDeleteSuccess}
      />

      {/* 센터 일괄 지정 모달 */}
      <AssignCenterModal
        visible={assignModalVisible}
        selectedMemberIds={selectedRowKeys.map((key) => Number(key))}
        selectedMemberNames={selectedMemberNames}
        onCancel={() => setAssignModalVisible(false)}
        onSuccess={handleAssignSuccess}
      />

      {/* 센터에 회원 추가 모달 */}
      <AddMemberToCenterModal
        visible={addMemberToCenterVisible}
        centerName={targetCenterForAdd || ''}
        onCancel={() => {
          setAddMemberToCenterVisible(false);
          setTargetCenterForAdd(null);
        }}
        onSuccess={handleAddMemberToCenterSuccess}
      />

      {/* 센터 회원 정보 수정 모달 */}
      <Modal
        title={
          <span>
            <UserOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            회원 정보 수정
          </span>
        }
        open={editCenterMemberVisible}
        onCancel={() => {
          setEditCenterMemberVisible(false);
          setEditingCenterMember(null);
          memberEditForm.resetFields();
        }}
        onOk={() => memberEditForm.submit()}
        okText="저장"
        cancelText="취소"
        width={500}
      >
        <Form form={memberEditForm} onFinish={handleEditCenterMember} layout="vertical">
          <Form.Item
            name="name"
            label="이름"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="phone" label="전화번호">
            <Input placeholder="010-1234-5678" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 센터 회원 삭제 모달 */}
      <DeleteMemberModal
        visible={deleteCenterMemberVisible}
        memberId={deletingCenterMemberId}
        onCancel={() => {
          setDeleteCenterMemberVisible(false);
          setDeletingCenterMemberId(null);
        }}
        onSuccess={handleDeleteCenterMemberSuccess}
      />
    </div>
  );
}
