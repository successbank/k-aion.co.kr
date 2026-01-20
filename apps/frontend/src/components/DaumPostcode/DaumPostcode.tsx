'use client';

import { Button, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
      };
    };
  }
}

export interface DaumPostcodeResult {
  zonecode: string; // 우편번호
  address: string; // 기본 주소
  addressType: 'R' | 'J'; // R: 도로명, J: 지번
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  bname: string; // 법정동/법정리 이름
  buildingName: string; // 건물명
  apartment: 'Y' | 'N'; // 공동주택 여부
  sido: string; // 시도
  sigungu: string; // 시군구
}

export interface AddressData {
  postalCode: string;
  address: string;
}

interface DaumPostcodeProps {
  onComplete: (data: AddressData) => void;
  postalCode?: string;
  address?: string;
}

export default function DaumPostcode({
  onComplete,
  postalCode = '',
  address = '',
}: DaumPostcodeProps) {
  const handleSearch = () => {
    if (typeof window === 'undefined' || !window.daum) {
      console.error('Daum Postcode API가 로드되지 않았습니다.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeResult) => {
        // 도로명 주소 우선, 없으면 지번 주소 사용
        const fullAddress = data.roadAddress || data.jibunAddress;

        onComplete({
          postalCode: data.zonecode,
          address: fullAddress,
        });
      },
      width: '100%',
      height: '100%',
    }).open();
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Space.Compact style={{ width: '100%' }}>
        <Input value={postalCode} placeholder="우편번호" readOnly style={{ width: 120 }} />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          style={{
            background: 'linear-gradient(135deg, #7CB342 0%, #558B2F 100%)',
            border: 'none',
          }}
        >
          주소 검색
        </Button>
      </Space.Compact>
      <Input value={address} placeholder="주소를 검색해주세요" readOnly />
    </Space>
  );
}
