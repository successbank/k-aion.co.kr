'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  message,
  Tag,
  Popconfirm,
  Tabs,
  Input,
  Divider,
  Row,
  Col,
  Checkbox,
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { api } from '@/lib/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Backend BonusType enum
type BonusType =
  | 'SALES'
  | 'SALES_MANAGEMENT'
  | 'LICENSE'
  | 'LICENSE_MANAGEMENT'
  | 'SHARING'
  | 'BRANCH_OPERATION';

// Backend MemberGrade enum
type MemberGrade =
  | 'MEMBER'
  | 'AGENT'
  | 'MANAGER'
  | 'BRANCH_CHIEF'
  | 'DIVISION_CHIEF'
  | 'CENTER'
  | 'ADMIN';

// Backend QualificationType enum
type QualificationType =
  | 'MINIMUM_GRADE'
  | 'TEAM_COUNT'
  | 'MIN_GRADE_COUNT'
  | 'MIN_MEMBERS_PER_TEAM'
  | 'OFFICE_FACILITY'
  | 'SAME_RANK_ONLY'
  | 'FIRST_GEN_ONLY';

// 센터 운영 보너스 발생 모드
type CenterBonusMode = 'PER_SALE' | 'MONTHLY';

interface CommissionRateTier {
  id?: number;
  applicableGrade: MemberGrade;
  amount: number;
  percentage?: number;
  tierOrder: number;
}

interface CommissionQualification {
  id?: number;
  qualificationType: QualificationType;
  requiredGrade?: MemberGrade;
  requiredCount?: number;
  requiredTeamCount?: number;
  minMembersPerTeam?: number;
  requiresOffice?: boolean;
  requiresSeminar?: boolean;
  requiresCorporation?: boolean;
  requiresTV?: boolean;
}

interface CommissionRate {
  id: number;
  bonusType: BonusType;
  name: string;
  nameKo: string;
  description?: string;
  baseAmount?: number;
  basePercentage?: number;
  basePv: number;
  isGradeTiered: boolean;
  isSameRankOnly: boolean;
  isFirstGenOnly: boolean;
  isDifferential: boolean;
  centerBonusMode?: CenterBonusMode;
  version: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  tiers?: CommissionRateTier[];
  qualifications?: CommissionQualification[];
  createdAt: string;
  updatedAt: string;
}

