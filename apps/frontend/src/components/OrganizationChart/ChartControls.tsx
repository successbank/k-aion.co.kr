import React from 'react';
import { Button, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined } from '@ant-design/icons';
import type { ChartControlsProps } from './types';
import styles from './styles.module.css';

/**
 * 조직도 확대/축소 및 초기화 컨트롤
 */
export const ChartControls: React.FC<ChartControlsProps> = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className={styles.controls}>
      <Space>
        <Button icon={<ZoomInOutlined />} onClick={onZoomIn} title="확대" size="small" />
        <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} title="축소" size="small" />
        <Button icon={<ExpandOutlined />} onClick={onReset} title="초기화" size="small">
          초기화
        </Button>
      </Space>
    </div>
  );
};
