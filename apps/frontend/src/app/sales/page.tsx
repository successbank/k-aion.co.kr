'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  DatePicker,
  message,
  Divider,
  Typography,
  Space,
  Alert,
  Tag,
} from 'antd';
import { ShoppingOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import bonusesService from '@/services/bonuses.service';
import type { BonusPreview } from '@/services/bonuses.service';
import { BonusTypeLabels, BonusTypeColors } from '@/types/bonuses';

const { Title, Text } = Typography;

export default function SalesPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bonusPreview, setBonusPreview] = useState<BonusPreview | null>(null);

  const handlePreview = async () => {
    try {
      const values = await form.validateFields(['sellerId', 'saleAmount']);
      setPreviewLoading(true);

      const preview = await bonusesService.previewBonuses(
        values.sellerId,
        values.saleAmount
      );
      setBonusPreview(preview);
      message.success('보너스 미리보기 완료');
    } catch (error: any) {
      if (error.errorFields) {
        message.warning('판매자 ID와 판매 금액을 입력해주세요.');
      } else {
        console.error('Preview failed:', error);
        message.error(error.response?.data?.message || '미리보기 실패');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // TODO: 판매 등록 API 호출
      // const sale = await salesService.create(values);
      // await bonusesService.calculateBonuses(sale.id);

      message.success('판매가 등록되었습니다. 보너스가 자동으로 생성됩니다.');
      form.resetFields();
      setBonusPreview(null);
    } catch (error: any) {
      console.error('Sale registration failed:', error);
      message.error(error.response?.data?.message || '판매 등록 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Title level={2}>판매 등록</Title>

      <Alert
        message="보너스 자동 생성 안내"
        description="판매 등록 시 Commission PRD v2.0 기준에 따라 보너스가 자동으로 계산 및 생성됩니다. 판매자, 추천인, 상위 리더들에게 보너스가 지급됩니다."
        type="info"
        showIcon
        icon={<GiftOutlined />}
        className="mb-4"
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            saleCode: `SALE-${Date.now()}`,
            weekCode: `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 3)}`,
          }}
        >
          {/* 판매 정보 */}
          <Divider orientation="left">
            <ShoppingOutlined /> 판매 정보
          </Divider>

          <Form.Item
            name="sellerId"
            label="판매자 ID"
            rules={[{ required: true, message: '판매자 ID를 입력해주세요' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="판매자 회원 ID"
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="saleCode"
            label="판매 코드"
            rules={[{ required: true, message: '판매 코드를 입력해주세요' }]}
          >
            <Input placeholder="고유 판매 코드" />
          </Form.Item>

          <Form.Item
            name="saleAmount"
            label="판매 금액"
            rules={[
              { required: true, message: '판매 금액을 입력해주세요' },
              { type: 'number', min: 1000, message: '최소 1,000원 이상이어야 합니다' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="판매 금액 (원)"
              formatter={(value) => `₩ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\₩\s?|(,*)/g, '')}
              min={1000}
            />
          </Form.Item>

          <Form.Item
            name="weekCode"
            label="정산 주차"
            rules={[{ required: true, message: '정산 주차를 입력해주세요' }]}
          >
            <Input placeholder="예: 2025-52" />
          </Form.Item>

          <Form.Item name="productId" label="제품 ID (선택)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="제품 ID"
              min={1}
            />
          </Form.Item>

          <Form.Item name="description" label="메모 (선택)">
            <Input.TextArea rows={3} placeholder="판매 관련 메모" />
          </Form.Item>

          {/* 보너스 미리보기 버튼 */}
          <Form.Item>
            <Space>
              <Button
                type="dashed"
                icon={<DollarOutlined />}
                onClick={handlePreview}
                loading={previewLoading}
              >
                보너스 미리보기
              </Button>
            </Space>
          </Form.Item>

          {/* 보너스 미리보기 결과 */}
          {bonusPreview && (
            <>
              <Divider orientation="left">
                <GiftOutlined /> 예상 보너스
              </Divider>

              <Card
                size="small"
                style={{
                  background: '#f0f5ff',
                  border: '1px solid #adc6ff',
                  marginBottom: 24,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      총 예상 보너스:{' '}
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: 20, color: '#7CB342' }}
                    >
                      {bonusPreview.totalBonus.toLocaleString()}원
                    </Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  {bonusPreview.bonuses.map((bonus, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#fff',
                        borderRadius: 6,
                      }}
                    >
                      <Space>
                        <Tag color={BonusTypeColors[bonus.type]}>
                          {BonusTypeLabels[bonus.type]}
                        </Tag>
                        <Text>{bonus.recipient}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {bonus.description}
                        </Text>
                      </Space>
                      <Text strong style={{ color: '#7CB342' }}>
                        {bonus.amount.toLocaleString()}원
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>
            </>
          )}

          {/* 제출 버튼 */}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                판매 등록 및 보너스 생성
              </Button>
              <Button onClick={() => form.resetFields()}>초기화</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </DashboardLayout>
  );
}
