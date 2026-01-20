'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  Descriptions,
  Spin,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

const { Option } = Select;
const { TextArea } = Input;

// 등급 라벨 및 색상
const GRADE_CONFIG: Record<string, { label: string; color: string }> = {
  MEMBER: { label: '회원', color: 'default' },
  AGENT: { label: '에이전트', color: 'blue' },
  MANAGER: { label: '매니저', color: 'green' },
  BRANCH_CHIEF: { label: '지부장', color: 'gold' },
  DIVISION_CHIEF: { label: '본부장', color: 'orange' },
  CENTER: { label: '센터', color: 'purple' },
  ADMIN: { label: '관리자', color: 'red' },
};

// 상태 라벨 및 색상
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'green' },
  EXPIRED: { label: '만료', color: 'default' },
  CANCELLED: { label: '취소', color: 'red' },
};

// 인정 가능한 등급 (등급 인정용)
const GRADE_RECOGNIZABLE_GRADES = ['AGENT', 'MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'];

// 인정 가능한 등급 (판권 인정용 - AGENT 제외)
const LICENSE_RECOGNIZABLE_GRADES = ['MANAGER', 'BRANCH_CHIEF', 'DIVISION_CHIEF'];

// Props 타입
interface RecognizedSalesTabProps {
  recognitionType: 'GRADE' | 'LICENSE';
}

interface Member {
  id: number;
  username: string;
  name: string;
  grade: string;
  isActive: boolean;
}

interface RecognizedSales {
  id: number;
  memberId: number;
  recognizedGrade: string;
  status: string;
  reason: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  member: {
    id: number;
    username: string;
    name: string;
    grade: string;
  };
  creator: {
    id: number;
    name: string;
  };
  deactivator?: {
    id: number;
    name: string;
  };
}

