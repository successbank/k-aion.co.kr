'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tabs,
  Tree,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Typography,
  Spin,
  Empty,
  message,
  Button,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SearchOutlined,
  TrophyOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { genealogyService } from '@/services/genealogy.service';
import { membersService } from '@/services/members.service';
import type { TeamStats, RecommenderStats } from '@/services/genealogy.service';
import type { SearchMemberResult } from '@/services/members.service';
import { MemberSelectModal } from '@/components/MemberSelectModal';

const { Title, Text } = Typography;

// Stage 4 DESIGN-004 (2026-04-15): 신 4단계 영업 + ADMIN 매핑
// 이전: 5단계 (MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF) — schema와 시대 차이
// 신: 4단계 영업 (SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER) + ADMIN
const gradeColors: Record<string, string> = {
  ADMIN: '#ff4d4f',
  CENTER: '#fa8c16',
  BRANCH_MANAGER: '#faad14',
  TEAM_LEADER: '#52c41a',
  SALESPERSON: '#1890ff',
};

const gradeLabels: Record<string, string> = {
  ADMIN: '관리자',
  CENTER: '센터',
  BRANCH_MANAGER: '지사장',
  TEAM_LEADER: '팀장',
  SALESPERSON: '판매원',
};

interface Member {
  id: number;
  name: string;
  email: string;
  grade: string;
  children: Member[];
}