export default function CommissionRatesPage() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  const fetchCommissionRates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/v1/admin/commission-rates');
      setRates(data.data);
    } catch (error) {
      console.error('Failed to fetch commission rates:', error);
      message.error('수당률 조회에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRate(null);
    form.resetFields();
    form.setFieldsValue({
      basePv: 2000000,
      isGradeTiered: false,
      isSameRankOnly: false,
      isFirstGenOnly: false,
      isDifferential: false,
      isActive: true,
    });
    setModalVisible(true);
    setActiveTab('basic');
  };

  const handleEdit = (rate: CommissionRate) => {
    setEditingRate(rate);
    form.setFieldsValue({
      bonusType: rate.bonusType,
      name: rate.name,
      nameKo: rate.nameKo,
      description: rate.description,
      baseAmount: rate.baseAmount,
      basePercentage: rate.basePercentage,
      basePv: rate.basePv,
      isGradeTiered: rate.isGradeTiered,
      isSameRankOnly: rate.isSameRankOnly,
      isFirstGenOnly: rate.isFirstGenOnly,
      isDifferential: rate.isDifferential,
      centerBonusMode: rate.centerBonusMode || 'PER_SALE',
      isActive: rate.isActive,
      tiers: rate.tiers,
      qualifications: rate.qualifications,
    });
    setModalVisible(true);
    setActiveTab('basic');
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/v1/admin/commission-rates/${id}`);
      message.success('수당률이 삭제되었습니다');
      fetchCommissionRates();
    } catch (error) {
      console.error('Failed to delete commission rate:', error);
      message.error('수당률 삭제에 실패했습니다');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.post(`/v1/admin/commission-rates/${id}/activate`);
      message.success('수당률이 활성화되었습니다');
      fetchCommissionRates();
    } catch (error) {
      console.error('Failed to activate commission rate:', error);
      message.error('수당률 활성화에 실패했습니다');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.post(`/v1/admin/commission-rates/${id}/duplicate`);
      message.success('수당률이 복제되었습니다');
      fetchCommissionRates();
    } catch (error) {
      console.error('Failed to duplicate commission rate:', error);
      message.error('수당률 복제에 실패했습니다');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        basePv: values.basePv || 2000000,
      };

      if (editingRate) {
        await api.patch(`/v1/admin/commission-rates/${editingRate.id}`, payload);
        message.success('수당률이 수정되었습니다');
      } else {
        await api.post('/v1/admin/commission-rates', payload);
        message.success('수당률이 추가되었습니다');
      }

      setModalVisible(false);
      form.resetFields();
      fetchCommissionRates();
    } catch (error) {
      console.error('Failed to save commission rate:', error);
      message.error('수당률 저장에 실패했습니다');
    }
  };

  const bonusTypeLabels: Record<BonusType, string> = {
    SALES: '판매 보너스',
    SALES_MANAGEMENT: '판매 관리 보너스',
    LICENSE: '판권 보너스',
    LICENSE_MANAGEMENT: '판권관리 보너스',
    SHARING: '공유 보너스',
    BRANCH_OPERATION: '센터 운영 보너스',
  };

  const gradeLabels: Record<MemberGrade, string> = {
    MEMBER: '회원',
    AGENT: '에이전트',
    MANAGER: '매니저',
    BRANCH_CHIEF: '지부장',
    DIVISION_CHIEF: '본부장',
    CENTER: '센터',
    ADMIN: '최고관리자',
  };

  const bonusTypeColors: Record<BonusType, string> = {
    SALES: 'green',
    SALES_MANAGEMENT: 'blue',
    LICENSE: 'purple',
    LICENSE_MANAGEMENT: 'cyan',
    SHARING: 'orange',
    BRANCH_OPERATION: 'magenta',
  };

  const columns = [
    {
      title: '보너스 유형',
      dataIndex: 'bonusType',
      key: 'bonusType',
      render: (type: BonusType) => <Tag color={bonusTypeColors[type]}>{bonusTypeLabels[type]}</Tag>,
    },
    {
      title: '이름',
      dataIndex: 'nameKo',
      key: 'nameKo',
    },
    {
      title: '설정 타입',
      key: 'configType',
      render: (_: any, record: CommissionRate) => {
        const tags = [];
        if (record.isGradeTiered) {
          tags.push(<Tag key="tiered" color="gold">등급별 차등</Tag>);
        } else if (record.basePercentage) {
          tags.push(<Tag key="percent" color="blue">퍼센트</Tag>);
        } else {
          tags.push(<Tag key="fixed" color="green">고정 금액</Tag>);
        }
        // 센터 운영 보너스 모드 표시
        if (record.bonusType === 'BRANCH_OPERATION' && record.centerBonusMode) {
          const modeLabel = record.centerBonusMode === 'PER_SALE' ? '건별' : '월별';
          tags.push(<Tag key="mode" color="purple">{modeLabel}</Tag>);
        }
        return <>{tags}</>;
      },
    },
    {
      title: '금액 범위',
      key: 'amountRange',
      render: (_: any, record: CommissionRate) => {
        if (record.isGradeTiered && record.tiers && record.tiers.length > 0) {
          const amounts = record.tiers.map((t) => t.amount);
          const min = Math.min(...amounts);
          const max = Math.max(...amounts);
          return `${(min / 1000).toFixed(0)}K ~ ${(max / 1000).toFixed(0)}K`;
        }
        if (record.baseAmount) {
          return `${(record.baseAmount / 1000).toFixed(0)}K`;
        }
        if (record.basePercentage) {
          return `${record.basePercentage}%`;
        }
        return '-';
      },
    },
    {
      title: '자격 조건',
      key: 'qualifications',
      render: (_: any, record: CommissionRate) => {
        if (!record.qualifications || record.qualifications.length === 0) {
          return <Text type="secondary">없음</Text>;
        }
        return <Text>{record.qualifications.length}개 조건</Text>;
      },
    },
    {
      title: '버전',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => `v${version}`,
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? '활성' : '비활성'}</Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: any, record: CommissionRate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          {!record.isActive && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record.id)}
            >
              활성화
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record.id)}
          >
            복제
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isGradeTiered = Form.useWatch('isGradeTiered', form);
  const selectedBonusType = Form.useWatch('bonusType', form);
  const isCenterBonusType = selectedBonusType === 'BRANCH_OPERATION';

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>수당률 설정</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          수당률 추가
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={rates} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingRate ? '수당률 수정' : '수당률 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Tab 1: 기본 정보 */}
            <Tabs.TabPane tab="기본 정보" key="basic">
              <Form.Item
                label="보너스 유형"
                name="bonusType"
                rules={[{ required: true, message: '보너스 유형을 선택하세요' }]}
              >
                <Select placeholder="보너스 유형 선택">
                  <Option value="SALES">판매 보너스</Option>
                  <Option value="SALES_MANAGEMENT">판매 관리 보너스</Option>
                  <Option value="LICENSE">판권 보너스</Option>
                  <Option value="LICENSE_MANAGEMENT">판권관리 보너스</Option>
                  <Option value="SHARING">공유 보너스</Option>
                  <Option value="BRANCH_OPERATION">센터 운영 보너스</Option>
                </Select>
              </Form.Item>

              {/* 센터 운영 보너스 설정 (BRANCH_OPERATION 선택 시) */}
              {isCenterBonusType && (
                <>
                  <Alert
                    message="센터 운영 보너스란?"
                    description="센터에 소속된 회원이 매출을 발생시키면, 해당 센터에 보너스가 지급됩니다. 센터는 계보도와 독립적으로 운영됩니다."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />

                  <Form.Item
                    label="보너스 발생 기준"
                    name="centerBonusMode"
                    initialValue="PER_SALE"
                    tooltip="건별: 매출 건당 보너스 발생 / 월별: 월 1회 (해당 월 첫 매출 시)"
                  >
                    <Radio.Group>
                      <Radio.Button value="PER_SALE">건별 (매출 건당)</Radio.Button>
                      <Radio.Button value="MONTHLY">월별 (월 1회)</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="영문명"
                    name="name"
                    rules={[{ required: true, message: '영문명을 입력하세요' }]}
                  >
                    <Input placeholder="Sales Bonus" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="한글명"
                    name="nameKo"
                    rules={[{ required: true, message: '한글명을 입력하세요' }]}
                  >
                    <Input placeholder="판매 보너스" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="설명" name="description">
                <TextArea rows={2} placeholder="보너스 설명을 입력하세요" />
              </Form.Item>

              <Divider>금액 설정</Divider>

              <Form.Item label="등급별 차등" name="isGradeTiered" valuePropName="checked">
                <Switch checkedChildren="등급별" unCheckedChildren="단일" />
              </Form.Item>

              {!isGradeTiered && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="고정 금액 (원)" name="baseAmount">
                      <InputNumber
                        min={0}
                        step={1000}
                        className="w-full"
                        placeholder="500000"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="퍼센트 (%)" name="basePercentage">
                      <InputNumber
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-full"
                        placeholder="25.0"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Form.Item label="기준 PV" name="basePv">
                <InputNumber
                  min={0}
                  step={100000}
                  className="w-full"
                  disabled
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>

              <Divider>추가 옵션</Divider>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="차액 지급" name="isDifferential" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="동급간만" name="isSameRankOnly" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="1대만" name="isFirstGenOnly" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="활성 상태" name="isActive" valuePropName="checked">
                    <Switch checkedChildren="활성" unCheckedChildren="비활성" />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* Tab 2: 등급별 금액 */}
            <Tabs.TabPane tab="등급별 금액" key="tiers" disabled={!isGradeTiered}>
              <Form.List name="tiers">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card key={field.key} size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="등급"
                              name={[field.name, 'applicableGrade']}
                              rules={[{ required: true, message: '등급을 선택하세요' }]}
                            >
                              <Select placeholder="등급 선택">
                                <Option value="MEMBER">회원</Option>
                                <Option value="AGENT">에이전트</Option>
                                <Option value="MANAGER">매니저</Option>
                                <Option value="BRANCH_CHIEF">지부장</Option>
                                <Option value="DIVISION_CHIEF">본부장</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item
                              {...field}
                              label="금액 (원)"
                              name={[field.name, 'amount']}
                              rules={[{ required: true, message: '금액을 입력하세요' }]}
                            >
                              <InputNumber
                                min={0}
                                step={1000}
                                className="w-full"
                                formatter={(value) =>
                                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="퍼센트 (%)"
                              name={[field.name, 'percentage']}
                            >
                              <InputNumber min={0} max={100} step={0.1} className="w-full" />
                            </Form.Item>
                          </Col>
                          <Col span={3}>
                            <Form.Item
                              {...field}
                              label="순서"
                              name={[field.name, 'tierOrder']}
                              initialValue={index + 1}
                            >
                              <InputNumber min={1} className="w-full" />
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Form.Item label=" ">
                              <Button danger onClick={() => remove(field.name)}>
                                삭제
                              </Button>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      등급 추가
                    </Button>
                  </>
                )}
              </Form.List>
            </Tabs.TabPane>

            {/* Tab 3: 자격 조건 */}
            <Tabs.TabPane tab="자격 조건" key="qualifications">
              <Form.List name="qualifications">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Card key={field.key} size="small" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...field}
                              label="조건 유형"
                              name={[field.name, 'qualificationType']}
                              rules={[{ required: true, message: '조건 유형을 선택하세요' }]}
                            >
                              <Select placeholder="조건 유형 선택">
                                <Option value="MINIMUM_GRADE">최소 등급</Option>
                                <Option value="TEAM_COUNT">팀 개수</Option>
                                <Option value="MIN_GRADE_COUNT">특정 등급 N명</Option>
                                <Option value="MIN_MEMBERS_PER_TEAM">팀당 최소 인원</Option>
                                <Option value="OFFICE_FACILITY">시설 요구사항</Option>
                                <Option value="SAME_RANK_ONLY">동급간만</Option>
                                <Option value="FIRST_GEN_ONLY">1대만</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item
                              {...field}
                              label="필요 등급"
                              name={[field.name, 'requiredGrade']}
                            >
                              <Select placeholder="등급 선택" allowClear>
                                <Option value="AGENT">에이전트</Option>
                                <Option value="MANAGER">매니저</Option>
                                <Option value="BRANCH_CHIEF">지부장</Option>
                                <Option value="DIVISION_CHIEF">본부장</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              {...field}
                              label="필요 인원"
                              name={[field.name, 'requiredCount']}
                            >
                              <InputNumber min={0} className="w-full" />
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              {...field}
                              label="필요 팀 수"
                              name={[field.name, 'requiredTeamCount']}
                            >
                              <InputNumber min={0} className="w-full" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="팀당 최소 인원"
                              name={[field.name, 'minMembersPerTeam']}
                            >
                              <InputNumber min={0} className="w-full" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="사무실"
                              name={[field.name, 'requiresOffice']}
                              valuePropName="checked"
                            >
                              <Checkbox>필수</Checkbox>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="세미나"
                              name={[field.name, 'requiresSeminar']}
                              valuePropName="checked"
                            >
                              <Checkbox>필수</Checkbox>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="법인"
                              name={[field.name, 'requiresCorporation']}
                              valuePropName="checked"
                            >
                              <Checkbox>필수</Checkbox>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...field}
                              label="TV"
                              name={[field.name, 'requiresTV']}
                              valuePropName="checked"
                            >
                              <Checkbox>필수</Checkbox>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Button danger onClick={() => remove(field.name)} block>
                          조건 삭제
                        </Button>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      자격 조건 추가
                    </Button>
                  </>
                )}
              </Form.List>
            </Tabs.TabPane>
          </Tabs>

          <Divider />

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>취소</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                저장
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