interface RecognizedSalesResponse {
  data: RecognizedSales[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RecognizedSalesTab({ recognitionType }: RecognizedSalesTabProps) {
  // 인정 유형에 따른 레이블 및 설정
  const isLicense = recognitionType === 'LICENSE';
  const typeLabel = isLicense ? '인정판권' : '인정매출';
  const recognizableGrades = isLicense ? LICENSE_RECOGNIZABLE_GRADES : GRADE_RECOGNIZABLE_GRADES;

  const [data, setData] = useState<RecognizedSales[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 검색 필터
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [gradeFilter, setGradeFilter] = useState<string | undefined>();

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecognizedSales | null>(null);

  // 폼
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // 회원 검색
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchData();
  }, [page, limit, searchText, statusFilter, gradeFilter, recognitionType]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit, recognitionType };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;
      if (gradeFilter) params.recognizedGrade = gradeFilter;

      const { data: response } = await api.get<RecognizedSalesResponse>(
        '/v1/recognized-sales',
        { params }
      );
      setData(response.data);
      setTotal(response.total);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(`${typeLabel} 목록 조회 실패: ` + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchValue.length < 1) {
      setMembers([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setMemberSearchLoading(true);
        const { data } = await api.get<{ data: Member[] }>('/v1/members/search', {
          params: { q: searchValue, limit: 20, isActive: true },
        });
        setMembers(data.data);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        message.error('회원 검색 실패: ' + (err.response?.data?.message || err.message));
        setMembers([]);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 300);
  };

  const handleMemberChange = (memberId: number) => {
    if (!memberId) {
      setSelectedMember(null);
      return;
    }
    const member = members.find((m) => m.id === memberId);
    setSelectedMember(member || null);
  };

  const handleCreate = async (values: {
    memberId: number;
    recognizedGrade: string;
    startDate: dayjs.Dayjs;
    endDate?: dayjs.Dayjs;
    reason?: string;
  }) => {
    setCreateLoading(true);
    try {
      await api.post('/v1/recognized-sales', {
        memberId: values.memberId,
        recognizedGrade: values.recognizedGrade,
        recognitionType: recognitionType,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        reason: values.reason,
      });
      message.success(`${typeLabel}이 등록되었습니다.`);
      setCreateModalOpen(false);
      createForm.resetFields();
      setSelectedMember(null);
      setMembers([]);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(`${typeLabel} 등록 실패: ` + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (values: { endDate?: dayjs.Dayjs; reason?: string }) => {
    if (!selectedRecord) return;
    setEditLoading(true);
    try {
      await api.patch(`/v1/recognized-sales/${selectedRecord.id}`, {
        endDate: values.endDate?.format('YYYY-MM-DD'),
        reason: values.reason,
      });
      message.success(`${typeLabel}이 수정되었습니다.`);
      setEditModalOpen(false);
      editForm.resetFields();
      setSelectedRecord(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(`${typeLabel} 수정 실패: ` + (err.response?.data?.message || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/v1/recognized-sales/${id}/cancel`);
      message.success(`${typeLabel}이 취소되었습니다.`);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(`${typeLabel} 취소 실패: ` + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (record: RecognizedSales) => {
    setSelectedRecord(record);
    editForm.setFieldsValue({
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
      reason: record.reason,
    });
    setEditModalOpen(true);
  };

  const columns: ColumnsType<RecognizedSales> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '회원',
      key: 'member',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.member.name}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.member.username} (ID: {record.member.id})
          </div>
        </div>
      ),
    },
    {
      title: '실제 등급',
      dataIndex: ['member', 'grade'],
      key: 'actualGrade',
      render: (grade: string) => (
        <Tag color={GRADE_CONFIG[grade]?.color || 'default'}>
          {GRADE_CONFIG[grade]?.label || grade}
        </Tag>
      ),
    },
    {
      title: '인정 등급',
      dataIndex: 'recognizedGrade',
      key: 'recognizedGrade',
      render: (grade: string) => (
        <Tag color={GRADE_CONFIG[grade]?.color || 'default'}>
          {GRADE_CONFIG[grade]?.label || grade}
        </Tag>
      ),
    },
    {
      title: '기간',
      key: 'period',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startDate).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            ~ {record.endDate ? dayjs(record.endDate).format('YYYY-MM-DD') : '무기한'}
          </div>
        </div>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_CONFIG[status]?.color || 'default'}>
          {STATUS_CONFIG[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: '등록자',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '액션',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'ACTIVE' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              >
                수정
              </Button>
              <Popconfirm
                title={`${typeLabel} 취소`}
                description={`정말 이 ${typeLabel}을 취소하시겠습니까?`}
                onConfirm={() => handleCancel(record.id)}
                okText="취소"
                cancelText="닫기"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" size="small" danger icon={<StopOutlined />}>
                  취소
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="회원 이름/아이디 검색"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="인정 등급"
              style={{ width: '100%' }}
              value={gradeFilter}
              onChange={setGradeFilter}
              allowClear
            >
              {recognizableGrades.map((grade) => (
                <Option key={grade} value={grade}>
                  {GRADE_CONFIG[grade]?.label || grade}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="상태"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              {typeLabel} 등록
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
            onChange: (newPage, newLimit) => {
              setPage(newPage);
              if (newLimit !== limit) setLimit(newLimit);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 등록 모달 */}
      <Modal
        title={`${typeLabel} 등록`}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
          setSelectedMember(null);
          setMembers([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="회원 선택"
            name="memberId"
            rules={[{ required: true, message: '회원을 선택하세요' }]}
          >
            <Select
              placeholder="이름, 아이디 또는 ID로 검색"
              showSearch
              filterOption={false}
              onSearch={searchMembers}
              onChange={handleMemberChange}
              loading={memberSearchLoading}
              notFoundContent={
                memberSearchLoading ? <Spin size="small" /> : '검색 결과가 없습니다'
              }
              allowClear
            >
              {members.map((member) => (
                <Option key={member.id} value={member.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {member.name} ({member.username})
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      ID: {member.id} | {GRADE_CONFIG[member.grade]?.label || member.grade}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMember && (
            <Card
              size="small"
              style={{ marginBottom: 16, background: '#f0f5ff', borderColor: '#7CB342' }}
            >
              <Descriptions column={2} size="small" title="선택된 회원 정보">
                <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
                <Descriptions.Item label="아이디">{selectedMember.username}</Descriptions.Item>
                <Descriptions.Item label="현재 등급">
                  <Tag color={GRADE_CONFIG[selectedMember.grade]?.color}>
                    {GRADE_CONFIG[selectedMember.grade]?.label || selectedMember.grade}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Form.Item
            label="인정 등급"
            name="recognizedGrade"
            rules={[{ required: true, message: '인정 등급을 선택하세요' }]}
          >
            <Select placeholder="인정할 등급 선택">
              {recognizableGrades.map((grade) => (
                <Option key={grade} value={grade}>
                  {GRADE_CONFIG[grade]?.label || grade}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="시작일"
                name="startDate"
                rules={[{ required: true, message: '시작일을 선택하세요' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="시작일 선택" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="종료일 (미지정 시 무기한)" name="endDate">
                <DatePicker style={{ width: '100%' }} placeholder="종료일 선택 (선택)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="인정 사유" name="reason">
            <TextArea rows={3} placeholder="인정 사유를 입력하세요 (선택)" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModalOpen(false);
                  createForm.resetFields();
                  setSelectedMember(null);
                  setMembers([]);
                }}
              >
                취소
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                등록
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        title={`${typeLabel} 수정`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setSelectedRecord(null);
        }}
        footer={null}
        width={500}
      >
        {selectedRecord && (
          <Form form={editForm} layout="vertical" onFinish={handleEdit}>
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="회원">{selectedRecord.member.name}</Descriptions.Item>
                <Descriptions.Item label="아이디">
                  {selectedRecord.member.username}
                </Descriptions.Item>
                <Descriptions.Item label="실제 등급">
                  <Tag color={GRADE_CONFIG[selectedRecord.member.grade]?.color}>
                    {GRADE_CONFIG[selectedRecord.member.grade]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="인정 등급">
                  <Tag color={GRADE_CONFIG[selectedRecord.recognizedGrade]?.color}>
                    {GRADE_CONFIG[selectedRecord.recognizedGrade]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="시작일">
                  {dayjs(selectedRecord.startDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form.Item label="종료일 (미지정 시 무기한)" name="endDate">
              <DatePicker style={{ width: '100%' }} placeholder="종료일 선택 (선택)" />
            </Form.Item>

            <Form.Item label="인정 사유" name="reason">
              <TextArea rows={3} placeholder="인정 사유를 입력하세요 (선택)" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => {
                    setEditModalOpen(false);
                    editForm.resetFields();
                    setSelectedRecord(null);
                  }}
                >
                  취소
                </Button>
                <Button type="primary" htmlType="submit" loading={editLoading}>
                  수정
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