function buildTreeData(data: Member): DataNode {
  return {
    title: (
      <Space>
        <Tag color={gradeColors[data.grade]}>{gradeLabels[data.grade]}</Tag>
        <Text strong>{data.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          ({data.email})
        </Text>
      </Space>
    ),
    key: String(data.id),
    children: data.children?.map((child) => buildTreeData(child)) || [],
    icon: <UserOutlined />,
  };
}

export default function OrganizationPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommender');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | undefined>();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [recommenderTree, setRecommenderTree] = useState<Member | null>(null);
  const [sponsorTree, setSponsorTree] = useState<Member | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [recommenderStats, setRecommenderStats] = useState<RecommenderStats | null>(null);

  // 검색 관련 상태
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMemberResult[]>([]);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [viewingSearchedMember, setViewingSearchedMember] = useState(false);
  const [viewingMemberName, setViewingMemberName] = useState<string>('');

  // 트리 필터링 함수
  const filterTree = (node: Member, search: string, grade?: string): Member | null => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      node.name.toLowerCase().includes(searchLower) ||
      node.email?.toLowerCase().includes(searchLower);

    const matchesGrade = !grade || node.grade === grade;

    // 자식 노드 필터링
    const filteredChildren =
      node.children
        ?.map((child) => filterTree(child, search, grade))
        .filter((child): child is Member => child !== null) || [];

    // 현재 노드가 검색/등급 조건을 만족하면 포함
    if (matchesSearch && matchesGrade) {
      return { ...node, children: filteredChildren };
    }

    // 자식 중 하나라도 조건을 만족하면 부모도 포함 (경로 유지)
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    return null;
  };

  // 필터링된 트리 데이터
  const filteredRecommenderTree = useMemo(() => {
    console.log('[DEBUG-MEMO] useMemo 실행됨');
    console.log('[DEBUG-MEMO] viewingSearchedMember:', viewingSearchedMember);
    console.log('[DEBUG-MEMO] searchTerm:', searchTerm);
    console.log('[DEBUG-MEMO] gradeFilter:', gradeFilter);
    console.log(
      '[DEBUG-MEMO] recommenderTree 루트:',
      recommenderTree?.name,
      'id:',
      recommenderTree?.id,
    );

    if (!recommenderTree) {
      console.log('[DEBUG-MEMO] recommenderTree가 null - null 반환');
      return null;
    }

    // API 검색으로 다른 회원의 조직도를 보고 있을 때는 검색어 필터 건너뛰기
    if (viewingSearchedMember) {
      console.log('[DEBUG-MEMO] viewingSearchedMember=true 분기 진입');
      if (!gradeFilter) {
        console.log('[DEBUG-MEMO] gradeFilter 없음 - recommenderTree 직접 반환');
        return recommenderTree;
      }
      console.log('[DEBUG-MEMO] gradeFilter 있음 - filterTree 호출');
      return filterTree(recommenderTree, '', gradeFilter);
    }

    if (!searchTerm && !gradeFilter) {
      console.log('[DEBUG-MEMO] 검색어/필터 없음 - recommenderTree 직접 반환');
      return recommenderTree;
    }
    console.log('[DEBUG-MEMO] filterTree 호출됨');
    return filterTree(recommenderTree, searchTerm, gradeFilter);
  }, [recommenderTree, searchTerm, gradeFilter, viewingSearchedMember]);

  const filteredSponsorTree = useMemo(() => {
    if (!sponsorTree) return null;

    // API 검색으로 다른 회원의 조직도를 보고 있을 때는 검색어 필터 건너뛰기
    if (viewingSearchedMember) {
      if (!gradeFilter) return sponsorTree;
      return filterTree(sponsorTree, '', gradeFilter);
    }

    if (!searchTerm && !gradeFilter) return sponsorTree;
    return filterTree(sponsorTree, searchTerm, gradeFilter);
  }, [sponsorTree, searchTerm, gradeFilter, viewingSearchedMember]);

  useEffect(() => {
    // user 상태가 복원된 후에만 데이터 로드 (Zustand persist 레이스 컨디션 방지)
    if (user?.id) {
      const token = localStorage.getItem('token');
      if (token) {
        loadOrganizationTree();
      }
    }
  }, [user?.id]);

  const loadOrganizationTree = async () => {
    // 토큰 존재 여부 확인
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      window.location.href = '/login';
      return;
    }

    // 인증 확인 (Zustand 복원 대기)
    if (!user?.id) return;

    setLoading(true);
    try {
      const userId = parseInt(user.id, 10);

      // 추천 계보 데이터 로드
      const recommenderData = await genealogyService.getGenealogyTree(userId, 5, 'recommender');
      setRecommenderTree(recommenderData);

      // 후원 계보 데이터 로드
      const sponsorData = await genealogyService.getGenealogyTree(userId, 5, 'sponsor');
      setSponsorTree(sponsorData);

      // 팀 통계 로드
      const teamStatsData = await genealogyService.getTeamStats(userId);
      setTeamStats(teamStatsData);

      // 추천 통계 로드
      const recommenderStatsData = await genealogyService.getRecommenderStats(userId);
      setRecommenderStats(recommenderStatsData);

      message.success('조직도를 불러왔습니다');
    } catch (error: any) {
      console.error('조직도 로딩 에러:', error);
      message.error(error.message || '조직도 로딩에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 회원 검색 핸들러
  const handleSearch = async (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      message.warning('검색어를 입력해주세요');
      return;
    }

    setIsSearching(true);
    try {
      const response = await membersService.searchMembers(trimmedValue, 50);

      if (response.total === 0) {
        message.info('검색 결과가 없습니다');
      } else if (response.total === 1) {
        // 단일 결과 - 바로 트리 로드
        await loadMemberTree(response.data[0]);
      } else {
        // 동명이인 - 모달 표시
        setSearchResults(response.data);
        setShowSelectModal(true);
      }
    } catch (error: any) {
      console.error('회원 검색 에러:', error);
      message.error(error.message || '회원 검색에 실패했습니다');
    } finally {
      setIsSearching(false);
    }
  };

  // 특정 회원의 트리 로드
  const loadMemberTree = async (member: SearchMemberResult) => {
    console.log('[DEBUG-1] loadMemberTree 호출됨, member:', member);
    console.log('[DEBUG-2] member.id 타입:', typeof member.id, '값:', member.id);

    setLoading(true);
    setShowSelectModal(false);
    try {
      const recommenderData = await genealogyService.getGenealogyTree(
        member.id,
        100,
        'recommender',
      );
      console.log('[DEBUG-3] API 응답 recommenderData:', JSON.stringify(recommenderData, null, 2));
      console.log('[DEBUG-4] recommenderData 루트 이름:', recommenderData?.name);

      const sponsorData = await genealogyService.getGenealogyTree(member.id, 100, 'sponsor');
      console.log('[DEBUG-5] API 응답 sponsorData:', JSON.stringify(sponsorData, null, 2));

      setRecommenderTree(recommenderData);
      setSponsorTree(sponsorData);
      setViewingSearchedMember(true);
      setViewingMemberName(member.name);
      setSearchTerm(''); // 검색어 초기화 - 상단 계보 노출 방지

      console.log('[DEBUG-6] 상태 업데이트 완료 - viewingSearchedMember: true, searchTerm: ""');
      message.success(`${member.name}님의 조직도를 불러왔습니다`);
    } catch (error: any) {
      console.error('[DEBUG-ERROR] 회원 조직도 로딩 에러:', error);
      message.error(error.message || '회원 조직도 로딩에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 내 조직도로 돌아가기
  const handleBackToMyOrg = () => {
    setViewingSearchedMember(false);
    setViewingMemberName('');
    setSearchTerm('');
    loadOrganizationTree();
  };

  // 모달에서 회원 선택
  const handleMemberSelect = (member: SearchMemberResult) => {
    loadMemberTree(member);
  };

  const onSelect = (selectedKeys: React.Key[], info: any) => {
    console.log('Selected:', selectedKeys, info);
    // TODO: 선택한 회원의 상세 정보 표시
  };

  // 필터링된 트리 데이터를 DataNode로 변환
  const recommenderTreeData = filteredRecommenderTree
    ? [buildTreeData(filteredRecommenderTree)]
    : [];
  const sponsorTreeData = filteredSponsorTree ? [buildTreeData(filteredSponsorTree)] : [];

  console.log('[DEBUG-RENDER] recommenderTreeData 길이:', recommenderTreeData.length);
  console.log('[DEBUG-RENDER] recommenderTreeData 루트:', recommenderTreeData[0]?.key);

  // 통계 계산
  const calculateStats = (
    data: Member | null,
  ): { total: number; byGrade: Record<string, number> } => {
    if (!data) {
      return { total: 0, byGrade: {} };
    }

    let total = 1; // 본인 포함
    const byGrade: Record<string, number> = { [data.grade]: 1 };

    const traverse = (member: Member) => {
      member.children?.forEach((child) => {
        total++;
        byGrade[child.grade] = (byGrade[child.grade] || 0) + 1;
        traverse(child);
      });
    };

    traverse(data);
    return { total, byGrade };
  };

  const stats = calculateStats(recommenderTree);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ApartmentOutlined /> 조직도
        </Title>
        <Text type="secondary">추천 계보와 후원 계보를 확인하고 조직 구조를 관리하세요</Text>
      </div>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 조직원"
              value={stats.total}
              prefix={<TeamOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="본부장"
              value={stats.byGrade.DIVISION_CHIEF || 0}
              valueStyle={{ color: gradeColors.DIVISION_CHIEF }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="지부장"
              value={stats.byGrade.BRANCH_CHIEF || 0}
              valueStyle={{ color: gradeColors.BRANCH_CHIEF }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="매니저"
              value={stats.byGrade.MANAGER || 0}
              valueStyle={{ color: gradeColors.MANAGER }}
              prefix={<TrophyOutlined />}
              suffix="명"
            />
          </Card>
        </Col>
      </Row>

      {/* 검색 및 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={viewingSearchedMember ? 10 : 12}>
            <Input.Search
              placeholder="회원 이름으로 검색 (예: 홍길동)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              loading={isSearching}
              enterButton={
                <>
                  <SearchOutlined /> 검색
                </>
              }
              size="large"
              allowClear
              onClear={handleBackToMyOrg}
            />
          </Col>
          <Col xs={24} md={viewingSearchedMember ? 8 : 12}>
            <Select
              placeholder="등급 필터"
              style={{ width: '100%' }}
              size="large"
              allowClear
              value={gradeFilter}
              onChange={(value) => setGradeFilter(value)}
            >
              {/* Stage 4 DESIGN-004 (2026-04-15): 신 4단계 영업 + ADMIN */}
              <Select.Option value="ADMIN">관리자</Select.Option>
              <Select.Option value="CENTER">센터</Select.Option>
              <Select.Option value="BRANCH_MANAGER">지사장</Select.Option>
              <Select.Option value="TEAM_LEADER">팀장</Select.Option>
              <Select.Option value="SALESPERSON">판매원</Select.Option>
            </Select>
          </Col>
          {viewingSearchedMember && (
            <Col xs={24} md={6}>
              <Button
                type="primary"
                icon={<RollbackOutlined />}
                onClick={handleBackToMyOrg}
                size="large"
                style={{ width: '100%', backgroundColor: '#E53935', borderColor: '#E53935' }}
              >
                내 조직도로 돌아가기
              </Button>
            </Col>
          )}
        </Row>
        {viewingSearchedMember && (
          <div style={{ marginTop: 12 }}>
            <Tag color="#E53935" style={{ fontSize: 14, padding: '4px 12px' }}>
              현재 보기: {viewingMemberName}님의 조직도
            </Tag>
          </div>
        )}
      </Card>

      {/* 계보 트리 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'recommender',
              label: (
                <span>
                  <UserOutlined />
                  추천 계보 (1:N)
                </span>
              ),
              children: (
                <div
                  style={{
                    padding: '24px',
                    background: '#fafafa',
                    borderRadius: 8,
                    minHeight: 400,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      💡 추천인을 기준으로 한 조직 구조입니다. 클릭하여 상세 정보를 확인하세요.
                    </Text>
                  </div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Spin size="large" />
                    </div>
                  ) : recommenderTreeData.length > 0 ? (
                    <Tree
                      showIcon
                      showLine
                      defaultExpandAll
                      onSelect={onSelect}
                      treeData={recommenderTreeData}
                    />
                  ) : (
                    <Empty description="추천 계보 데이터가 없습니다" />
                  )}
                </div>
              ),
            },
            {
              key: 'sponsor',
              label: (
                <span>
                  <TeamOutlined />
                  후원 계보 (3팀)
                </span>
              ),
              children: (
                <div
                  style={{
                    padding: '24px',
                    background: '#fafafa',
                    borderRadius: 8,
                    minHeight: 400,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      💡 3팀 시스템 기반 후원 계보입니다. 각 회원은 최대 3명의 직속 후원을 가집니다.
                    </Text>
                  </div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Spin size="large" />
                    </div>
                  ) : sponsorTreeData.length > 0 ? (
                    <Tree
                      showIcon
                      showLine
                      defaultExpandAll
                      onSelect={onSelect}
                      treeData={sponsorTreeData}
                    />
                  ) : (
                    <Empty description="후원 계보 데이터가 없습니다" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 범례 */}
      <Card style={{ marginTop: 24 }} title="등급 범례">
        <Space wrap>
          {Object.entries(gradeLabels).map(([key, label]) => (
            <Tag key={key} color={gradeColors[key]}>
              {label}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 동명이인 선택 모달 */}
      <MemberSelectModal
        open={showSelectModal}
        searchQuery={searchTerm}
        members={searchResults}
        loading={isSearching}
        onSelect={handleMemberSelect}
        onCancel={() => setShowSelectModal(false)}
      />
    </div>
  );
}
