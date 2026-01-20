'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Alert,
  Space,
  Typography,
} from 'antd';
import { settlementsApi } from '@/lib/api';
import {
  SettlementSchedule,
  SettlementCycleType,
  CreateScheduleDto,
  getCycleTypeKorean,
  DAY_OF_WEEK_OPTIONS,
  DAY_OF_MONTH_OPTIONS,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
} from '@/types/settlement-schedule';

const { Text } = Typography;

interface AutoSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AutoSettlementModal({
  open,
  onClose,
  onSuccess,
}: AutoSettlementModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [existingSchedule, setExistingSchedule] = useState<SettlementSchedule | null>(null);
  const [cycleType, setCycleType] = useState<SettlementCycleType>(SettlementCycleType.WEEKLY);
  const [nextRunPreview, setNextRunPreview] = useState<string>('');

  // 기존 스케줄 조회
  useEffect(() => {
    if (open) {
      fetchExistingSchedule();
    }
  }, [open]);

  const fetchExistingSchedule = async () => {
    try {
      const response = await settlementsApi.getSchedule();
      const schedule = response.data;
      setExistingSchedule(schedule);

      if (schedule) {
        form.setFieldsValue({
          name: schedule.name,
          cycleType: schedule.cycleType,
          dayOfWeek: schedule.dayOfWeek,
          dayOfMonth: schedule.dayOfMonth,
          hour: schedule.hour,
          minute: schedule.minute,
          isActive: schedule.isActive,
        });
        setCycleType(schedule.cycleType);
      } else {
        form.setFieldsValue({
          name: '주간 정산',
          cycleType: SettlementCycleType.WEEKLY,
          dayOfWeek: 1, // 월요일
          hour: 9,
          minute: 0,
          isActive: true,
        });
        setCycleType(SettlementCycleType.WEEKLY);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      // 스케줄이 없는 경우 기본값 설정
      form.setFieldsValue({
        name: '주간 정산',
        cycleType: SettlementCycleType.WEEKLY,
        dayOfWeek: 1,
        hour: 9,
        minute: 0,
        isActive: true,
      });
    }
  };

  // 다음 실행 시간 미리보기 업데이트
  useEffect(() => {
    // Modal이 열려있을 때만 실행 (Form이 마운트된 상태)
    if (!open) return;

    const timer = setTimeout(updateNextRunPreview, 0);
    return () => clearTimeout(timer);
  }, [cycleType, open]);

  const updateNextRunPreview = () => {
    // Form이 연결되지 않은 경우 건너뛰기
    let values;
    try {
      values = form.getFieldsValue();
    } catch {
      return;
    }
    const { cycleType: ct, dayOfWeek, dayOfMonth, hour, minute } = values;

    if (ct === undefined || hour === undefined || minute === undefined) {
      setNextRunPreview('');
      return;
    }

    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);

    switch (ct) {
      case SettlementCycleType.DAILY:
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case SettlementCycleType.WEEKLY:
        if (dayOfWeek !== undefined) {
          const currentDay = now.getDay();
          let daysUntilTarget = dayOfWeek - currentDay;
          if (daysUntilTarget < 0 || (daysUntilTarget === 0 && next <= now)) {
            daysUntilTarget += 7;
          }
          next.setDate(now.getDate() + daysUntilTarget);
        }
        break;

      case SettlementCycleType.MONTHLY:
        if (dayOfMonth !== undefined) {
          next.setDate(dayOfMonth);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          if (dayOfMonth > lastDay) {
            next.setDate(lastDay);
          }
        }
        break;
    }

    setNextRunPreview(
      next.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
      })
    );
  };

  const handleCycleTypeChange = (value: SettlementCycleType) => {
    setCycleType(value);
    // 주기 변경 시 관련 필드 초기화
    if (value === SettlementCycleType.DAILY) {
      form.setFieldsValue({ dayOfWeek: undefined, dayOfMonth: undefined });
    } else if (value === SettlementCycleType.WEEKLY) {
      form.setFieldsValue({ dayOfMonth: undefined, dayOfWeek: 1 });
    } else if (value === SettlementCycleType.MONTHLY) {
      form.setFieldsValue({ dayOfWeek: undefined, dayOfMonth: 1 });
    }
    setTimeout(updateNextRunPreview, 0);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: CreateScheduleDto = {
        name: values.name,
        cycleType: values.cycleType,
        hour: values.hour,
        minute: values.minute,
        isActive: values.isActive ?? true,
      };

      if (values.cycleType === SettlementCycleType.WEEKLY) {
        data.dayOfWeek = values.dayOfWeek;
      } else if (values.cycleType === SettlementCycleType.MONTHLY) {
        data.dayOfMonth = values.dayOfMonth;
      }

      if (existingSchedule) {
        await settlementsApi.updateSchedule(existingSchedule.id, data);
        message.success('자동정산 스케줄이 수정되었습니다.');
      } else {
        await settlementsApi.createSchedule(data);
        message.success('자동정산 스케줄이 생성되었습니다.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || '스케줄 저장에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSchedule) return;

    Modal.confirm({
      title: '스케줄 삭제',
      content: '자동정산 스케줄을 삭제하시겠습니까? 삭제 후에는 자동정산이 실행되지 않습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          await settlementsApi.deleteSchedule(existingSchedule.id);
          message.success('스케줄이 삭제되었습니다.');
          setExistingSchedule(null);
          form.resetFields();
          onSuccess();
          onClose();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || '스케줄 삭제에 실패했습니다.'
          );
        }
      },
    });
  };

  return (
    <Modal
      title="자동정산 설정"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={existingSchedule ? '수정' : '저장'}
      cancelText="취소"
      confirmLoading={loading}
      width={500}
      footer={[
        existingSchedule && (
          <button
            key="delete"
            onClick={handleDelete}
            style={{
              float: 'left',
              border: 'none',
              background: 'none',
              color: '#ff4d4f',
              cursor: 'pointer',
            }}
          >
            스케줄 삭제
          </button>
        ),
        <button
          key="cancel"
          onClick={onClose}
          style={{
            marginRight: 8,
            padding: '4px 15px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          취소
        </button>,
        <button
          key="submit"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '4px 15px',
            border: 'none',
            borderRadius: 6,
            background: '#1890ff',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {loading ? '저장 중...' : existingSchedule ? '수정' : '저장'}
        </button>,
      ]}
    >
      <Alert
        message="자동정산 안내"
        description="설정한 일시에 자동으로 정산이 OPEN 상태로 생성됩니다. 계산/확정/지급은 수동으로 진행해야 합니다."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setTimeout(updateNextRunPreview, 0)}
      >
        <Form.Item
          name="name"
          label="스케줄 이름"
          rules={[{ required: true, message: '스케줄 이름을 입력하세요' }]}
        >
          <Input placeholder="예: 주간 정산" />
        </Form.Item>

        <Form.Item
          name="cycleType"
          label="주기"
          rules={[{ required: true, message: '주기를 선택하세요' }]}
        >
          <Select onChange={handleCycleTypeChange}>
            <Select.Option value={SettlementCycleType.DAILY}>
              {getCycleTypeKorean(SettlementCycleType.DAILY)}
            </Select.Option>
            <Select.Option value={SettlementCycleType.WEEKLY}>
              {getCycleTypeKorean(SettlementCycleType.WEEKLY)}
            </Select.Option>
            <Select.Option value={SettlementCycleType.MONTHLY}>
              {getCycleTypeKorean(SettlementCycleType.MONTHLY)}
            </Select.Option>
          </Select>
        </Form.Item>

        {cycleType === SettlementCycleType.WEEKLY && (
          <Form.Item
            name="dayOfWeek"
            label="요일"
            rules={[{ required: true, message: '요일을 선택하세요' }]}
          >
            <Select options={DAY_OF_WEEK_OPTIONS} />
          </Form.Item>
        )}

        {cycleType === SettlementCycleType.MONTHLY && (
          <Form.Item
            name="dayOfMonth"
            label="날짜"
            rules={[{ required: true, message: '날짜를 선택하세요' }]}
          >
            <Select options={DAY_OF_MONTH_OPTIONS} />
          </Form.Item>
        )}

        <Space style={{ width: '100%' }}>
          <Form.Item
            name="hour"
            label="시간"
            rules={[{ required: true, message: '시간을 선택하세요' }]}
            style={{ width: 150 }}
          >
            <Select options={HOUR_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="minute"
            label="분"
            rules={[{ required: true, message: '분을 선택하세요' }]}
            style={{ width: 150 }}
          >
            <Select options={MINUTE_OPTIONS} />
          </Form.Item>
        </Space>

        <Form.Item name="isActive" label="활성화" valuePropName="checked">
          <Switch checkedChildren="활성" unCheckedChildren="비활성" />
        </Form.Item>

        {nextRunPreview && (
          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text strong>다음 실행 예정</Text>
                <Text>{nextRunPreview}</Text>
              </Space>
            }
            type="success"
            showIcon
          />
        )}
      </Form>
    </Modal>
  );
}
