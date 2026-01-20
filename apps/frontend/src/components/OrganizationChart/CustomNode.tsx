import React from 'react';
import { Tag } from 'antd';
import type { CustomNodeElementProps } from 'react-d3-tree';
import { gradeColors, gradeLabels } from './utils';

/**
 * 조직도 트리의 커스텀 노드 컴포넌트
 * 각 회원을 박스 형태로 렌더링하며 등급, 이름, 이메일, PV 정보를 표시
 */
export const CustomNode: React.FC<CustomNodeElementProps> = ({
  nodeDatum,
  toggleNode,
  onNodeClick,
}) => {
  const { name, attributes } = nodeDatum;
  const grade = (attributes?.grade as string) || 'MEMBER';
  const email = String(attributes?.email || '');
  const pv = Number(attributes?.cumulativePv || 0);
  const hasChildren = (nodeDatum.children?.length ?? 0) > 0;

  // 이메일이 너무 길면 축약
  const displayEmail = email.length > 25 ? email.substring(0, 22) + '...' : email;

  return (
    <g>
      {/* 노드 배경 박스 (등급별 색상 테두리) */}
      <rect
        width={200}
        height={100}
        x={-100}
        y={-50}
        rx={8}
        fill="#ffffff"
        stroke={gradeColors[grade] || '#ddd'}
        strokeWidth={2}
        style={{
          cursor: 'pointer',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onNodeClick) {
            // onNodeClick expects a click event, but we use the wrapper's callback pattern
            (onNodeClick as () => void)();
          }
        }}
      />

      {/* 등급 배지 (foreignObject로 Ant Design Tag 렌더링) */}
      <foreignObject x={-95} y={-40} width={145} height={25}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            pointerEvents: 'none',
          }}
        >
          <Tag
            color={gradeColors[grade] || '#999'}
            style={{ margin: 0, fontSize: '11px', fontWeight: 400 }}
          >
            {gradeLabels[grade] || grade}
          </Tag>
        </div>
      </foreignObject>

      {/* 이름 */}
      <text
        x={0}
        y={-5}
        textAnchor="middle"
        fill="#000000"
        fontSize={14}
        fontWeight="400"
        style={{ pointerEvents: 'none' }}
      >
        {name}
      </text>

      {/* 이메일 */}
      <text
        x={0}
        y={12}
        textAnchor="middle"
        fill="#666666"
        fontSize={11}
        style={{ pointerEvents: 'none' }}
      >
        {displayEmail}
      </text>

      {/* 센터이름 (없으면 "미지정" 표시) */}
      <text
        x={0}
        y={30}
        textAnchor="middle"
        fill="#888888"
        fontSize={10}
        style={{ pointerEvents: 'none' }}
      >
        {(attributes?.centerName as string) || '미지정'}
      </text>

      {/* 확장/축소 버튼 (자식이 있는 경우에만 표시) */}
      {hasChildren && (
        <g>
          <circle
            cx={0}
            cy={55}
            r={12}
            fill={gradeColors[grade] || '#999'}
            stroke="#ffffff"
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              if (toggleNode) {
                toggleNode();
              }
            }}
          />
          <text
            x={0}
            y={60}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={14}
            fontWeight="400"
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
          >
            {(nodeDatum as { __rd3t?: { collapsed?: boolean } }).__rd3t?.collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
};
