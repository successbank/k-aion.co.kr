'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Spin, Empty, Alert, Collapse } from 'antd';
import { PercentageOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';
import {
  bonusSimulatorService,
  CommissionRateSummaryResponse,
  BONUS_TYPE_COLORS,
  GRADE_LABELS,
  BonusType,
} from '@/services/bonus-simulator.service';

export default function CommissionRateCompareTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommissionRateSummaryResponse | null>(null);

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  const fetchCommissionRates = async () => {
    try {
      setLoading(true);
      const result = await bonusSimulatorService.getCommissionRateSummary();
      setData(result);
    } catch (error: any) {
      message.error('수당률 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <div className="mt-2">수당률 정보 로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return <Empty description="수당률 데이터를 불러올 수 없습니다" />;
  }

  const columns = [
    {
      title: '보너스 유형',
      dataIndex: 'bonusTypeName',
      key: 'bonusTypeName',
      render: (name: string, record: any) => (
        <Tag color={BONUS_TYPE_COLORS[record.bonusType as BonusType] || '#8c8c8c'}>
          {name}
        </Tag>
      ),
    },
    {
      title: '금액 유형',
      key: 'amountType',
      render: (_: any, record: any) => (
        record.isGradeTiered ? (
          <Tag color="gold">등급별 차등</Tag>
        ) : (
          <Tag color="blue">고정 금액</Tag>
        )
      ),
    },
    {
      title: '기본 금액',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      render: (amount: number, record: any) => {
        if (record.isGradeTiered && record.tiers?.length > 0) {
          const amounts = record.tiers.map((t: any) => t.amount);
          const min = Math.min(...amounts);
          const max = Math.max(...amounts);
          return (
            <span style={{ fontWeight: 600 }}>
              {min.toLocaleString()}원 ~ {max.toLocaleString()}원
            </span>
          );
        }
        return (
          <span style={{ fontWeight: 600, color: '#E53935' }}>
            {amount?.toLocaleString() || '-'}원
          </span>
        );
      },
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <span style={{ color: '#666', fontSize: 12 }}>{desc || '-'}</span>
      ),
    },
  ];

  const renderTierTable = (rate: any) => {
    if (!rate.isGradeTiered || !rate.tiers || rate.tiers.length === 0) {
      return null;
    }

    const tierColumns = [
      {
        title: '등급',
        dataIndex: 'gradeName',
        key: 'gradeName',
        render: (name: string) => <Tag>{name}</Tag>,
      },
      {
        title: '금액',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => (
          <span style={{ fontWeight: 600, color: '#E53935' }}>
            {amount.toLocaleString()}원
          </span>
        ),
      },
    ];

    return (
      <Table
        columns={tierColumns}
        dataSource={rate.tiers}
        pagination={false}
        size="small"
        rowKey={(record) => record.grade}
      />
    );
  };

  const collapseItems = data.rates.map((rate) => ({
    key: rate.bonusType,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Tag color={BONUS_TYPE_COLORS[rate.bonusType as BonusType] || '#8c8c8c'}>
          {rate.bonusTypeName}
        </Tag>
        <span>
          {rate.isGradeTiered && rate.tiers?.length
            ? `${Math.min(...rate.tiers.map((t) => t.amount)).toLocaleString()}원 ~ ${Math.max(...rate.tiers.map((t) => t.amount)).toLocaleString()}원`
            : `${rate.baseAmount?.toLocaleString() || 0}원`}
        </span>
        {rate.isGradeTiered && <Tag color="gold" style={{ marginLeft: 8 }}>등급별 차등</Tag>}
      </div>
    ),
    children: (
      <div>
        <p style={{ color: '#666', marginBottom: 16 }}>{rate.description}</p>
        {rate.isGradeTiered && rate.tiers?.length > 0 ? (
          <>
            <div className="font-semibold mb-2">등급별 금액:</div>
            {renderTierTable(rate)}
          </>
        ) : (
          <Alert
            message={`고정 금액: ${rate.baseAmount?.toLocaleString() || 0}원`}
            type="success"
            showIcon
          />
        )}
      </div>
    ),
  }));

  return (
    <div>
      <Alert
        type="info"
        message="수당률 비교"
        description="현재 활성화된 6가지 보너스 유형의 수당률 설정을 확인합니다. 수당률 변경은 '수당률 설정' 메뉴에서 가능합니다."
        showIcon
        className="mb-4"
        icon={<PercentageOutlined />}
      />

      <Card title="보너스 유형별 수당률 요약" size="small">
        <Table
          columns={columns}
          dataSource={data.rates}
          pagination={false}
          rowKey="bonusType"
          size="small"
        />
      </Card>

      <Card title="상세 수당률 정보" size="small" className="mt-4">
        <Collapse items={collapseItems} />
      </Card>

      {/* 보너스 유형 설명 카드 */}
      <Card title="보너스 유형 설명" size="small" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#f6ffed', borderLeft: '4px solid #E53935' }}
          >
            <div className="font-semibold" style={{ color: '#E53935' }}>
              판매 보너스 (SALES)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              본인이 직접 제품을 판매했을 때 지급되는 보너스입니다.
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#e6f7ff', borderLeft: '4px solid #1890ff' }}
          >
            <div className="font-semibold" style={{ color: '#1890ff' }}>
              판매 관리 보너스 (SALES_MANAGEMENT)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              후원계보 상위 회원(후원인)이 하위 회원 판매 시 지급됩니다.
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#f9f0ff', borderLeft: '4px solid #722ed1' }}
          >
            <div className="font-semibold" style={{ color: '#722ed1' }}>
              판권 보너스 (LICENSE)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              하위 회원을 육성하여 승급시켰을 때 등급별로 차등 지급됩니다.
              <br />
              3팀 구성 조건이 필요합니다.
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#fff0f6', borderLeft: '4px solid #eb2f96' }}
          >
            <div className="font-semibold" style={{ color: '#eb2f96' }}>
              판권 관리 보너스 (LICENSE_MANAGEMENT)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              추천계보 상위 회원에게 하위 회원의 육성 실적에 따라 지급됩니다.
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#fffbe6', borderLeft: '4px solid #faad14' }}
          >
            <div className="font-semibold" style={{ color: '#faad14' }}>
              공유 보너스 (SHARING)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              매니저 이상 등급의 회원이 조건 충족 시 지급됩니다.
            </div>
          </div>

          <div
            className="p-3 rounded"
            style={{ backgroundColor: '#e6fffb', borderLeft: '4px solid #13c2c2' }}
          >
            <div className="font-semibold" style={{ color: '#13c2c2' }}>
              센터 운영 보너스 (BRANCH_OPERATION)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              센터 소속 회원이 매출을 올릴 때 해당 센터에 지급되는 운영 지원금입니다.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
