'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  BankOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { tempMembersService } from '@/services/temp-members.service';

const { Title, Text, Paragraph } = Typography;

export default function TempJoinPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);

  // Daum 우편번호 검색
  const handleAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        form.setFieldsValue({
          postalCode: data.zonecode,
          address: data.address,
        });
      },
    }).open();
  };

  // 아이디 중복 체크
  const handleUsernameCheck = async () => {
    const username = form.getFieldValue('username');
    if (!username) {
      message.warning('아이디를 입력해주세요.');
      return;
    }

    try {
      const result = await tempMembersService.checkUsername(username);
      if (result.available) {
        message.success('사용 가능한 아이디입니다.');
        setUsernameChecked(true);
      } else {
        message.error('이미 사용 중인 아이디입니다.');
        setUsernameChecked(false);
      }
    } catch (error: any) {
      console.error('Username check error:', error);
      message.error(error.message || '아이디 중복 확인에 실패했습니다.');
    }
  };

  // 회원가입 처리
  const handleSubmit = async (values: any) => {
    if (!usernameChecked) {
      message.warning('아이디 중복 확인을 해주세요.');
      return;
    }

    if (values.password !== values.passwordConfirm) {
      message.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const { passwordConfirm, ...data } = values;
      await tempMembersService.create(data);
      message.success('축하합니다. 회원가입 되었습니다.', 2, () => {
        window.location.href = 'http://www.k-aion.co.kr/';
      });
    } catch (error: any) {
      message.error(error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>

      <Card
        style={{
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#7CB342', marginBottom: 8 }}>
            임시 회원가입
          </Title>
          <Paragraph type="secondary">
            시스템 완성 전까지 임시로 사용되는 회원가입 페이지입니다.
          </Paragraph>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          {/* 아이디 */}
          <Form.Item
            label="아이디"
            name="username"
            rules={[
              { required: true, message: '아이디를 입력해주세요' },
              { min: 4, message: '아이디는 최소 4자 이상이어야 합니다' },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<UserOutlined />}
                placeholder="아이디 (4자 이상)"
                onChange={() => setUsernameChecked(false)}
              />
              <Button type="primary" onClick={handleUsernameCheck}>
                중복확인
              </Button>
            </Space.Compact>
          </Form.Item>

          {/* 비밀번호 */}
          <Form.Item
            label="비밀번호"
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요' },
              { min: 4, message: '비밀번호는 최소 4자 이상이어야 합니다' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 (4자 이상)" />
          </Form.Item>

          {/* 비밀번호 확인 */}
          <Form.Item
            label="비밀번호 확인"
            name="passwordConfirm"
            rules={[{ required: true, message: '비밀번호를 다시 입력해주세요' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 확인" />
          </Form.Item>

          {/* 이름 */}
          <Form.Item
            label="이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input placeholder="홍길동" />
          </Form.Item>

          {/* 주민번호 */}
          <Form.Item
            label="주민번호"
            name="residentNumber"
            rules={[
              { required: true, message: '주민번호를 입력해주세요' },
              {
                pattern: /^\d{6}-\d{7}$/,
                message: '올바른 주민번호 형식이 아닙니다 (예: 900101-1234567)',
              },
            ]}
          >
            <Input placeholder="900101-1234567" />
          </Form.Item>

          {/* 전화번호 */}
          <Form.Item
            label="전화번호"
            name="phone"
            rules={[{ required: true, message: '전화번호를 입력해주세요' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="010-1234-5678" />
          </Form.Item>

          {/* 주소 */}
          <Form.Item label="우편번호">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="postalCode" noStyle>
                <Input placeholder="우편번호" readOnly />
              </Form.Item>
              <Button onClick={handleAddressSearch}>
                <HomeOutlined /> 주소검색
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="주소" name="address">
            <Input placeholder="주소" readOnly />
          </Form.Item>

          <Form.Item label="상세주소" name="addressDetail">
            <Input placeholder="상세주소 입력" />
          </Form.Item>

          {/* 은행 정보 */}
          <Form.Item label="은행" name="bankName">
            <Input prefix={<BankOutlined />} placeholder="예: 국민은행" />
          </Form.Item>

          <Form.Item label="계좌번호" name="accountNumber">
            <Input placeholder="123-456-789012" />
          </Form.Item>

          <Form.Item label="예금주" name="accountHolder">
            <Input placeholder="예금주 이름" />
          </Form.Item>

          {/* 추천인 */}
          <Form.Item label="추천인 전화번호" name="recommenderPhone">
            <Input prefix={<PhoneOutlined />} placeholder="010-1234-5678" />
          </Form.Item>

          {/* 후원인 */}
          <Form.Item label="후원인 전화번호" name="sponsorPhone">
            <Input prefix={<PhoneOutlined />} placeholder="010-9876-5432" />
          </Form.Item>

          {/* 소속지점 */}
          <Form.Item label="소속지점(센터)" name="centerName">
            <Input placeholder="예: 서울지점" />
          </Form.Item>

          {/* 제출 버튼 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                background: '#7CB342',
                borderColor: '#7CB342',
              }}
            >
              가입하기
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              이미 계정이 있으신가요?{' '}
              <a href="/login" style={{ color: '#7CB342' }}>
                로그인
              </a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
