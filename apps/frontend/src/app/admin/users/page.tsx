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
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Descriptions,
  Tabs,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  ApartmentOutlined,
  RiseOutlined,
  LockOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { membersService, Member } from '@/services/members.service';
import type { MemberDetailResponse } from '@/services/members.service';
import { profileService } from '@/services/profile.service';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';
import DeleteMemberModal from '@/components/DeleteMemberModal';
import AddMemberModal from '@/components/AddMemberModal';
import MemberMyPagePreviewDrawer from '@/components/MemberMyPagePreview';
import RollbackMemberModal from '@/components/RollbackMemberModal';

const { Title, Text } = Typography;

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    grade?: string;
    search?: string;
  }>({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    divisionChief: 0,
    branchChief: 0,
    manager: 0,
    agent: 0,
  });

  // 모달 상태
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [gradeChangeModalVisible, setGradeChangeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [myPagePreviewVisible, setMyPagePreviewVisible] = useState(false);
  const [myPagePreviewMemberId, setMyPagePreviewMemberId] = useState<number | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [rollbackMemberId, setRollbackMemberId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDetailResponse | null>(null);
  const [centerOptions, setCenterOptions] = useState<string[]>([]);
  const [centerLoading, setCenterLoading] = useState(false);
  const [form] = Form.useForm();
  const [gradeForm] = Form.useForm();

  // 회원 목록 조회
  const fetchMembers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await membersService.getMembers({
        page,
        limit: pagination.pageSize,
        ...filters,
      });

      setMembers(response.data);
      setPagination({
        current: page,
        pageSize: pagination.pageSize,
        total: response.meta.total,
      });

      // 통계 계산
      calculateStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      message.error(error.message || '회원 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = (data: Member[]) => {
    const totalActive = data.filter((m) => m.isActive).length;
    const divisionChief = data.filter((m) => m.grade === 'DIVISION_CHIEF').length;
    const branchChief = data.filter((m) => m.grade === 'BRANCH_CHIEF').length;
    const manager = data.filter((m) => m.grade === 'MANAGER').length;
    const agent = data.filter((m) => m.grade === 'AGENT').length;

    setStats({
      total: data.length,
      active: totalActive,
      divisionChief,
      branchChief,
      manager,
      agent,
    });
  };

  // 센터 목록 조회
  const fetchCenters = async () => {
    try {
      setCenterLoading(true);
      const response = await membersService.getCenterStats();
      const centers = response.centers.map((c) => c.centerName);
      setCenterOptions(centers);
    } catch (error: any) {
      console.error('Failed to fetch centers:', error);
    } finally {
      setCenterLoading(false);
    }
  };

  // 회원 상세 조회
  const viewMemberDetail = async (id: number) => {
    try {
      const member = await membersService.getMember(id);
      setSelectedMember(member);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error('회원 정보를 불러오는데 실패했습니다.');
    }
  };

  // 회원 수정 모달 열기
  const openEditModal = (member: Member) => {
    setSelectedMember(member as MemberDetailResponse);
    form.setFieldsValue({
      name: member.name,
      phone: member.phone,
      birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : null,
      postalCode: member.postalCode,
      address: member.address,
      addressDetail: member.addressDetail,
      bankName: member.bankName,
      accountNumber: member.accountNumber,
      accountHolder: member.accountHolder,
      recommenderId: member.recommenderId,
      sponsorId: member.sponsorId,
      teamLine: member.teamLine,
      centerName: member.centerName,
      isActive: member.isActive,
    });
    fetchCenters();
    setEditModalVisible(true);
  };

  // 회원 정보 수정
  const handleEdit = async (values: any) => {
    if (!selectedMember) return;

    try {
      await membersService.updateMember(selectedMember.id, values);
      message.success('회원 정보가 수정되었습니다.');
      setEditModalVisible(false);
      fetchMembers(pagination.current);
    } catch (error: any) {
      message.error(error.message || '회원 정보 수정에 실패했습니다.');
    }
  };

  // 회원 삭제 모달 열기
  const handleDeleteClick = (id: number) => {
    setDeletingMemberId(id);
    setDeleteModalVisible(true);
  };

  // 회원 삭제 성공 처리
  const handleDeleteSuccess = () => {
    setDeleteModalVisible(false);
    setDeletingMemberId(null);
    fetchMembers(pagination.current);
  };

  // 회원 삭제 취소 처리
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeletingMemberId(null);
  };

  // 등급 변경 모달 열기
  const openGradeChangeModal = (member: Member) => {
    setSelectedMember(member as MemberDetailResponse);
    gradeForm.setFieldsValue({ grade: member.grade });
    setGradeChangeModalVisible(true);
  };

  // 등급 변경
  const handleGradeChange = async (values: { grade: string }) => {
    if (!selectedMember) return;

    try {
      await membersService.changeGrade(selectedMember.id, values.grade);
      message.success('회원 등급이 변경되었습니다.');
      setGradeChangeModalVisible(false);
      fetchMembers(pagination.current);
    } catch (error: any) {
      message.error(error.message || '등급 변경에 실패했습니다.');
    }
  };

  // 승급 처리
  const handlePromotion = async (id: number) => {
    try {
      const result = await membersService.promote(id);
      if (result.success) {
        message.success(result.message);
        fetchMembers(pagination.current);
      } else {
        message.warning(result.message);
      }
    } catch (error: any) {
      message.error(error.message || '승급 처리에 실패했습니다.');
    }
  };

  // 비밀번호 초기화
  const handleResetPassword = async (member: Member) => {
    Modal.confirm({
      title: '비밀번호 초기화',
      content: (
        <div>
          <p>
            <strong>{member.name}</strong>님의 비밀번호를 초기화하시겠습니까?
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            * 임시 비밀번호가 생성되며, 해당 회원에게 전달해 주세요.
          </p>
        </div>
      ),
      okText: '초기화',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          const result = await profileService.resetMemberPassword(member.id);
          Modal.success({
            title: '비밀번호 초기화 완료',
            content: (
              <div>
                <p>
                  <strong>{result.memberName}</strong>님의 비밀번호가 초기화되었습니다.
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

  // 마이페이지 프리뷰 열기
  const openMyPagePreview = (memberId: number) => {
    setMyPagePreviewMemberId(memberId);
    setMyPagePreviewVisible(true);
  };

  // 마이페이지 프리뷰 닫기
  const closeMyPagePreview = () => {
    setMyPagePreviewVisible(false);
    setMyPagePreviewMemberId(null);
  };

  // 롤백 모달 열기
  const openRollbackModal = (memberId: number) => {
    setRollbackMemberId(memberId);
    setRollbackModalVisible(true);
  };

  // 롤백 성공 처리
  const handleRollbackSuccess = () => {
    setRollbackModalVisible(false);
    setRollbackMemberId(null);
    fetchMembers(pagination.current);
  };

  // 롤백 취소 처리
  const handleRollbackCancel = () => {
    setRollbackModalVisible(false);
    setRollbackMemberId(null);
  };

  useEffect(() => {
    fetchMembers(pagination.current);
  }, [filters]);

  // 테이블 컬럼 정의
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a: Member, b: Member) => a.id - b.id,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string, record: Member) => (
        <Button type="link" onClick={() => viewMemberDetail(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: '계정',
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
      title: '주소',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (_: any, record: Member) => {
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
      title: '예금주',
      dataIndex: 'accountHolder',
      key: 'accountHolder',
      width: 100,
      render: (accountHolder: string | null) => accountHolder || '-',
    },
    {
      title: '추천인',
      dataIndex: 'recommenderId',
      key: 'recommenderId',
      width: 100,
      render: (recommenderId: number | null, record: Member) => {
        if (!recommenderId) return '-';
        return (
          <Button
            type="link"
            onClick={() => viewMemberDetail(recommenderId)}
          >{`ID: ${recommenderId}`}</Button>
        );
      },
    },
    {
      title: '후원인',
      dataIndex: 'sponsorId',
      key: 'sponsorId',
      width: 100,
      render: (sponsorId: number | null, record: Member) => {
        if (!sponsorId) return '-';
        return (
          <Button
            type="link"
            onClick={() => viewMemberDetail(sponsorId)}
          >{`ID: ${sponsorId}`}</Button>
        );
      },
    },
    {
      title: '소속센터',
      dataIndex: 'centerName',
      key: 'centerName',
      width: 120,
      render: (centerName: string | null) =>
        centerName ? (
          <Tag color="processing">{centerName}</Tag>
        ) : (
          <span style={{ color: '#999' }}>미지정</span>
        ),
    },
    {
      title: '팀라인',
      dataIndex: 'teamLine',
      key: 'teamLine',
      width: 80,
      render: (teamLine: number | null) =>
        teamLine ? <Tag color="default">{teamLine}팀</Tag> : '-',
    },
    {
      title: '작업',
      key: 'actions',
      width: 400,
      fixed: 'right' as const,
      render: (_: any, record: Member) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => openMyPagePreview(record.id)}
            style={{ color: '#E53935' }}
          >
            마이페이지
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            수정
          </Button>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => openRollbackModal(record.id)}
            style={{ color: '#1890ff' }}
          >
            롤백
          </Button>
          <Button type="text" icon={<RiseOutlined />} onClick={() => openGradeChangeModal(record)}>
            등급
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
            <UserOutlined /> 회원 관리
          </Title>
          <Text type="secondary">전체 회원 목록 조회 및 관리</Text>
        </div>
        <Space>
          <Link href="/admin/users/rollback-history">
            <Button
              icon={<HistoryOutlined />}
              size="large"
            >
              롤백 이력
            </Button>
          </Link>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setAddMemberModalVisible(true)}
          >
            회원 추가
          </Button>
        </Space>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="전체 회원"
              value={pagination.total}
              prefix={<TeamOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="본부장"
              value={stats.divisionChief}
              valueStyle={{ color: MemberGradeColors.DIVISION_CHIEF }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="지부장"
              value={stats.branchChief}
              valueStyle={{ color: MemberGradeColors.BRANCH_CHIEF }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="매니저"
              value={stats.manager}
              valueStyle={{ color: MemberGradeColors.MANAGER }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title="에이전트"
              value={stats.agent}
              valueStyle={{ color: MemberGradeColors.AGENT }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      {/* 검색 및 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="이름 또는 아이디 검색"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            placeholder="등급 필터"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, grade: value })}
          >
            <Select.Option value="ADMIN">최고관리자</Select.Option>
            <Select.Option value="DIVISION_CHIEF">본부장</Select.Option>
            <Select.Option value="BRANCH_CHIEF">지부장</Select.Option>
            <Select.Option value="MANAGER">매니저</Select.Option>
            <Select.Option value="AGENT">에이전트</Select.Option>
            <Select.Option value="MEMBER">회원</Select.Option>
          </Select>
          <Button onClick={() => fetchMembers(1)}>새로고침</Button>
        </Space>
      </Card>

      {/* 회원 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={members}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}명`,
          }}
          onChange={(p) => fetchMembers(p.current || 1)}
          scroll={{ x: 2000 }}
        />
      </Card>

      {/* 회원 상세 모달 */}
      <Modal
        title="회원 상세 정보"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Link key="org" href={`/organization?memberId=${selectedMember?.id}`}>
            <Button icon={<ApartmentOutlined />}>조직도 보기</Button>
          </Link>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              if (selectedMember) openEditModal(selectedMember as Member);
            }}
          >
            정보 수정
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            닫기
          </Button>,
        ]}
        width={800}
      >
        {selectedMember && (
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '기본 정보',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="ID">{selectedMember.id}</Descriptions.Item>
                    <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
                    <Descriptions.Item label="이메일">{selectedMember.email}</Descriptions.Item>
                    <Descriptions.Item label="생년월일">
                      {selectedMember.birthDate
                        ? new Date(selectedMember.birthDate).toLocaleDateString('ko-KR')
                        : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="전화번호">
                      {selectedMember.phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="등급">
                      <Tag
                        color={
                          MemberGradeColors[selectedMember.grade as keyof typeof MemberGradeColors]
                        }
                      >
                        {MemberGradeLabels[selectedMember.grade as keyof typeof MemberGradeLabels]}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="상태">
                      <Tag color={selectedMember.isActive ? 'success' : 'default'}>
                        {selectedMember.isActive ? '활성' : '비활성'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="주소" span={2}>
                      {selectedMember.postalCode && `(${selectedMember.postalCode}) `}
                      {selectedMember.address} {selectedMember.addressDetail}
                    </Descriptions.Item>
                    <Descriptions.Item label="은행">
                      {selectedMember.bankName || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="계좌번호">
                      {selectedMember.accountNumber || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="예금주">
                      {selectedMember.accountHolder || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="누적 PV">
                      {selectedMember.cumulativePv.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="가입일">
                      {new Date(selectedMember.createdAt).toLocaleString('ko-KR')}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'org',
                label: '조직 정보',
                children: (
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="추천인">
                      {selectedMember.recommender
                        ? `${selectedMember.recommender.name} (${selectedMember.recommender.email})`
                        : '없음'}
                    </Descriptions.Item>
                    <Descriptions.Item label="후원인">
                      {selectedMember.sponsor
                        ? `${selectedMember.sponsor.name} (${selectedMember.sponsor.email})`
                        : '없음'}
                    </Descriptions.Item>
                    <Descriptions.Item label="소속센터">
                      {selectedMember.centerName ? (
                        <Tag color="processing">{selectedMember.centerName}</Tag>
                      ) : (
                        <span style={{ color: '#999' }}>미지정</span>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="팀라인">
                      {selectedMember.teamLine ? (
                        <Tag color="default">{selectedMember.teamLine}팀</Tag>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="직속 하위 (후원계보)">
                      {selectedMember.sponsorees && selectedMember.sponsorees.length > 0 ? (
                        <div>
                          <span style={{ marginRight: 8, fontWeight: 'bold' }}>
                            {selectedMember.sponsorees.length}명
                          </span>
                          <Collapse
                            ghost
                            size="small"
                            items={[
                              {
                                key: '1',
                                label: '목록 보기',
                                children: (
                                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {selectedMember.sponsorees.map((s) => (
                                      <li key={s.id}>
                                        <Button
                                          type="link"
                                          size="small"
                                          style={{ padding: 0 }}
                                          onClick={() => viewMemberDetail(s.id)}
                                        >
                                          {s.name}
                                        </Button>{' '}
                                        ({s.email}) - {s.grade}
                                      </li>
                                    ))}
                                  </ul>
                                ),
                              },
                            ]}
                          />
                        </div>
                      ) : (
                        '없음'
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* 회원 수정 모달 */}
      <Modal
        title="회원 정보 수정"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="저장"
        cancelText="취소"
        width={600}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item name="name" label="이름" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="birthDate" label="생년월일">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="phone" label="전화번호">
            <Input placeholder="010-1234-5678" />
          </Form.Item>
          <Form.Item name="postalCode" label="우편번호">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="주소">
            <Input />
          </Form.Item>
          <Form.Item name="addressDetail" label="상세 주소">
            <Input />
          </Form.Item>
          <Form.Item name="bankName" label="은행">
            <Input placeholder="예: 국민은행" />
          </Form.Item>
          <Form.Item name="accountNumber" label="계좌번호">
            <Input placeholder="예: 123-456-789012" />
          </Form.Item>
          <Form.Item name="accountHolder" label="예금주">
            <Input placeholder="예금주 이름" />
          </Form.Item>
          <Form.Item name="recommenderId" label="추천인 ID">
            <Input type="number" placeholder="추천인 회원 ID" />
          </Form.Item>
          <Form.Item name="sponsorId" label="후원인 ID">
            <Input type="number" placeholder="후원인 회원 ID" />
          </Form.Item>
          <Form.Item name="centerName" label="소속센터">
            <Select
              placeholder="센터 선택"
              allowClear
              loading={centerLoading}
              showSearch
              optionFilterProp="children"
            >
              {centerOptions.map((center) => (
                <Select.Option key={center} value={center}>
                  {center}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="teamLine" label="팀라인">
            <Select placeholder="팀라인 선택" allowClear>
              <Select.Option value={1}>1팀</Select.Option>
              <Select.Option value={2}>2팀</Select.Option>
              <Select.Option value={3}>3팀</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="활성 상태" valuePropName="checked">
            <Select>
              <Select.Option value={true}>활성</Select.Option>
              <Select.Option value={false}>비활성</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 등급 변경 모달 */}
      <Modal
        title="회원 등급 변경"
        open={gradeChangeModalVisible}
        onCancel={() => setGradeChangeModalVisible(false)}
        onOk={() => gradeForm.submit()}
        okText="변경"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <Form form={gradeForm} onFinish={handleGradeChange} layout="vertical">
          <Form.Item name="grade" label="등급" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="ADMIN">최고관리자</Select.Option>
              <Select.Option value="DIVISION_CHIEF">본부장</Select.Option>
              <Select.Option value="BRANCH_CHIEF">지부장</Select.Option>
              <Select.Option value="MANAGER">매니저</Select.Option>
              <Select.Option value="AGENT">에이전트</Select.Option>
              <Select.Option value="MEMBER">회원</Select.Option>
            </Select>
          </Form.Item>
          <Text type="warning">⚠️ 등급을 변경하면 해당 회원의 권한과 수당 구조가 변경됩니다.</Text>
        </Form>
      </Modal>

      {/* 회원 삭제 확인 모달 */}
      <DeleteMemberModal
        visible={deleteModalVisible}
        memberId={deletingMemberId}
        onCancel={handleDeleteCancel}
        onSuccess={handleDeleteSuccess}
      />

      {/* 회원 추가 모달 */}
      <AddMemberModal
        visible={addMemberModalVisible}
        onCancel={() => setAddMemberModalVisible(false)}
        onSuccess={() => {
          setAddMemberModalVisible(false);
          fetchMembers(1);
        }}
      />

      {/* 마이페이지 프리뷰 Drawer */}
      <MemberMyPagePreviewDrawer
        visible={myPagePreviewVisible}
        memberId={myPagePreviewMemberId}
        onClose={closeMyPagePreview}
        onMemberUpdate={() => fetchMembers(pagination.current)}
      />

      {/* 롤백 모달 */}
      <RollbackMemberModal
        visible={rollbackModalVisible}
        memberId={rollbackMemberId}
        onCancel={handleRollbackCancel}
        onSuccess={handleRollbackSuccess}
      />
    </div>
  );
}
