'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps, Select, Spin } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/auth.service';
import { api } from '@/lib/api';
import type { ApiError } from '@/services/api';
import type { RegisterRequest } from '@/services/auth.service';
import DaumPostcode from '@/components/DaumPostcode';
import type { AddressData } from '@/components/DaumPostcode';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

// 회원 검색 결과 인터페이스
interface Member {
  id: number;
  username: string;
  name: string;
  grade: string;
  isActive: boolean;
  sponsoreeCount?: number; // 후원인 1:3 제한용
}

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [addressData, setAddressData] = useState({ postalCode: '', address: '' });

  // 추천인 검색 상태
  const [recommenderSearchLoading, setRecommenderSearchLoading] = useState(false);
  const [recommenderOptions, setRecommenderOptions] = useState<Member[]>([]);
  const recommenderSearchRef = useRef<NodeJS.Timeout | null>(null);

  // 후원인 검색 상태
  const [sponsorSearchLoading, setSponsorSearchLoading] = useState(false);
  const [sponsorOptions, setSponsorOptions] = useState<Member[]>([]);
  const sponsorSearchRef = useRef<NodeJS.Timeout | null>(null);

  // 센터 목록 상태
  const [centerOptions, setCenterOptions] = useState<Member[]>([]);
  const [centerLoading, setCenterLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Username 중복 체크 (디바운싱 500ms)
  useEffect(() => {
    if (!username || username.length < 4) {
      setUsernameAvailable(null);
      setUsernameCheckMessage('');
      return;
    }

    // Username validation regex 체크
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
      } catch (error) {
        setUsernameAvailable(null);
        setUsernameCheckMessage('중복 확인에 실패했습니다');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // 회원 검색 함수 (디바운싱 300ms)
  const searchMembers = async (
    searchValue: string,
    setLoadingFn: (loading: boolean) => void,
    setOptionsFn: (options: Member[]) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchValue.length < 1) {
      setOptionsFn([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setLoadingFn(true);
        const { data } = await api.get('/v1/members/search', {
          params: { q: searchValue, limit: 20, isActive: true },
        });
        setOptionsFn(data.data || []);
      } catch {
        setOptionsFn([]);
      } finally {
        setLoadingFn(false);
      }
    }, 300);
  };

  // 추천인 검색
  const handleRecommenderSearch = (value: string) => {
    searchMembers(value, setRecommenderSearchLoading, setRecommenderOptions, recommenderSearchRef);
  };

  // 후원인 검색
  const handleSponsorSearch = (value: string) => {
    searchMembers(value, setSponsorSearchLoading, setSponsorOptions, sponsorSearchRef);
  };

  // 센터 목록 조회 (CENTER 등급 회원)
  useEffect(() => {
    const fetchCenters = async () => {
      setCenterLoading(true);
      try {
        const { data } = await api.get('/v1/members/search', {
          params: { grade: 'CENTER', limit: 100, isActive: true },
        });
        setCenterOptions(data.data || []);
      } catch {
        setCenterOptions([]);
      } finally {
        setCenterLoading(false);
      }
    };
    fetchCenters();
  }, []);

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

  const onFinish = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      const response = await authService.register(values);

      // Zustand store 업데이트
      setAuth(
        {
          id: String(response.user.id),
          username: response.user.username,
          email: response.user.email,
          name: response.user.name,
          role: response.user.grade,
          grade: response.user.grade,
        },
        response.accessToken,
      );

      message.success(`${response.user.name}님, 회원가입을 환영합니다!`);

      // 신규 회원은 회원용 대시보드로 리다이렉트
      router.push('/dashboard');
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || '회원가입에 실패했습니다');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 각 스텝별 검증 필드
  const stepFields: Record<number, string[]> = {
    0: ['username', 'password', 'confirmPassword', 'name', 'phone'],
    1: ['recommenderId', 'sponsorId', 'centerName'],
    2: ['addressDetail'], // 선택사항이지만 검증 대상에 포함
  };

  const nextStep = async () => {
    try {
      await form.validateFields(stepFields[currentStep]);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // 검증 실패 시 다음으로 넘어가지 않음
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: '기본 정보',
      icon: <UserOutlined />,
    },
    {
      title: '조직 정보',
      icon: <TeamOutlined />,
    },
    {
      title: '주소 정보',
      icon: <HomeOutlined />,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e35d5b 0%, #a23b72 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <Title level={2} style={{ marginBottom: 8 }}>
            회원가입
          </Title>
          <Text type="secondary">케이아이온 통합관리시스템</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark="optional"
        >
          {/* Step 0: 기본 정보 */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
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
                  message: '영문 소문자로 시작하며, 영문/숫자/언더스코어/하이픈만 사용 가능합니다',
                },
                {
                  validator: async () => {
                    if (usernameAvailable === false) {
                      return Promise.reject();
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#E53935' }} />}
                placeholder="아이디 (예: admin, test123)"
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="username"
              />
            </Form.Item>

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
              />
            </Form.Item>

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
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="이름"
              rules={[{ required: true, message: '이름을 입력해주세요' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#E53935' }} />} placeholder="홍길동" />
            </Form.Item>

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
              />
            </Form.Item>
          </div>

          {/* Step 1: 조직 정보 */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
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

            <Form.Item
              name="centerName"
              label="센터"
              rules={[{ required: true, message: '센터를 선택해주세요' }]}
            >
              <Select
                placeholder="센터 선택"
                showSearch
                optionFilterProp="children"
                loading={centerLoading}
                notFoundContent={centerLoading ? <Spin size="small" /> : '센터가 없습니다'}
                allowClear
              >
                {centerOptions.map((center) => (
                  <Option key={center.id} value={center.name}>
                    {center.name} ({center.username})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Step 2: 주소 정보 */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Form.Item label="주소 검색">
              <DaumPostcode
                postalCode={addressData.postalCode}
                address={addressData.address}
                onComplete={(data: AddressData) => {
                  setAddressData(data);
                  form.setFieldsValue({
                    postalCode: data.postalCode,
                    address: data.address,
                  });
                }}
              />
            </Form.Item>

            <Form.Item name="postalCode" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="address" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="addressDetail" label="상세 주소">
              <Input
                prefix={<HomeOutlined style={{ color: '#E53935' }} />}
                placeholder="동/호수 등 상세 주소 입력"
              />
            </Form.Item>
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {currentStep > 0 && (
              <Button size="large" onClick={prevStep} style={{ flex: 1 }}>
                이전
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={nextStep}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                  border: 'none',
                }}
              >
                다음
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                  border: 'none',
                }}
              >
                회원가입
              </Button>
            )}
          </div>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ color: '#E53935', fontWeight: 600 }}>
              로그인
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
