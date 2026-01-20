'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Divider,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/api';
import {
  bonusSimulatorService,
  BonusSimulationResponse,
  SimulatedBonus,
  BONUS_TYPE_COLORS,
  GRADE_LABELS,
} from '@/services/bonus-simulator.service';

const { Option } = Select;

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pv: number;
  stock: number;
  isActive: boolean;
}

interface Member {
  id: number;
  username: string;
  name: string;
  grade: string;
  cumulativePv: number;
}

interface SaleSimulationTabProps {
  selectedMember: Member | null;
}

const bonusTypeLabels: Record<string, string> = {
  SALES: '판매 보너스',
  SALES_MANAGEMENT: '판매 관리 보너스',
  LICENSE: '판권 보너스',
  LICENSE_MANAGEMENT: '판권 관리 보너스',
  SHARING: '공유 보너스',
  BRANCH_OPERATION: '센터 운영 보너스',
};

export default function SaleSimulationTab({ selectedMember }: SaleSimulationTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<BonusSimulationResponse | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // 회원이 변경되면 시뮬레이션 결과 초기화
    setSimulationResult(null);
  }, [selectedMember]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/v1/products', {
        params: { isActive: true, limit: 1000 },
      });
      setProducts(data.data || []);
    } catch (error) {
      message.error('제품 목록 조회 실패');
    }
  };

  const handleProductChange = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    setSimulationResult(null);
  };

  const handleSimulate = async () => {
    if (!selectedMember || !selectedProduct) {
      message.warning('회원과 제품을 선택해주세요');
      return;
    }

    try {
      setLoading(true);
      const result = await bonusSimulatorService.simulateSale({
        sellerId: selectedMember.id,
        productId: selectedProduct.id,
        quantity,
      });
      setSimulationResult(result);
    } catch (error: any) {
      message.error('시뮬레이션 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  const renderBonusCard = (bonus: SimulatedBonus) => {
    const color = BONUS_TYPE_COLORS[bonus.type] || '#8c8c8c';

    return (
      <Card
        key={bonus.type}
        size="small"
        style={{
          borderLeft: `4px solid ${color}`,
          marginBottom: 12,
        }}
      >
        <Row align="middle" justify="space-between">
          <Col span={8}>
            <div style={{ fontWeight: 600, color }}>{bonus.typeName}</div>
            {bonus.recipient ? (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                수령자: {bonus.recipient.name} ({bonus.recipient.relation})
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                해당 없음
              </div>
            )}
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            {bonus.qualified ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                자격 충족
              </Tag>
            ) : (
              <Tag color="default" icon={<CloseCircleOutlined />}>
                해당 없음
              </Tag>
            )}
            {bonus.qualificationReason && (
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                {bonus.qualificationReason}
              </div>
            )}
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: bonus.qualified ? color : '#ccc' }}>
              {bonus.amount.toLocaleString()}원
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div>
      {!selectedMember && (
        <Alert
          type="info"
          message="회원을 먼저 선택해주세요"
          description="상단의 회원 검색에서 시뮬레이션할 회원을 선택하세요."
          showIcon
          className="mb-4"
        />
      )}

      <Row gutter={[16, 16]}>
        {/* 제품 선택 */}
        <Col xs={24} md={10}>
          <Card title="제품 선택" size="small">
            <Select
              showSearch
              placeholder="제품 선택"
              className="w-full"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleProductChange}
              value={selectedProduct?.id}
              disabled={!selectedMember}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.code})`,
              }))}
            />

            {selectedProduct && (
              <div className="mt-4">
                <Divider className="my-2" />
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic
                      title="가격"
                      value={selectedProduct.price}
                      suffix="원"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="PV"
                      value={selectedProduct.pv}
                      suffix="PV"
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>

        {/* 수량 및 계산 */}
        <Col xs={24} md={6}>
          <Card title="수량" size="small">
            <InputNumber
              min={1}
              max={100}
              value={quantity}
              onChange={(value) => setQuantity(value || 1)}
              className="w-full"
              disabled={!selectedMember || !selectedProduct}
            />
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleSimulate}
              loading={loading}
              className="w-full mt-4"
              disabled={!selectedMember || !selectedProduct}
              style={{ backgroundColor: '#7CB342' }}
            >
              보너스 계산
            </Button>
          </Card>
        </Col>

        {/* 총 금액 요약 */}
        <Col xs={24} md={8}>
          <Card title="거래 요약" size="small">
            {selectedProduct ? (
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic
                    title="총 가격"
                    value={selectedProduct.price * quantity}
                    suffix="원"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="총 PV"
                    value={selectedProduct.pv * quantity}
                    suffix="PV"
                    valueStyle={{ fontSize: 16, color: '#7CB342' }}
                  />
                </Col>
              </Row>
            ) : (
              <Empty description="제품을 선택하세요" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 시뮬레이션 결과 */}
      {loading && (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-2">보너스 계산 중...</div>
        </div>
      )}

      {simulationResult && !loading && (
        <Card
          title={
            <Space>
              <DollarOutlined style={{ color: '#7CB342' }} />
              보너스 시뮬레이션 결과
            </Space>
          }
          className="mt-4"
          extra={
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7CB342' }}>
              총 예상 보너스: {simulationResult.totalBonus.toLocaleString()}원
            </div>
          }
        >
          <Alert
            type="info"
            message="시뮬레이션 안내"
            description="이 결과는 가상 시뮬레이션으로, 실제 보너스 지급과 다를 수 있습니다. 판권 보너스는 별도 이벤트(승급)에서, 센터 운영 보너스는 센터 소속 회원의 매출 시 발생합니다."
            showIcon
            className="mb-4"
          />

          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <div className="font-semibold mb-3">6가지 보너스 유형별 계산 결과</div>
              {simulationResult.bonuses.map(renderBonusCard)}
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="보너스 요약"
                size="small"
                style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <Statistic
                  title="판매자"
                  value={simulationResult.seller.name}
                  valueStyle={{ fontSize: 16 }}
                />
                <Divider className="my-2" />
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic
                      title="실제 등급"
                      valueRender={() => (
                        <Tag>{GRADE_LABELS[simulationResult.seller.actualGrade]}</Tag>
                      )}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="유효 등급"
                      valueRender={() => (
                        <Tag
                          color={
                            simulationResult.seller.effectiveGrade !==
                            simulationResult.seller.actualGrade
                              ? 'orange'
                              : 'default'
                          }
                        >
                          {GRADE_LABELS[simulationResult.seller.effectiveGrade]}
                        </Tag>
                      )}
                    />
                  </Col>
                </Row>
                <Divider className="my-2" />
                <Statistic
                  title="총 예상 보너스"
                  value={simulationResult.totalBonus}
                  suffix="원"
                  valueStyle={{ fontSize: 20, color: '#52c41a', fontWeight: 700 }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  * 판매 보너스 + 공유 보너스 합계
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
