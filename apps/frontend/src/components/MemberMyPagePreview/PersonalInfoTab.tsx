'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Card, Divider, Select, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { membersService, MemberDetailResponse, UpdateMemberDto } from '@/services/members.service';

const { Text } = Typography;

interface PersonalInfoTabProps {
  member: MemberDetailResponse;
  onUpdate: () => void;
}

export function PersonalInfoTab({ member, onUpdate }: PersonalInfoTabProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 폼 초기값 설정
  const initialValues = {
    name: member.name,
    phone: member.phone,
    birthDate: member.birthDate
      ? new Date(member.birthDate).toISOString().split('T')[0]
      : null,
    postalCode: member.postalCode,
    address: member.address,
    addressDetail: member.addressDetail,
    bankName: member.bankName,
    accountNumber: member.accountNumber,
    accountHolder: member.accountHolder,
    isActive: member.isActive,
  };

  // 폼 제출
  const handleSubmit = async (values: UpdateMemberDto) => {
    try {
      setLoading(true);
      await membersService.updateMember(member.id, values);
      message.success('회원 정보가 수정되었습니다.');
      onUpdate();
    } catch (error: any) {
      message.error(error.message || '회원 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 폼 초기화
  const handleReset = () => {
    form.setFieldsValue(initialValues);
  };

  return (
    <div style={{ padding: '0 8px' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {/* 기본 정보 */}
        <Card title="기본 정보" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="name"
            label="이름"
            rules={[{ required: true, message: '이름을 입력하세요' }]}
          >
            <Input placeholder="이름" />
          </Form.Item>

          <Form.Item name="phone" label="연락처">
            <Input placeholder="010-1234-5678" />
          </Form.Item>

          <Form.Item name="birthDate" label="생년월일">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="isActive" label="활성 상태">
            <Select>
              <Select.Option value={true}>활성</Select.Option>
              <Select.Option value={false}>비활성</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        {/* 주소 정보 */}
        <Card title="주소 정보" size="small" style={{ marginBottom: 16 }}>
          <Form.Item name="postalCode" label="우편번호">
            <Input placeholder="12345" style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="address" label="주소">
            <Input placeholder="기본 주소" />
          </Form.Item>

          <Form.Item name="addressDetail" label="상세 주소">
            <Input placeholder="상세 주소" />
          </Form.Item>
        </Card>

        {/* 계좌 정보 */}
        <Card title="계좌 정보" size="small" style={{ marginBottom: 16 }}>
          <Form.Item name="bankName" label="은행">
            <Select placeholder="은행 선택" allowClear>
              <Select.Option value="국민은행">국민은행</Select.Option>
              <Select.Option value="신한은행">신한은행</Select.Option>
              <Select.Option value="하나은행">하나은행</Select.Option>
              <Select.Option value="우리은행">우리은행</Select.Option>
              <Select.Option value="농협은행">농협은행</Select.Option>
              <Select.Option value="기업은행">기업은행</Select.Option>
              <Select.Option value="카카오뱅크">카카오뱅크</Select.Option>
              <Select.Option value="토스뱅크">토스뱅크</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="accountNumber" label="계좌번호">
            <Input placeholder="123-456-789012" />
          </Form.Item>

          <Form.Item name="accountHolder" label="예금주">
            <Input placeholder="예금주 이름" />
          </Form.Item>
        </Card>

        {/* 조직 정보 (읽기 전용) */}
        <Card title="조직 정보" size="small" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">아이디</Text>
            <div>{member.email || '-'}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">추천인</Text>
            <div>
              {member.recommender
                ? `${member.recommender.name} (ID: ${member.recommender.id})`
                : '-'}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">후원인</Text>
            <div>
              {member.sponsor
                ? `${member.sponsor.name} (ID: ${member.sponsor.id})`
                : '-'}
            </div>
          </div>
          <div>
            <Text type="secondary">가입일</Text>
            <div>{new Date(member.createdAt).toLocaleDateString('ko-KR')}</div>
          </div>
        </Card>

        <Divider />

        {/* 버튼 */}
        <div style={{ textAlign: 'center' }}>
          <Space size="middle">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              초기화
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              저장
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}

export default PersonalInfoTab;
