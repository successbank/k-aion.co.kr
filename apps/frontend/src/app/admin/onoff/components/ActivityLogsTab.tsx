'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  activityLogsService,
  ActivityLog,
  AdminActivityStats,
  ActivityActionLabels,
  ActivityActionColors,
} from '@/services/activity-logs.service';
import { MemberGradeLabels, MemberGradeColors } from '@/types/bonuses';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function ActivityLogsTab() {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<AdminActivityStats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    action?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // 로그 목록 조회
  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const response = await activityLogsService.getAll({
        page,
        limit: pagination.pageSize,
        ...filters,
      });

      setLogs(response.data);
      setPagination({
        current: page,
        pageSize: pagination.pageSize,
        total: response.meta.total,
      });
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      message.error(error.message || '로그 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await activityLogsService.getStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setStats(response);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 필터 변경
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 날짜 범위 변경
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
  };

  // 검색
  const handleSearch = () => {
    fetchLogs(1);
    fetchStats();
  };

  // 초기화
  const handleReset = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 필터 초기화 후 데이터 재조회
  useEffect(() => {
    if (Object.keys(filters).length === 0) {
      fetchLogs(1);
      fetchStats();
    }
  }, [filters]);

  // 초기 로드
  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, []);

  // 활동 유형별 가장 많은 통계 계산
  const topActionStats = stats?.byAction?.slice(0, 5) || [];

  // 테이블 컬럼 정의
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '회원',
      dataIndex: 'member',
      key: 'member',
      width: 150,
      render: (member: ActivityLog['member']) => {
        if (!member) return '-';
        return (
          <Space>
            <span>{member.name}</span>
            <Tag
              color={MemberGradeColors[member.grade as keyof typeof MemberGradeColors] || 'default'}
            >
              {MemberGradeLabels[member.grade as keyof typeof MemberGradeLabels] || member.grade}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '활동유형',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => (
        <Tag color={ActivityActionColors[action] || 'default'}>
          {ActivityActionLabels[action] || action}
        </Tag>
      ),
    },
    {
      title: '대상',
      key: 'target',
      width: 120,
      render: (_: any, record: ActivityLog) => {
        if (!record.targetType) return '-';
        return (
          <Text code>
            {record.targetType} #{record.targetId}
          </Text>
        );
      },
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => ip || '-',
    },
    {
      title: '상세정보',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: Record<string, any> | undefined) => {
        if (!details || Object.keys(details).length === 0) return '-';
        const detailStr = JSON.stringify(details, null, 2);
        return (
          <Tooltip title={<pre style={{ maxHeight: 300, overflow: 'auto' }}>{detailStr}</pre>}>
            <Text ellipsis style={{ maxWidth: 200, cursor: 'pointer' }}>
              {JSON.stringify(details)}
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  // 활동 유형 옵션
  const actionOptions = Object.entries(ActivityActionLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div>
      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card loading={statsLoading}>
            <Statistic
              title="전체"
              value={stats?.total || 0}
              prefix={<BarChartOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card loading={statsLoading}>
            <Statistic
              title="오늘"
              value={stats?.today || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card loading={statsLoading}>
            <Statistic
              title="이번주"
              value={stats?.thisWeek || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card loading={statsLoading}>
            <Statistic
              title="이번달"
              value={stats?.thisMonth || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<CalendarOutlined />}
              suffix="건"
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card loading={statsLoading} title="활동유형별 통계 (Top 5)" size="small">
            <Space wrap>
              {topActionStats.map((stat) => (
                <Tag
                  key={stat.action}
                  color={ActivityActionColors[stat.action] || 'default'}
                >
                  {ActivityActionLabels[stat.action] || stat.action}: {stat.count}
                </Tag>
              ))}
              {topActionStats.length === 0 && <Text type="secondary">데이터 없음</Text>}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 검색 및 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <Select
            placeholder="활동유형"
            style={{ width: 160 }}
            allowClear
            value={filters.action}
            onChange={(value) => handleFilterChange('action', value)}
            options={actionOptions}
          />
          <Input
            placeholder="회원 이름/아이디 검색"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            allowClear
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onPressEnter={handleSearch}
          />
          <RangePicker
            placeholder={['시작일', '종료일']}
            value={
              filters.startDate && filters.endDate
                ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                : null
            }
            onChange={handleDateRangeChange}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            검색
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            초기화
          </Button>
        </Space>
      </Card>

      {/* 로그 테이블 */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}건`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, pageSize: pageSize || 20 }));
              fetchLogs(page);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
