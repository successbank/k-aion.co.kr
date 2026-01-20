'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  message,
  Alert,
  Space,
  Typography,
  Spin,
} from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { settlementsApi } from '@/lib/api';
import {
  OverlapCheckResult,
  DateValidationResult,
} from '@/types/settlement-schedule';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface ManualSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualSettlementModal({
  open,
  onClose,
  onSuccess,
}: ManualSettlementModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [overlapResult, setOverlapResult] = useState<OverlapCheckResult | null>(null);
  const [dateValidation, setDateValidation] = useState<DateValidationResult | null>(null);
  const [selectedDates, setSelectedDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      form.resetFields();
      setOverlapResult(null);
      setDateValidation(null);
      setSelectedDates(null);
    }
  }, [open, form]);

  // 날짜 변경 시 중복 체크 (debounced)
  const checkDates = useCallback(async (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) {
      setOverlapResult(null);
      setDateValidation(null);
      return;
    }

    const startDate = dates[0].format('YYYY-MM-DD');
    const endDate = dates[1].format('YYYY-MM-DD');

    setChecking(true);

    try {
      // 중복 체크와 날짜 유효성 검사를 병렬로 실행
      const [overlapRes, dateRes] = await Promise.all([
        settlementsApi.checkOverlap(startDate, endDate),
        settlementsApi.validateDate(startDate),
      ]);

      setOverlapResult(overlapRes.data);
      setDateValidation(dateRes.data);
    } catch (error) {
      console.error('Date check failed:', error);
    } finally {
      setChecking(false);
    }
  }, []);

  // debounce를 위한 타이머
  useEffect(() => {
    if (!selectedDates) return;

    const timer = setTimeout(() => {
      checkDates(selectedDates);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [selectedDates, checkDates]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setSelectedDates(dates);
    form.setFieldsValue({ dateRange: dates });
  };

  const isSubmitDisabled = () => {
    if (!selectedDates || !selectedDates[0] || !selectedDates[1]) return true;
    if (checking) return true;
    if (overlapResult?.overlaps) return true;
    if (dateValidation && !dateValidation.valid) return true;
    return false;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.dateRange || !values.dateRange[0] || !values.dateRange[1]) {
        message.error('날짜 범위를 선택해주세요.');
        return;
      }

      // 제출 전 최종 확인
      if (overlapResult?.overlaps) {
        message.error('기간이 겹치는 정산이 존재합니다.');
        return;
      }

      if (dateValidation && !dateValidation.valid) {
        message.error(dateValidation.message);
        return;
      }

      setLoading(true);

      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const endDate = values.dateRange[1].format('YYYY-MM-DD');

      await settlementsApi.createManual({ startDate, endDate });
      message.success('특정날짜 정산이 생성되었습니다.');
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || '정산 생성에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderValidationStatus = () => {
    if (!selectedDates || !selectedDates[0] || !selectedDates[1]) {
      return null;
    }

    if (checking) {
      return (
        <Alert
          message={
            <Space>
              <Spin size="small" />
              <Text>날짜 검증 중...</Text>
            </Space>
          }
          type="info"
        />
      );
    }

    const alerts: React.ReactNode[] = [];

    // 중복 체크 결과
    if (overlapResult?.overlaps) {
      alerts.push(
        <Alert
          key="overlap"
          message="기간 중복 경고"
          description={
            <Space direction="vertical" size={0}>
              <Text>{overlapResult.message}</Text>
              <Text type="secondary">
                겹치는 정산:{' '}
                {overlapResult.conflictingSettlements.map((s) => s.weekCode).join(', ')}
              </Text>
            </Space>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      );
    }

    // 날짜 유효성 검사 결과
    if (dateValidation && !dateValidation.valid) {
      alerts.push(
        <Alert
          key="dateValidation"
          message="날짜 유효성 오류"
          description={dateValidation.message}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      );
    }

    // 모두 통과한 경우
    if (!overlapResult?.overlaps && dateValidation?.valid) {
      alerts.push(
        <Alert
          key="success"
          message="검증 완료"
          description="선택한 기간으로 정산을 생성할 수 있습니다."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      );
    }

    return <Space direction="vertical" style={{ width: '100%' }}>{alerts}</Space>;
  };

  return (
    <Modal
      title="특정날짜 정산"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="정산 생성"
      cancelText="취소"
      okButtonProps={{ disabled: isSubmitDisabled() }}
      confirmLoading={loading}
      width={500}
    >
      <Alert
        message="특정날짜 정산 안내"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>회사 이슈로 인한 수동 정산 생성 기능입니다.</li>
            <li>기존 정산과 기간이 겹치면 생성할 수 없습니다.</li>
            <li>마지막 정산 이후 날짜만 선택 가능합니다.</li>
            <li>OPEN 상태로 생성되며, 계산/확정/지급은 수동으로 진행합니다.</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="dateRange"
          label="정산 기간"
          rules={[{ required: true, message: '정산 기간을 선택해주세요' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder={['시작일', '종료일']}
            onChange={handleDateChange}
            disabledDate={(current) => {
              // 오늘 이후는 선택 불가
              return current && current > dayjs().endOf('day');
            }}
          />
        </Form.Item>

        {renderValidationStatus()}
      </Form>
    </Modal>
  );
}
