'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Row, Col, Divider, Alert } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  BankOutlined,
  ShopOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { authService } from '@/services/auth.service';
import { membersService } from '@/services/members.service';
import type { ApiError } from '@/services/api';

const { Option } = Select;

interface AddCenterModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface AddCenterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

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

export function AddCenterModal({ visible, onCancel, onSuccess }: AddCenterModalProps) {
  const [form] = Form.useForm<AddCenterFormValues>();
  const [loading, setLoading] = useState(false);

  // Username 중복 체크 상태
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');

  // Username 중복 체크 (디바운싱 500ms)
  useEffect(() => {
    if (!username || username.length < 4) {
      setUsernameAvailable(null);
      setUsernameCheckMessage('');
      return;
    }

    const usernameRegex = /^[a-z][a-z0-9_-]{3,49}$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(null);
      setUsernameCheckMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const result = await authService.checkUsername(username);
        setUsernameAvailable(result.available);
        setUsernameCheckMessage(result.message);
      } catch {
        setUsernameAvailable(null);
        setUsernameCheckMessage('중복 확인에 실패했습니다');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!visible) {
      setUsername('');
      setUsernameAvailable(null);
      setUsernameCheckMessage('');
    }
  }, [visible]);

  // 폼 제출
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (usernameAvailable === false) {
        message.error('이미 사용 중인 아이디입니다');
        return;
      }

      setLoading(true);

      // 센터는 후원인/추천인 없이 생성 (계보도에 영향 미치지 않음)
      await membersService.createMember({
        username: values.username,
        password: values.password,
        name: values.name,
        phone: values.phone,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder,
        grade: 'CENTER', // 센터 등급으로 고정
      });

      message.success(`센터 "${values.name}"이(가) 등록되었습니다`);
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || '센터 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <ShopOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
          센터 추가
        </span>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="등록"
      cancelText="취소"
      okButtonProps={{ loading, style: { background: '#eb2f96', borderColor: '#eb2f96' } }}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" size="large" requiredMark="optional">
        {/* 기본 정보 */}
        <Divider orientation="left" style={{ marginTop: 0 }}>
          기본 정보
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="username"
              label="아이디"
              validateStatus={
                usernameChecking
                  ? 'validating'
                  : usernameAvailable === true
                    ? 'success'
                    : usernameAvailable === false
                      ? 'error'
                      : undefined
              }
              hasFeedback={!!username && username.length >= 4}
              help={usernameCheckMessage || undefined}
              rules={[
                { required: true, message: '아이디를 입력해주세요' },
                { min: 4, message: '아이디는 최소 4글자 이상이어야 합니다' },
                { max: 50, message: '아이디는 최대 50글자까지 가능합니다' },
                {
                  pattern: /^[a-z][a-z0-9_-]{3,49}$/,
                  message: '영문 소문자로 시작, 영문/숫자/언더스코어/하이픈만 가능',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#eb2f96' }} />}
                placeholder="아이디 (예: center_gangnam)"
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="센터명"
              rules={[
                { required: true, message: '센터명을 입력해주세요' },
                { min: 2, message: '센터명은 최소 2글자 이상이어야 합니다' },
              ]}
            >
              <Input
                prefix={<ShopOutlined style={{ color: '#eb2f96' }} />}
                placeholder="강남센터"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label="비밀번호"
              rules={[
                { required: true, message: '비밀번호를 입력해주세요' },
                { min: 8, message: '비밀번호는 최소 8자 이상이어야 합니다' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#eb2f96' }} />}
                placeholder="8자 이상"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="confirmPassword"
              label="비밀번호 확인"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '비밀번호를 다시 입력해주세요' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#eb2f96' }} />}
                placeholder="비밀번호 재입력"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phone"
          label="전화번호"
          rules={[
            {
              pattern: /^01[0-9]-?\d{3,4}-?\d{4}$/,
              message: '010-1234-5678 형식으로 입력해주세요',
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined style={{ color: '#eb2f96' }} />}
            placeholder="010-1234-5678"
            autoComplete="off"
          />
        </Form.Item>

        {/* 센터 안내 메시지 */}
        <Alert
          message="센터는 계보도에 포함되지 않습니다"
          description="센터는 후원인/추천인 관계 없이 독립적으로 운영되며, 조직도에 표시되지 않습니다. 센터 소속 회원이 매출을 발생시키면 센터에 운영 보너스가 지급됩니다."
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 계좌 정보 */}
        <Divider orientation="left">계좌 정보 (선택)</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="bankName" label="은행">
              <Select placeholder="은행 선택" showSearch optionFilterProp="children">
                {KOREAN_BANKS.map((bank) => (
                  <Option key={bank} value={bank}>
                    {bank}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name="accountNumber"
              label="계좌번호"
              rules={[{ pattern: /^[\d-]+$/, message: '숫자와 하이픈만 입력 가능합니다' }]}
            >
              <Input
                prefix={<BankOutlined style={{ color: '#eb2f96' }} />}
                placeholder="123-456-789012"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="accountHolder" label="예금주">
          <Input placeholder="예금주 이름" autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddCenterModal;
