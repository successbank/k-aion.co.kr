'use client';

import { useState, useEffect } from 'react';
import { Timeline, Spin, Empty, Tag, Pagination, Card, Statistic, Row, Col } from 'antd';
import {
  LoginOutlined,
  ShoppingOutlined,
  GiftOutlined,
  RiseOutlined,
  EditOutlined,
  LockOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  activityLogsService,
  ActivityLog,
  ActivityActionLabels,
  ActivityActionColors,
  ActivityAction,
} from '@/services/activity-logs.service';

interface ActivityHistoryTabProps {
  memberId: number;
}

// 활동 유형별 아이콘
const getActionIcon = (action: string) => {
  switch (action) {
    case ActivityAction.LOGIN:
    case ActivityAction.LOGOUT:
      return <LoginOutlined />;
    case ActivityAction.SALE_CREATED:
    case ActivityAction.SALE_CONFIRMED:
      return <ShoppingOutlined />;
    case ActivityAction.BONUS_RECEIVED:
      return <GiftOutlined />;
    case ActivityAction.GRADE_CHANGED:
      return <RiseOutlined />;
    case ActivityAction.PROFILE_UPDATED:
      return <EditOutlined />;
    case ActivityAction.PASSWORD_CHANGED:
    case ActivityAction.PASSWORD_RESET:
      return <LockOutlined />;
    case ActivityAction.ORDER_CREATED:
      return <ShoppingCartOutlined />;
    case ActivityAction.ORDER_CONFIRMED:
      return <CheckCircleOutlined />;
    default:
      return <CheckCircleOutlined />;
  }
};

export function ActivityHistoryTab({ memberId }: ActivityHistoryTabProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [stats, setStats] = useState<{
    totalActivities: number;
    byAction: Array<{ action: string; count: number }>;
  } | null>(null);

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await activityLogsService.getMemberActivityHistory(memberId, {
        page,
        limit: pagination.pageSize,
      });
      setLogs(response.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.meta.total,
      });
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await activityLogsService.getMemberStats(memberId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load activity stats:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [memberId]);

  if (loading && logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 활동 통계 */}
      {stats && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="총 활동" value={stats.totalActivities} />
            </Col>
            <Col span={16}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>활동 유형별</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {stats.byAction.slice(0, 5).map((item) => (
                  <Tag
                    key={item.action}
                    color={ActivityActionColors[item.action] || 'default'}
                  >
                    {ActivityActionLabels[item.action] || item.action}: {item.count}
                  </Tag>
                ))}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 활동 타임라인 */}
      {logs.length === 0 ? (
        <Empty description="활동 이력이 없습니다" />
      ) : (
        <>
          <Timeline
            items={logs.map((log) => ({
              color: ActivityActionColors[log.action] || 'gray',
              dot: getActionIcon(log.action),
              children: (
                <div>
                  <div style={{ fontWeight: 500 }}>
                    <Tag color={ActivityActionColors[log.action] || 'default'}>
                      {ActivityActionLabels[log.action] || log.action}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {new Date(log.createdAt).toLocaleString('ko-KR')}
                  </div>
                  {log.details && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      {typeof log.details === 'object'
                        ? Object.entries(log.details)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                        : String(log.details)}
                    </div>
                  )}
                  {log.ipAddress && (
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                      IP: {log.ipAddress}
                    </div>
                  )}
                </div>
              ),
            }))}
          />

          {/* 페이지네이션 */}
          {pagination.total > pagination.pageSize && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page) => loadLogs(page)}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityHistoryTab;
