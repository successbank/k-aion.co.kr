'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Tree from 'react-d3-tree';
import type { RawNodeDatum } from 'react-d3-tree';
import { CustomNode } from './CustomNode';
import { ChartControls } from './ChartControls';
import { transformToOrgChartData } from './utils';
import type { OrganizationChartProps, TreeMember } from './types';
import styles from './styles.module.css';

/**
 * 조직도 트리 컴포넌트
 * react-d3-tree를 사용하여 위에서 아래로 흐르는 조직도 형태로 회원 계보를 시각화
 */
export const OrganizationChart: React.FC<OrganizationChartProps> = ({
  data,
  onNodeClick,
  initialDepth = 2,
  height = 600,
}) => {
  const [translate, setTranslate] = useState({ x: 0, y: 100 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // TreeMember 데이터를 react-d3-tree 형식으로 변환
  const treeData = useMemo(() => (data ? transformToOrgChartData(data) : null), [data]);

  // 컨테이너 크기에 따라 트리 중앙 정렬
  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
    }
  }, []);

  // RawNodeDatum을 TreeMember로 역변환하는 헬퍼 함수
  const convertNodeToMember = useCallback((node: RawNodeDatum): TreeMember => ({
    id: node.attributes?.id as number,
    name: node.name,
    email: node.attributes?.email as string | null,
    username: node.attributes?.username as string | undefined,
    grade: node.attributes?.grade as string,
    cumulativePv: node.attributes?.cumulativePv as number | undefined,
    children: node.children ? node.children.map(convertNodeToMember) : [],
  }), []);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(
    (nodeData: RawNodeDatum) => {
      if (onNodeClick) {
        onNodeClick(convertNodeToMember(nodeData));
      }
    },
    [onNodeClick, convertNodeToMember],
  );

  // 확대
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.2, 3));
  }, []);

  // 축소
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.2, 0.3));
  }, []);

  // 초기화
  const handleReset = useCallback(() => {
    setZoom(1);
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 100 });
    }
  }, []);

  if (!treeData) {
    return (
      <div className={styles.chartContainer} style={{ height }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#8c8c8c',
          }}
        >
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer} ref={containerRef} style={{ height }}>
      <ChartControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
      <Tree
        data={treeData}
        translate={translate}
        zoom={zoom}
        orientation="vertical"
        pathFunc="step"
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        nodeSize={{ x: 250, y: 150 }}
        renderCustomNodeElement={(nodeProps) => (
          <CustomNode {...nodeProps} onNodeClick={() => handleNodeClick(nodeProps.nodeDatum)} />
        )}
        enableLegacyTransitions={false}
        transitionDuration={0}
        collapsible
        initialDepth={initialDepth}
        depthFactor={150}
        scaleExtent={{ min: 0.3, max: 3 }}
        onUpdate={(e) => {
          if (e?.translate) {
            setTranslate(e.translate);
          }
          if (e?.zoom !== undefined) {
            setZoom(e.zoom);
          }
        }}
        draggable
        zoomable
      />
    </div>
  );
};
