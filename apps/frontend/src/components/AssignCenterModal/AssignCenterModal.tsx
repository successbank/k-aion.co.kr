'use client';

import { useState, useEffect } from 'react';
import { Modal, Select, Typography, Alert, Space, Tag } from 'antd';
import { ShopOutlined, UserOutlined } from '@ant-design/icons';
import { membersService, CenterStats } from '@/services/members.service';

const { Text, Title } = Typography;

interface AssignCenterModalProps {
  visible: boolean;
  selectedMemberIds: number[];
  selectedMemberNames?: string[];
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AssignCenterModal({
  visible,
  selectedMemberIds,
  selectedMemberNames = [],
  onCancel,
  onSuccess,
}: AssignCenterModalProps) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<CenterStats[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCenters, setLoadingCenters] = useState(false);

  // 센터 목록 조회
  const fetchCenters = async () => {
    try {
      setLoadingCenters(true);
      const response = await membersService.getCenterStats();
      setCenters(response.centers);
    } catch (err: any) {
      console.error('Failed to fetch centers:', err);
      setError('센터 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingCenters(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCenters();
      setSelectedCenter(null);
      setError(null);
    }
  }, [visible]);

  // 센터 지정 처리
  const handleAssign = async () => {
    if (!selectedCenter) {
      setError('센터를 선택해주세요.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError('선택된 회원이 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await membersService.assignCenterBulk({
        memberIds: selectedMemberIds,
        centerName: selectedCenter,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to assign center:', err);
      setError(err.message || '센터 지정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ShopOutlined style={{ color: '#eb2f96' }} />
          <span>센터 일괄 지정</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleAssign}
      okText="지정"
      cancelText="취소"
      confirmLoading={loading}
      okButtonProps={{ disabled: !selectedCenter || selectedMemberIds.length === 0 }}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 선택된 회원 정보 */}
        <div
          style={{
            background: '#f5f5f5',
            padding: '12px 16px',
            borderRadius: 8,
          }}
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">
              <UserOutlined style={{ marginRight: 8 }} />
              선택된 회원
            </Text>
            <Title level={4} style={{ margin: 0 }}>
              {selectedMemberIds.length}명
            </Title>
            {selectedMemberNames.length > 0 && selectedMemberNames.length <= 5 && (
              <div style={{ marginTop: 8 }}>
                {selectedMemberNames.map((name, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>
                    {name}
                  </Tag>
                ))}
              </div>
            )}
            {selectedMemberNames.length > 5 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedMemberNames.slice(0, 5).join(', ')} 외 {selectedMemberNames.length - 5}명
              </Text>
            )}
          </Space>
        </div>

        {/* 센터 선택 */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            지정할 센터 선택
          </Text>
          <Select
            placeholder="센터를 선택하세요"
            style={{ width: '100%' }}
            value={selectedCenter}
            onChange={setSelectedCenter}
            loading={loadingCenters}
            showSearch
            filterOption={(input, option) =>
              (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={centers.map((center) => ({
              value: center.centerName,
              label: (
                <Space>
                  <ShopOutlined style={{ color: '#eb2f96' }} />
                  <span>{center.centerName}</span>
                  <Tag color="blue">{center.memberCount}명</Tag>
                </Space>
              ),
            }))}
          />
        </div>

        {/* 안내 메시지 */}
        <Alert
          type="info"
          showIcon
          message="센터 지정 안내"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>선택한 회원들이 지정된 센터로 일괄 이동됩니다.</li>
              <li>기존에 다른 센터에 소속된 회원은 새 센터로 변경됩니다.</li>
              <li>ADMIN 및 CENTER 등급 회원은 지정 대상에서 제외됩니다.</li>
            </ul>
          }
        />

        {/* 에러 메시지 */}
        {error && <Alert type="error" message={error} showIcon />}
      </Space>
    </Modal>
  );
}
