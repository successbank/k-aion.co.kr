'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Select, message, Spin, Row, Col, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  BankOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { authService } from '@/services/auth.service';
import { membersService } from '@/services/members.service';
import DaumPostcode, { AddressData } from '@/components/DaumPostcode/DaumPostcode';
import { api } from '@/lib/api';
import type { ApiError } from '@/services/api';

const { Option } = Select;

interface AddMemberModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface AddMemberFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  sponsorId: number;
  recommenderId: number;
  centerName: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Member {
  id: number;
  username: string;
  name: string;
  grade: string;
  isActive: boolean;
  sponsoreeCount?: number; // 후원인 1:3 제한용
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

export function AddMemberModal({ visible, onCancel, onSuccess }: AddMemberModalProps) {
  const [form] = Form.useForm<AddMemberFormValues>();
  const [loading, setLoading] = useState(false);

  // Username 중복 체크 상태
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');

  // 후원인 검색 상태
  const [sponsorSearchLoading, setSponsorSearchLoading] = useState(false);
  const [sponsorOptions, setSponsorOptions] = useState<Member[]>([]);
  const sponsorSearchRef = useRef<NodeJS.Timeout | null>(null);

  // 추천인 검색 상태
  const [recommenderSearchLoading, setRecommenderSearchLoading] = useState(false);
  const [recommenderOptions, setRecommenderOptions] = useState<Member[]>([]);
  const recommenderSearchRef = useRef<NodeJS.Timeout | null>(null);

  // 주소 필드 값 추적 (DaumPostcode 컴포넌트에 전달용)
  const watchedPostalCode = Form.useWatch('postalCode', form);
  const watchedAddress = Form.useWatch('address', form);

  // 다음 주소 검색 완료 핸들러
  const handleAddressComplete = (data: AddressData) => {
    form.setFieldsValue({
      postalCode: data.postalCode,
      address: data.address,
    });
  };

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

  // 모달 닫힐 때 폼 초기화
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setUsername('');
      setUsernameAvailable(null);
      setUsernameCheckMessage('');
      setSponsorOptions([]);
      setRecommenderOptions([]);
    }
  }, [visible, form]);

  // 회원 검색 함수
  const searchMembers = async (
    searchValue: string,
    setLoading: (loading: boolean) => void,
    setOptions: (options: Member[]) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchValue.length < 1) {
      setOptions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/v1/members/search', {
          params: { q: searchValue, limit: 20, isActive: true },
        });
        setOptions(data.data || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 후원인 검색
  const handleSponsorSearch = (value: string) => {
    searchMembers(value, setSponsorSearchLoading, setSponsorOptions, sponsorSearchRef);
  };

  // 추천인 검색
  const handleRecommenderSearch = (value: string) => {
    searchMembers(value, setRecommenderSearchLoading, setRecommenderOptions, recommenderSearchRef);
  };

  // 폼 제출 - membersService를 사용하여 일관된 API 호출 및 에러 처리
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (usernameAvailable === false) {
        message.error('이미 사용 중인 아이디입니다');
        return;
      }

      setLoading(true);

      await membersService.createMember({
        username: values.username,
        password: values.password,
        name: values.name,
        phone: values.phone,
        sponsorId: values.sponsorId,
        recommenderId: values.recommenderId,
        postalCode: values.postalCode,
        address: values.address,
        addressDetail: values.addressDetail,
        centerName: values.centerName,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountHolder: values.accountHolder,
      });

      message.success(`${values.name}님이 등록되었습니다`);
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || '회원 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 회원 옵션 렌더링 (추천인용 - 제한 없음)
  const renderMemberOption = (member: Member) => (
    <Option key={member.id} value={member.id} label={`${member.name} (${member.username})`}>
      <div>
        <div style={{ fontWeight: 500 }}>
          {member.name} ({member.username})
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          ID: {member.id} | {member.grade}
        </div>
      </div>
    </Option>
  );

  // 후원인 옵션 렌더링 (1:3 제한 적용)
  const renderSponsorOption = (member: Member) => {
    const isFull = (member.sponsoreeCount ?? 0) >= 3;
    return (
      <Option
        key={member.id}
        value={member.id}
        disabled={isFull}
        label={`${member.name} (${member.username})`}
      >
        <div style={{ opacity: isFull ? 0.5 : 1 }}>
          <div style={{ fontWeight: 500 }}>
            {member.name} ({member.username})
          </div>
          <div style={{ fontSize: '12px', color: isFull ? '#999' : '#666' }}>
            ID: {member.id} | {member.grade} |
            <span style={{ color: isFull ? '#ff4d4f' : '#52c41a', marginLeft: 4 }}>
              {member.sponsoreeCount ?? 0}/3명
            </span>
            {isFull && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>(마감)</span>}
          </div>
        </div>
      </Option>
    );
  };

  return (
    <Modal
      title="회원 추가"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="등록"
      cancelText="취소"
      okButtonProps={{ loading }}
      width={720}
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
                prefix={<UserOutlined style={{ color: '#E53935' }} />}
                placeholder="아이디 (예: hong123)"
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="이름"
              rules={[
                { required: true, message: '이름을 입력해주세요' },
                { min: 2, message: '이름은 최소 2글자 이상이어야 합니다' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#E53935' }} />}
                placeholder="홍길동"
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
                { min: 4, message: '비밀번호는 최소 4자 이상이어야 합니다' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#E53935' }} />}
                placeholder="4자 이상"
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
                prefix={<LockOutlined style={{ color: '#E53935' }} />}
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
            { required: true, message: '전화번호를 입력해주세요' },
            {
              pattern: /^01[0-9](-\d{3,4}-\d{4}|\d{7,8})$/,
              message: '010-1234-5678 또는 01012345678 형식으로 입력해주세요',
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined style={{ color: '#E53935' }} />}
            placeholder="010-1234-5678 또는 01012345678"
            autoComplete="off"
          />
        </Form.Item>

        {/* 조직 정보 */}
        <Divider orientation="left">조직 정보</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sponsorId"
              label="후원인"
              rules={[{ required: true, message: '후원인을 선택해주세요' }]}
            >
              <Select
                placeholder="이름 또는 아이디로 검색"
                showSearch
                filterOption={false}
                onSearch={handleSponsorSearch}
                loading={sponsorSearchLoading}
                notFoundContent={
                  sponsorSearchLoading ? <Spin size="small" /> : '검색 결과가 없습니다'
                }
                allowClear
              >
                {sponsorOptions.map(renderSponsorOption)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="recommenderId"
              label="추천인"
              rules={[{ required: true, message: '추천인을 선택해주세요' }]}
            >
              <Select
                placeholder="이름 또는 아이디로 검색"
                showSearch
                filterOption={false}
                onSearch={handleRecommenderSearch}
                loading={recommenderSearchLoading}
                notFoundContent={
                  recommenderSearchLoading ? <Spin size="small" /> : '검색 결과가 없습니다'
                }
                allowClear
              >
                {recommenderOptions.map(renderMemberOption)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="centerName"
          label="센터"
          rules={[{ required: false }]}
        >
          <Input
            prefix={<TeamOutlined style={{ color: '#E53935' }} />}
            placeholder="소속 센터명"
            autoComplete="off"
          />
        </Form.Item>

        {/* 주소 정보 */}
        <Divider orientation="left">주소</Divider>

        {/* 다음 주소 검색 */}
        <Form.Item label="주소 검색">
          <DaumPostcode
            onComplete={handleAddressComplete}
            postalCode={watchedPostalCode || ''}
            address={watchedAddress || ''}
          />
        </Form.Item>

        {/* 폼 값 저장용 hidden fields */}
        <Form.Item name="postalCode" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="address" hidden>
          <Input />
        </Form.Item>

        {/* 상세주소 */}
        <Form.Item name="addressDetail" label="상세주소">
          <Input placeholder="101동 1234호" autoComplete="off" />
        </Form.Item>

        {/* 계좌 정보 */}
        <Divider orientation="left">계좌 정보</Divider>

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
              rules={[
                { pattern: /^[\d-]+$/, message: '숫자와 하이픈만 입력 가능합니다' },
              ]}
            >
              <Input
                prefix={<BankOutlined style={{ color: '#E53935' }} />}
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

export default AddMemberModal;
