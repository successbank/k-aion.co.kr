'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tabs,
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
  Modal,
  Descriptions,
  Progress,
  Alert,
  Divider,
  Collapse,
  List,
  Popconfirm,
  Radio,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SearchOutlined,
  TrophyOutlined,
  DownloadOutlined,
  LineChartOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  SwapOutlined,
  StopOutlined,
  HomeOutlined,
  FormOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { OrganizationChart, gradeColors, gradeLabels } from '@/components/OrganizationChart';
import { useAuthStore } from '@/store/auth';
import { genealogyService } from '@/services/genealogy.service';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

// 등급별 보상 플랜 정보
const GRADE_BONUSES: Record<string, { type: string; amount: number; description?: string }[]> = {
  MEMBER: [],
  AGENT: [
    { type: '판매 보너스', amount: 500000, description: '직접 판매 시' },
    { type: '판매관리 보너스', amount: 150000, description: '하위 회원 판매 시' },
    { type: '판권 보너스', amount: 100000, description: '하위 회원 육성 시' },
  ],
  MANAGER: [
    { type: '판매 보너스', amount: 500000, description: '직접 판매 시' },
    { type: '판매관리 보너스', amount: 150000, description: '하위 회원 판매 시' },
    { type: '판권 보너스', amount: 150000, description: '하위 회원 육성 시' },
    { type: '공유 보너스', amount: 20000, description: '리더십 보너스' },
  ],
  BRANCH_CHIEF: [
    { type: '판매 보너스', amount: 500000, description: '직접 판매 시' },
    { type: '판매관리 보너스', amount: 150000, description: '하위 회원 판매 시' },
    { type: '판권 보너스', amount: 200000, description: '하위 회원 육성 시' },
    { type: '공유 보너스', amount: 20000, description: '리더십 보너스' },
    { type: '센터 운영 보너스', amount: 50000, description: '소속 회원 매출 시' },
  ],
  DIVISION_CHIEF: [
    { type: '판매 보너스', amount: 500000, description: '직접 판매 시' },
    { type: '판매관리 보너스', amount: 150000, description: '하위 회원 판매 시' },
    { type: '판권 보너스', amount: 240000, description: '하위 회원 육성 시' },
    { type: '공유 보너스', amount: 20000, description: '리더십 보너스' },
    { type: '센터 운영 보너스', amount: 50000, description: '소속 회원 매출 시' },
  ],
  CENTER: [
    { type: '판매 보너스', amount: 500000, description: '직접 판매 시' },
    { type: '판매관리 보너스', amount: 150000, description: '하위 회원 판매 시' },
    { type: '판권 보너스', amount: 280000, description: '하위 회원 육성 시' },
    { type: '공유 보너스', amount: 20000, description: '리더십 보너스' },
    { type: '센터 운영 보너스', amount: 50000, description: '소속 회원 매출 시' },
  ],
  ADMIN: [],
};

// 등급 순서 (비교용)
const GRADE_ORDER = [
  'MEMBER',
  'AGENT',
  'MANAGER',
  'BRANCH_CHIEF',
  'DIVISION_CHIEF',
  'CENTER',
  'ADMIN',
];

interface TreeMember {
  id: number;
  name: string;
  email: string | null;
  grade: string;
  cumulativePv?: number;
  children: TreeMember[];
}

interface OrganizationStats {
  totalMembers: number;
  byGrade: Record<string, number>;
  totalPV: number;
  activeMembers: number;
  teamBalance: {
    team1: number;
    team2: number;
    team3: number;
  };
}

export default function AdminOrganizationPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recommender');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string | undefined>();
  const [recommenderTree, setRecommenderTree] = useState<TreeMember | null>(null);
  const [sponsorTree, setSponsorTree] = useState<TreeMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TreeMember | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newGrade, setNewGrade] = useState<string | null>(null);
  const [gradeChangeLoading, setGradeChangeLoading] = useState(false);
  // 회원 이동 관련 상태
  const [moveLoading, setMoveLoading] = useState(false);
  const [newParentId, setNewParentId] = useState<number | null>(null);
  const [parentSearchResults, setParentSearchResults] = useState<
    { id: number; name: string; grade: string }[]
  >([]);
  // 하위 조직 처리 전략 상태 (후원인 변경 시)
  const [downlineStrategy, setDownlineStrategy] = useState<string>('MOVE_WITH');
  const [parentSearchLoading, setParentSearchLoading] = useState(false);
  // 선택된 회원의 하위 회원 ID 목록 (순환 참조 방지용)
  const [selectedMemberDescendantIds, setSelectedMemberDescendantIds] = useState<Set<number>>(
    new Set(),
  );
  // 정보 수정 관련 상태
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  // 비활성화 관련 상태
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  // 센터 목록
  const [centerList, setCenterList] = useState<{ id: number; name: string }[]>([]);
  const [newCenterId, setNewCenterId] = useState<number | null>(null);
  const [centerChangeLoading, setCenterChangeLoading] = useState(false);
  // 동명이인 검색 관련 상태
  const [searchResults, setSearchResults] = useState<TreeMember[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<TreeMember | null>(null);
  const [stats, setStats] = useState<OrganizationStats>({
    totalMembers: 0,
    byGrade: {},
    totalPV: 0,
    activeMembers: 0,
    teamBalance: { team1: 0, team2: 0, team3: 0 },
  });

  // 트리 필터링 함수
  const filterTree = (node: TreeMember, search: string, grade?: string): TreeMember | null => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      node.name.toLowerCase().includes(searchLower) ||
      node.id.toString().includes(search);

    const matchesGrade = !grade || node.grade === grade;

    // 자식 노드 필터링
    const filteredChildren =
      node.children
        ?.map((child) => filterTree(child, search, grade))
        .filter((child): child is TreeMember => child !== null) || [];

    // 현재 노드가 검색/등급 조건을 만족하면 원본 자식 포함 (하위 조직 모두 표시)
    if (matchesSearch && matchesGrade) {
      return { ...node, children: node.children || [] };
    }

    // 자식 중 하나라도 조건을 만족하면 부모도 포함 (경로 유지)
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    return null;
  };

  // 센터 노드를 제외하고 자식들을 상위로 올리는 필터
  const filterOutCenters = (node: TreeMember): TreeMember | TreeMember[] | null => {
    // 센터인 경우: 자신은 제외하고 자식들만 반환 (자식들도 재귀 처리)
    if (node.grade === 'CENTER') {
      return node.children.flatMap((child) => {
        const result = filterOutCenters(child);
        if (result === null) return [];
        return Array.isArray(result) ? result : [result];
      });
    }

    // 센터가 아닌 경우: 자식들 중 센터 필터링
    const filteredChildren = node.children.flatMap((child) => {
      const result = filterOutCenters(child);
      if (result === null) return [];
      return Array.isArray(result) ? result : [result];
    });

    return { ...node, children: filteredChildren };
  };

  // 검색어에 일치하는 노드를 찾아 그 노드를 루트로 하는 트리 반환
  const findAndRootTree = (node: TreeMember, search: string, grade?: string): TreeMember | null => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      node.name.toLowerCase().includes(searchLower) || node.id.toString().includes(search);

    const matchesGrade = !grade || node.grade === grade;

    // 현재 노드가 조건을 만족하면 이 노드를 루트로 반환 (자식 모두 포함)
    if (matchesSearch && matchesGrade) {
      return node;
    }

    // 자식에서 재귀적으로 탐색
    for (const child of node.children || []) {
      const result = findAndRootTree(child, search, grade);
      if (result) return result;
    }

    return null;
  };

  // 검색어에 일치하는 모든 노드 찾기
  const findAllMatches = (node: TreeMember, search: string, grade?: string): TreeMember[] => {
    const searchLower = search.toLowerCase();
    const matches: TreeMember[] = [];

    const traverse = (n: TreeMember) => {
      const matchesSearch =
        n.name.toLowerCase().includes(searchLower) || n.id.toString().includes(search);
      const matchesGrade = !grade || n.grade === grade;

      if (matchesSearch && matchesGrade) {
        matches.push(n);
      }
      n.children?.forEach((child) => traverse(child));
    };

    traverse(node);
    return matches;
  };

  // 항상 모든 노드 펼침
  const chartInitialDepth = 100;

  // 필터링된 트리 데이터
  const filteredRecommenderTree = useMemo(() => {
    if (!recommenderTree) return null;

    // 선택된 검색 결과가 있으면 해당 노드를 루트로
    if (selectedSearchResult && activeTab === 'recommender') {
      return selectedSearchResult;
    }

    // 등급 필터만 있으면 기존 방식
    if (gradeFilter) {
      return filterTree(recommenderTree, '', gradeFilter);
    }

    return recommenderTree;
  }, [recommenderTree, gradeFilter, selectedSearchResult, activeTab]);

  const filteredSponsorTree = useMemo(() => {
    if (!sponsorTree) return null;

    // 선택된 검색 결과가 있으면 해당 노드를 루트로
    if (selectedSearchResult && activeTab === 'sponsor') {
      return selectedSearchResult;
    }

    // 등급 필터만 있으면 기존 방식
    if (gradeFilter) {
      return filterTree(sponsorTree, '', gradeFilter);
    }

    return sponsorTree;
  }, [sponsorTree, gradeFilter, selectedSearchResult, activeTab]);

  useEffect(() => {
    // user 상태가 복원된 후에만 데이터 로드 (Zustand persist 레이스 컨디션 방지)
    if (user?.id) {
      loadOrganizationData();
    }
  }, [user?.id, user?.grade]);

  // 전체 조직 데이터 로드
  const loadOrganizationData = async () => {
    setLoading(true);

    // 토큰 존재 여부 확인
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('인증 토큰이 없습니다. 다시 로그인해주세요.');
      setLoading(false);
      window.location.href = '/login';
      return;
    }

    // 인증 확인 (Zustand 복원 대기)
    if (!user || !user.id) {
      // Zustand 상태가 아직 복원되지 않은 경우 조용히 대기 (useEffect에서 재시도)
      setLoading(false);
      return;
    }

    try {
      // ADMIN 등급인 경우 전체 조직 조회
      if (user.grade === 'ADMIN') {
        // 전체 추천 계보
        const recommenderResponse = await genealogyService.getAllOrganizationTrees(
          'recommender',
          100,
        );

        // 전체 후원 계보
        const sponsorResponse = await genealogyService.getAllOrganizationTrees('sponsor', 100);

        // 센터를 제외한 트리 생성
        const filteredRecommenderTrees = recommenderResponse.trees.flatMap((tree: TreeMember) => {
          const result = filterOutCenters(tree);
          if (result === null) return [];
          return Array.isArray(result) ? result : [result];
        });

        const filteredSponsorTrees = sponsorResponse.trees.flatMap((tree: TreeMember) => {
          const result = filterOutCenters(tree);
          if (result === null) return [];
          return Array.isArray(result) ? result : [result];
        });

        // 다중 루트 트리를 하나의 가상 루트로 합치기
        setRecommenderTree({
          id: 0,
          name: '전체 조직',
          email: '',
          grade: 'ADMIN',
          children: filteredRecommenderTrees,
        });

        setSponsorTree({
          id: 0,
          name: '전체 조직',
          email: '',
          grade: 'ADMIN',
          children: filteredSponsorTrees,
        });

        // 통계 계산 (모든 루트 합산)
        calculateStatsFromMultipleRoots(recommenderResponse.trees);
      } else {
        // 일반 회원: 자신의 하위 조직만 조회
        // user.id가 string이므로 number로 변환
        const adminId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

        // 추천 계보 (전체 조직)
        const recommenderData = await genealogyService.getGenealogyTree(
          adminId,
          100, // 최대 100단계까지
          'recommender',
        );
        // 센터 필터링 적용
        const filteredRecommender = filterOutCenters(recommenderData);
        if (filteredRecommender && !Array.isArray(filteredRecommender)) {
          setRecommenderTree(filteredRecommender);
        } else if (Array.isArray(filteredRecommender) && filteredRecommender.length > 0) {
          // 루트가 센터인 경우 가상 루트로 감싸기
          setRecommenderTree({
            id: 0,
            name: '전체 조직',
            email: '',
            grade: 'ADMIN',
            children: filteredRecommender,
          });
        }

        // 후원 계보 (3팀 시스템)
        const sponsorData = await genealogyService.getGenealogyTree(adminId, 100, 'sponsor');
        // 센터 필터링 적용
        const filteredSponsor = filterOutCenters(sponsorData);
        if (filteredSponsor && !Array.isArray(filteredSponsor)) {
          setSponsorTree(filteredSponsor);
        } else if (Array.isArray(filteredSponsor) && filteredSponsor.length > 0) {
          // 루트가 센터인 경우 가상 루트로 감싸기
          setSponsorTree({
            id: 0,
            name: '전체 조직',
            email: '',
            grade: 'ADMIN',
            children: filteredSponsor,
          });
        }

        // 통계 계산
        calculateStats(recommenderData);
      }

      message.success('조직 데이터를 불러왔습니다.');
    } catch (error: any) {
      console.error('조직 데이터 로딩 에러:', error);

      // 에러 타입에 따른 메시지 처리
      if (error?.statusCode === 400) {
        message.error('회원 정보를 찾을 수 없습니다. 관리자에게 문의하세요.');
      } else if (error?.statusCode === 401) {
        message.error('로그인이 필요합니다.');
      } else {
        message.error((error as Error).message || '조직도를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = (tree: TreeMember | null) => {
    if (!tree) return;

    let totalMembers = 0;
    let totalPV = 0;
    const byGrade: Record<string, number> = {};
    const teamBalance = { team1: 0, team2: 0, team3: 0 };

    const traverse = (node: TreeMember) => {
      totalMembers++;
      totalPV += node.cumulativePv || 0;
      byGrade[node.grade] = (byGrade[node.grade] || 0) + 1;

      node.children.forEach((child) => traverse(child));
    };

    traverse(tree);

    setStats({
      totalMembers,
      byGrade,
      totalPV,
      activeMembers: totalMembers, // 추후 isActive 필드로 계산
      teamBalance,
    });
  };

  // 다중 루트 트리 통계 계산 (ADMIN 전용)
  const calculateStatsFromMultipleRoots = (roots: TreeMember[]) => {
    let totalMembers = 0;
    let totalPV = 0;
    const byGrade: Record<string, number> = {};
    const teamBalance = { team1: 0, team2: 0, team3: 0 };

    // 각 루트 트리를 순회하며 통계 수집
    const traverse = (node: TreeMember) => {
      totalMembers++;
      totalPV += node.cumulativePv || 0;
      byGrade[node.grade] = (byGrade[node.grade] || 0) + 1;

      node.children.forEach((child) => traverse(child));
    };

    // 모든 루트 트리에 대해 순회
    roots.forEach((root) => traverse(root));

    setStats({
      totalMembers,
      byGrade,
      totalPV,
      activeMembers: totalMembers,
      teamBalance,
    });
  };

  // 트리에서 모든 하위 회원 ID 수집 (순환 참조 방지용)
  const collectDescendantIds = (node: TreeMember): Set<number> => {
    const ids = new Set<number>();
    const traverse = (n: TreeMember) => {
      n.children.forEach((child) => {
        ids.add(child.id);
        traverse(child);
      });
    };
    traverse(node);
    return ids;
  };

  // 노드 클릭 핸들러 (조직도용)
  const handleNodeClick = (member: TreeMember) => {
    setSelectedMember(member);
    setNewGrade(null); // 등급 선택 초기화
    // 선택된 회원의 모든 하위 회원 ID 수집 (순환 참조 방지)
    setSelectedMemberDescendantIds(collectDescendantIds(member));
    setDetailModalVisible(true);
  };

  // 검색 실행 (Enter 키 또는 검색 버튼)
  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const currentTree = activeTab === 'recommender' ? recommenderTree : sponsorTree;
    if (!currentTree) return;

    const matches = findAllMatches(currentTree, searchTerm, gradeFilter);

    if (matches.length === 0) {
      message.info('검색 결과가 없습니다.');
    } else if (matches.length === 1) {
      // 단일 매치: 바로 해당 노드를 루트로 표시
      setSelectedSearchResult(matches[0]);
    } else {
      // 다중 매치: 선택 모달 표시
      setSearchResults(matches);
      setSearchModalVisible(true);
    }
  };

  // 검색 결과에서 회원 선택
  const handleSelectSearchResult = (member: TreeMember) => {
    setSelectedSearchResult(member);
    setSearchModalVisible(false);
    setSearchResults([]);
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedSearchResult(null);
    setSearchResults([]);
  };

  // 등급 변경 핸들러
  const handleGradeChange = async () => {
    if (!selectedMember || !newGrade || selectedMember.id === 0) {
      message.warning('등급을 변경할 회원을 선택해주세요.');
      return;
    }

    if (newGrade === selectedMember.grade) {
      message.warning('현재 등급과 동일합니다.');
      return;
    }

    setGradeChangeLoading(true);
    try {
      await api.patch(`/v1/members/${selectedMember.id}/grade`, { grade: newGrade });
      message.success(
        `${selectedMember.name}님의 등급이 ${gradeLabels[newGrade]}(으)로 변경되었습니다.`,
      );
      setDetailModalVisible(false);
      setNewGrade(null);
      loadOrganizationData(); // 조직도 새로고침
    } catch (error: any) {
      console.error('등급 변경 실패:', error);
      message.error(error.response?.data?.message || '등급 변경에 실패했습니다.');
    } finally {
      setGradeChangeLoading(false);
    }
  };

  // 센터 목록 로드
  const loadCenterList = async () => {
    try {
      const { data } = await api.get('/v1/members/search', {
        params: { grade: 'CENTER', limit: 100, isActive: true },
      });
      setCenterList(data.data || []);
    } catch (error) {
      console.error('센터 목록 로드 실패:', error);
    }
  };

  // 모달이 열릴 때 센터 목록 로드
  useEffect(() => {
    if (detailModalVisible && user?.grade === 'ADMIN') {
      loadCenterList();
    }
  }, [detailModalVisible]);

  // 회원 검색 (이동용)
  const handleParentSearch = async (searchValue: string) => {
    if (searchValue.length < 1) {
      setParentSearchResults([]);
      return;
    }

    setParentSearchLoading(true);
    try {
      const { data } = await api.get('/v1/members/search', {
        params: { q: searchValue, limit: 20, isActive: true },
      });
      // 현재 선택된 회원과 그 하위 회원은 제외 (순환 참조 방지)
      // - 자기 자신 제외
      // - 모든 하위 회원 제외 (순환 참조 발생 방지)
      const filtered = (data.data || []).filter((m: { id: number }) => {
        if (m.id === selectedMember?.id) return false; // 자기 자신 제외
        if (selectedMemberDescendantIds.has(m.id)) return false; // 하위 회원 제외
        return true;
      });
      setParentSearchResults(filtered);
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setParentSearchResults([]);
    } finally {
      setParentSearchLoading(false);
    }
  };

  // 회원 이동 (후원인/추천인 변경)
  const handleMoveMember = async () => {
    if (!selectedMember || !newParentId || selectedMember.id === 0) {
      message.warning('이동할 대상과 새로운 상위 회원을 선택해주세요.');
      return;
    }

    setMoveLoading(true);
    try {
      const updateData =
        activeTab === 'sponsor'
          ? { sponsorId: newParentId, downlineStrategy: downlineStrategy }
          : { recommenderId: newParentId };

      await api.patch(`/v1/members/${selectedMember.id}`, updateData);
      message.success(
        `${selectedMember.name}님의 ${activeTab === 'sponsor' ? '후원인' : '추천인'}이 변경되었습니다.`,
      );
      setDetailModalVisible(false);
      setNewParentId(null);
      setParentSearchResults([]);
      setDownlineStrategy('MOVE_WITH'); // 상태 초기화
      loadOrganizationData();
    } catch (error: any) {
      console.error('회원 이동 실패:', error);
      message.error(error.response?.data?.message || '회원 이동에 실패했습니다.');
    } finally {
      setMoveLoading(false);
    }
  };

  // 정보 수정
  const handleEditMember = async () => {
    if (!selectedMember || selectedMember.id === 0) return;

    setEditLoading(true);
    try {
      const updateData: { name?: string; phone?: string } = {};
      if (editName && editName !== selectedMember.name) updateData.name = editName;
      if (editPhone) updateData.phone = editPhone;

      if (Object.keys(updateData).length === 0) {
        message.warning('변경할 내용이 없습니다.');
        setEditLoading(false);
        return;
      }

      await api.patch(`/v1/members/${selectedMember.id}`, updateData);
      message.success('회원 정보가 수정되었습니다.');
      setDetailModalVisible(false);
      loadOrganizationData();
    } catch (error: any) {
      console.error('정보 수정 실패:', error);
      message.error(error.response?.data?.message || '정보 수정에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  // 회원 비활성화
  const handleDeactivateMember = async () => {
    if (!selectedMember || selectedMember.id === 0) return;

    setDeactivateLoading(true);
    try {
      await api.patch(`/v1/members/${selectedMember.id}`, { isActive: false });
      message.success(`${selectedMember.name}님이 비활성화되었습니다.`);
      setDetailModalVisible(false);
      loadOrganizationData();
    } catch (error: any) {
      console.error('비활성화 실패:', error);
      message.error(error.response?.data?.message || '비활성화에 실패했습니다.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  // 센터 변경
  const handleCenterChange = async () => {
    if (!selectedMember || !newCenterId || selectedMember.id === 0) {
      message.warning('변경할 센터를 선택해주세요.');
      return;
    }

    setCenterChangeLoading(true);
    try {
      await api.patch(`/v1/members/${selectedMember.id}`, { sponsorId: newCenterId });
      message.success(`${selectedMember.name}님의 소속 센터가 변경되었습니다.`);
      setDetailModalVisible(false);
      setNewCenterId(null);
      loadOrganizationData();
    } catch (error: any) {
      console.error('센터 변경 실패:', error);
      message.error(error.response?.data?.message || '센터 변경에 실패했습니다.');
    } finally {
      setCenterChangeLoading(false);
    }
  };

  // 보상 플랜 비교 (현재 등급 vs 새 등급)
  const compareBonuses = (currentGrade: string, targetGrade: string) => {
    const currentBonuses = GRADE_BONUSES[currentGrade] || [];
    const targetBonuses = GRADE_BONUSES[targetGrade] || [];

    const comparison: {
      type: string;
      current: number;
      target: number;
      diff: number;
      isNew: boolean;
    }[] = [];

    // 새 등급의 보너스 기준으로 비교
    targetBonuses.forEach((tb) => {
      const cb = currentBonuses.find((b) => b.type === tb.type);
      comparison.push({
        type: tb.type,
        current: cb?.amount || 0,
        target: tb.amount,
        diff: tb.amount - (cb?.amount || 0),
        isNew: !cb,
      });
    });

    return comparison;
  };

  // 엑셀 내보내기
  const handleExport = () => {
    try {
      const currentTree = activeTab === 'recommender' ? recommenderTree : sponsorTree;

      if (!currentTree) {
        message.warning('내보낼 데이터가 없습니다.');
        return;
      }

      // 회원 목록 추출 (flatten)
      const memberList: Record<string, string | number>[] = [];
      const flattenTree = (node: TreeMember, depth = 0, parentName = '') => {
        memberList.push({
          회원ID: node.id,
          이름: node.name,
          이메일: node.email || '',
          등급: gradeLabels[node.grade],
          누적PV: node.cumulativePv || 0,
          깊이: depth,
          상위회원: parentName,
        });
        node.children.forEach((child) => flattenTree(child, depth + 1, node.name));
      };
      flattenTree(currentTree);

      // 통계 시트 데이터
      const statsData = [
        ['조직 통계 보고서', ''],
        ['생성일시', new Date().toLocaleString('ko-KR')],
        ['조직 유형', activeTab === 'recommender' ? '추천인 조직도' : '스폰서 조직도'],
        ['', ''],
        ['총 회원 수', stats.totalMembers],
        ['총 누적 PV', stats.totalPV.toLocaleString()],
        ['평균 PV', Math.round(stats.totalPV / stats.totalMembers).toLocaleString()],
        ['활성 회원 수', stats.activeMembers],
        ['', ''],
        ['등급별 분포', ''],
      ];

      // 등급별 통계 추가
      Object.entries(stats.byGrade).forEach(([grade, count]) => {
        statsData.push([gradeLabels[grade] || grade, count]);
      });

      // 팀 균형 데이터 추가
      if (activeTab === 'sponsor') {
        statsData.push(
          ['', ''],
          ['팀 균형 분석', ''],
          ['팀1', stats.teamBalance.team1],
          ['팀2', stats.teamBalance.team2],
          ['팀3', stats.teamBalance.team3],
          ['균형도', `${calculateTeamBalance()}%`],
        );
      }

      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 통계 시트 추가
      const statsWS = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWS, '조직통계');

      // 회원 목록 시트 추가
      const membersWS = XLSX.utils.json_to_sheet(memberList);
      XLSX.utils.book_append_sheet(wb, membersWS, '회원목록');

      // 등급별 시트 생성
      const gradeGroups: Record<string, Record<string, string | number>[]> = {};
      memberList.forEach((member) => {
        const grade = member['등급'];
        if (!gradeGroups[grade]) {
          gradeGroups[grade] = [];
        }
        gradeGroups[grade].push(member);
      });

      Object.entries(gradeGroups).forEach(([grade, members]) => {
        const ws = XLSX.utils.json_to_sheet(members);
        XLSX.utils.book_append_sheet(wb, ws, grade);
      });

      // 파일 다운로드
      const fileName = `조직도_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success('엑셀 파일이 다운로드되었습니다.');
    } catch (error: unknown) {
      console.error('Excel export error:', error);
      message.error('엑셀 내보내기에 실패했습니다.');
    }
  };

  // 팀 균형도 계산
  const calculateTeamBalance = () => {
    if (!stats.teamBalance) return 0;
    const { team1, team2, team3 } = stats.teamBalance;
    const total = team1 + team2 + team3;
    if (total === 0) return 100;

    const avg = total / 3;
    const deviation = Math.max(Math.abs(team1 - avg), Math.abs(team2 - avg), Math.abs(team3 - avg));
    const balance = Math.max(0, 100 - (deviation / avg) * 100);
    return Math.round(balance);
  };

  return (
    <DashboardLayout>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ApartmentOutlined /> 전체 조직 관리
        </Title>
        <Text type="secondary">전체 회원의 계보 구조를 조회하고 분석합니다 (관리자 전용)</Text>
      </div>

      {/* 경고 메시지 */}
      <Alert
        message="관리자 전용 페이지"
        description="이 페이지는 전체 조직 정보를 포함하고 있습니다. 외부 공유 및 스크린샷에 주의하세요."
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
        closable
      />

      {/* 통계 대시보드 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="전체 회원"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
              suffix="명"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="누적 PV"
              value={stats.totalPV}
              prefix={<LineChartOutlined />}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="평균 PV"
              value={stats.totalMembers > 0 ? stats.totalPV / stats.totalMembers : 0}
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">팀 균형도</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Progress
                  type="circle"
                  percent={calculateTeamBalance()}
                  size={60}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div style={{ marginLeft: 16 }}>
                  <Text strong style={{ fontSize: 24 }}>
                    {calculateTeamBalance()}%
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 등급별 통계 */}
      <Card title="등급별 회원 분포" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(stats.byGrade).map(([grade, count]) => (
            <Col key={grade} xs={12} sm={8} md={6} lg={4}>
              <Card size="small">
                <Statistic
                  title={gradeLabels[grade] || grade}
                  value={count}
                  suffix="명"
                  valueStyle={{ color: gradeColors[grade], fontSize: 20 }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 검색 및 필터 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="회원 이름 또는 아이디 검색"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedSearchResult(null); // 검색어 변경 시 선택 초기화
            }}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleClearSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            검색
          </Button>
          <Select
            placeholder="등급 필터"
            style={{ width: 180 }}
            allowClear
            value={gradeFilter}
            onChange={setGradeFilter}
          >
            <Select.Option value="ADMIN">최고관리자</Select.Option>
            <Select.Option value="CENTER">센터</Select.Option>
            <Select.Option value="DIVISION_CHIEF">본부장</Select.Option>
            <Select.Option value="BRANCH_CHIEF">지부장</Select.Option>
            <Select.Option value="MANAGER">매니저</Select.Option>
            <Select.Option value="AGENT">에이전트</Select.Option>
            <Select.Option value="MEMBER">회원</Select.Option>
          </Select>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            엑셀 내보내기
          </Button>
          <Button onClick={loadOrganizationData}>새로고침</Button>
        </Space>
      </Card>

      {/* 조직 트리 */}
      <Card
        title={
          <Space>
            <ApartmentOutlined />
            <Text strong>조직 계보 트리</Text>
          </Space>
        }
      >
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
                    minHeight: 600,
                    maxHeight: '70vh',
                    overflow: 'auto',
                  }}
                >
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>조직 데이터를 불러오는 중...</Text>
                      </div>
                    </div>
                  ) : filteredRecommenderTree ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">
                          💡 노드를 클릭하면 상세 정보를 확인하고 회원 정보를 수정할 수 있습니다.
                        </Text>
                      </div>
                      <OrganizationChart
                        data={filteredRecommenderTree}
                        onNodeClick={handleNodeClick}
                        initialDepth={chartInitialDepth}
                        height={600}
                      />
                    </>
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
                    minHeight: 600,
                    maxHeight: '70vh',
                    overflow: 'auto',
                  }}
                >
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text>조직 데이터를 불러오는 중...</Text>
                      </div>
                    </div>
                  ) : filteredSponsorTree ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">
                          💡 노드를 클릭하면 상세 정보를 확인하고 회원 정보를 수정할 수 있습니다.
                        </Text>
                      </div>
                      <OrganizationChart
                        data={filteredSponsorTree}
                        onNodeClick={handleNodeClick}
                        initialDepth={chartInitialDepth}
                        height={600}
                      />
                    </>
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
      <Card title="등급 범례" style={{ marginTop: 24 }}>
        <Space wrap>
          {Object.entries(gradeLabels).map(([key, label]) => (
            <Tag key={key} color={gradeColors[key]} style={{ fontSize: 14, padding: '4px 12px' }}>
              {label}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 회원 상세 모달 */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            회원 상세 정보
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setNewGrade(null);
          setDownlineStrategy('MOVE_WITH');
          setNewParentId(null);
          setParentSearchResults([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setNewGrade(null);
              setDownlineStrategy('MOVE_WITH');
              setNewParentId(null);
              setParentSearchResults([]);
            }}
          >
            닫기
          </Button>,
        ]}
        width={750}
      >
        {selectedMember && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="ID">{selectedMember.id}</Descriptions.Item>
              <Descriptions.Item label="이름">{selectedMember.name}</Descriptions.Item>
              <Descriptions.Item label="이메일" span={2}>
                {selectedMember.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="현재 등급">
                <Tag color={gradeColors[selectedMember.grade]} style={{ fontSize: 14 }}>
                  {gradeLabels[selectedMember.grade]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="누적 PV">
                {selectedMember.cumulativePv?.toLocaleString() || 0}
              </Descriptions.Item>
              <Descriptions.Item label="직속 하위" span={2}>
                {selectedMember.children.length}명
              </Descriptions.Item>
            </Descriptions>

            {/* 등급 변경 섹션 - 가상 루트(id=0)가 아닌 경우만 표시 */}
            {selectedMember.id !== 0 && user?.grade === 'ADMIN' && (
              <>
                <Divider />
                <Collapse
                  items={[
                    {
                      key: 'gradeChange',
                      label: (
                        <Space>
                          <EditOutlined />
                          <Text strong>등급 변경</Text>
                        </Space>
                      ),
                      children: (
                        <div>
                          {/* 등급 선택 */}
                          <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                              새로운 등급을 선택하세요
                            </Text>
                            <Select
                              placeholder="등급 선택"
                              style={{ width: '100%' }}
                              value={newGrade}
                              onChange={setNewGrade}
                              size="large"
                            >
                              <Select.Option
                                value="MEMBER"
                                disabled={selectedMember.grade === 'MEMBER'}
                              >
                                회원
                              </Select.Option>
                              <Select.Option
                                value="AGENT"
                                disabled={selectedMember.grade === 'AGENT'}
                              >
                                에이전트
                              </Select.Option>
                              <Select.Option
                                value="MANAGER"
                                disabled={selectedMember.grade === 'MANAGER'}
                              >
                                매니저
                              </Select.Option>
                              <Select.Option
                                value="BRANCH_CHIEF"
                                disabled={selectedMember.grade === 'BRANCH_CHIEF'}
                              >
                                지부장
                              </Select.Option>
                              <Select.Option
                                value="DIVISION_CHIEF"
                                disabled={selectedMember.grade === 'DIVISION_CHIEF'}
                              >
                                본부장
                              </Select.Option>
                              <Select.Option
                                value="CENTER"
                                disabled={selectedMember.grade === 'CENTER'}
                              >
                                센터
                              </Select.Option>
                            </Select>
                          </div>

                          {/* 보상 플랜 미리보기 */}
                          {newGrade && newGrade !== selectedMember.grade && (
                            <div style={{ marginBottom: 16 }}>
                              <Alert
                                message={
                                  <Space>
                                    <Text strong>
                                      {gradeLabels[selectedMember.grade]} → {gradeLabels[newGrade]}
                                    </Text>
                                    <Text type="secondary">변경 시 적용되는 보상 플랜</Text>
                                  </Space>
                                }
                                type="info"
                                style={{ marginBottom: 12 }}
                              />
                              <List
                                size="small"
                                bordered
                                dataSource={compareBonuses(selectedMember.grade, newGrade)}
                                renderItem={(item) => (
                                  <List.Item>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                      }}
                                    >
                                      <Space>
                                        {item.isNew ? (
                                          <Tag color="green">
                                            <PlusCircleOutlined /> 신규
                                          </Tag>
                                        ) : item.diff > 0 ? (
                                          <Tag color="blue">
                                            <ArrowUpOutlined /> 증가
                                          </Tag>
                                        ) : item.diff < 0 ? (
                                          <Tag color="orange">
                                            <ArrowDownOutlined /> 감소
                                          </Tag>
                                        ) : (
                                          <Tag>동일</Tag>
                                        )}
                                        <Text>{item.type}</Text>
                                      </Space>
                                      <Space>
                                        {item.current > 0 && (
                                          <Text type="secondary" delete={item.diff !== 0}>
                                            {item.current.toLocaleString()}원
                                          </Text>
                                        )}
                                        {item.diff !== 0 && (
                                          <Text
                                            strong
                                            style={{ color: item.diff > 0 ? '#52c41a' : '#fa8c16' }}
                                          >
                                            → {item.target.toLocaleString()}원
                                          </Text>
                                        )}
                                        {item.diff === 0 && item.current > 0 && (
                                          <Text>{item.target.toLocaleString()}원</Text>
                                        )}
                                        {item.isNew && (
                                          <Text strong style={{ color: '#52c41a' }}>
                                            {item.target.toLocaleString()}원
                                          </Text>
                                        )}
                                      </Space>
                                    </div>
                                  </List.Item>
                                )}
                              />
                            </div>
                          )}

                          {/* 등급 변경 버튼 */}
                          <Popconfirm
                            title="등급 변경 확인"
                            description={
                              <div>
                                <p>
                                  <Text strong>{selectedMember.name}</Text>님의 등급을
                                </p>
                                <p>
                                  <Tag color={gradeColors[selectedMember.grade]}>
                                    {gradeLabels[selectedMember.grade]}
                                  </Tag>
                                  →
                                  <Tag color={gradeColors[newGrade || '']}>
                                    {gradeLabels[newGrade || '']}
                                  </Tag>
                                  (으)로 변경하시겠습니까?
                                </p>
                                <Text type="warning">
                                  등급 변경 시 보상 구조가 즉시 적용됩니다.
                                </Text>
                              </div>
                            }
                            onConfirm={handleGradeChange}
                            okText="변경"
                            cancelText="취소"
                            okButtonProps={{ danger: true, loading: gradeChangeLoading }}
                            disabled={!newGrade || newGrade === selectedMember.grade}
                          >
                            <Button
                              type="primary"
                              icon={<EditOutlined />}
                              block
                              disabled={!newGrade || newGrade === selectedMember.grade}
                              loading={gradeChangeLoading}
                            >
                              등급 변경
                            </Button>
                          </Popconfirm>
                        </div>
                      ),
                    },
                    {
                      key: 'moveMember',
                      label: (
                        <Space>
                          <SwapOutlined />
                          <Text strong>
                            회원 이동 ({activeTab === 'sponsor' ? '후원인' : '추천인'} 변경)
                          </Text>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                            새로운 {activeTab === 'sponsor' ? '후원인' : '추천인'}을 검색하여
                            선택하세요
                          </Text>
                          <Select
                            showSearch
                            placeholder="이름 또는 아이디로 검색"
                            style={{ width: '100%', marginBottom: 16 }}
                            filterOption={false}
                            onSearch={handleParentSearch}
                            onChange={(value) => setNewParentId(value)}
                            loading={parentSearchLoading}
                            notFoundContent={parentSearchLoading ? '검색 중...' : '검색 결과 없음'}
                            value={newParentId}
                            allowClear
                          >
                            {parentSearchResults.map((m) => (
                              <Select.Option key={m.id} value={m.id}>
                                <Space>
                                  <Tag color={gradeColors[m.grade]} style={{ fontSize: 10 }}>
                                    {gradeLabels[m.grade]}
                                  </Tag>
                                  {m.name} (ID: {m.id})
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>

                          {/* 하위 조직 처리 옵션 - 후원 계보 탭에서 하위 회원이 있는 경우만 표시 */}
                          {activeTab === 'sponsor' && selectedMember.children.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                하위 조직 처리 방법 (직속 하위 {selectedMember.children.length}명)
                              </Text>
                              <Radio.Group
                                value={downlineStrategy}
                                onChange={(e) => setDownlineStrategy(e.target.value)}
                                style={{ width: '100%' }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Radio value="MOVE_WITH">
                                    <Space>
                                      <TeamOutlined />
                                      <span>하위 조직과 함께 이동</span>
                                      <Tag color="blue">기본값</Tag>
                                    </Space>
                                  </Radio>
                                  <Radio value="REASSIGN">
                                    <Space>
                                      <SwapOutlined />
                                      <span>하위 조직을 기존 상위자에게 재배치</span>
                                    </Space>
                                  </Radio>
                                  <Radio value="DETACH">
                                    <Space>
                                      <StopOutlined />
                                      <span>하위 조직 분리 (최상위로)</span>
                                      <Tag color="orange">주의</Tag>
                                    </Space>
                                  </Radio>
                                </Space>
                              </Radio.Group>
                            </div>
                          )}

                          <Popconfirm
                            title="회원 이동 확인"
                            description={`${selectedMember.name}님의 ${activeTab === 'sponsor' ? '후원인' : '추천인'}을 변경하시겠습니까?`}
                            onConfirm={handleMoveMember}
                            okText="이동"
                            cancelText="취소"
                            okButtonProps={{ loading: moveLoading }}
                            disabled={!newParentId}
                          >
                            <Button
                              type="primary"
                              icon={<SwapOutlined />}
                              block
                              disabled={!newParentId}
                              loading={moveLoading}
                            >
                              회원 이동
                            </Button>
                          </Popconfirm>
                        </div>
                      ),
                    },
                    {
                      key: 'changeCenter',
                      label: (
                        <Space>
                          <HomeOutlined />
                          <Text strong>소속 센터 변경</Text>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                            이 회원의 소속 센터를 변경합니다 (후원인이 센터로 변경됨)
                          </Text>
                          <Select
                            placeholder="센터 선택"
                            style={{ width: '100%', marginBottom: 16 }}
                            value={newCenterId}
                            onChange={(value) => setNewCenterId(value)}
                            allowClear
                          >
                            {centerList.map((c) => (
                              <Select.Option key={c.id} value={c.id}>
                                {c.name} (ID: {c.id})
                              </Select.Option>
                            ))}
                          </Select>
                          {centerList.length === 0 && (
                            <Alert
                              message="등록된 센터가 없습니다"
                              type="info"
                              style={{ marginBottom: 16 }}
                            />
                          )}
                          <Popconfirm
                            title="센터 변경 확인"
                            description={`${selectedMember.name}님의 소속 센터를 변경하시겠습니까?`}
                            onConfirm={handleCenterChange}
                            okText="변경"
                            cancelText="취소"
                            okButtonProps={{ loading: centerChangeLoading }}
                            disabled={!newCenterId}
                          >
                            <Button
                              type="primary"
                              icon={<HomeOutlined />}
                              block
                              disabled={!newCenterId || centerList.length === 0}
                              loading={centerChangeLoading}
                            >
                              센터 변경
                            </Button>
                          </Popconfirm>
                        </div>
                      ),
                    },
                    {
                      key: 'editInfo',
                      label: (
                        <Space>
                          <FormOutlined />
                          <Text strong>정보 수정</Text>
                        </Space>
                      ),
                      children: (
                        <div>
                          <div style={{ marginBottom: 12 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                              이름
                            </Text>
                            <Input
                              placeholder="새 이름"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              defaultValue={selectedMember.name}
                            />
                          </div>
                          <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                              전화번호
                            </Text>
                            <Input
                              placeholder="010-0000-0000"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                            />
                          </div>
                          <Button
                            type="primary"
                            icon={<FormOutlined />}
                            block
                            loading={editLoading}
                            onClick={handleEditMember}
                            disabled={!editName && !editPhone}
                          >
                            정보 수정
                          </Button>
                        </div>
                      ),
                    },
                    {
                      key: 'deactivate',
                      label: (
                        <Space>
                          <StopOutlined />
                          <Text strong style={{ color: '#ff4d4f' }}>
                            회원 비활성화
                          </Text>
                        </Space>
                      ),
                      children: (
                        <div>
                          <Alert
                            message="주의: 비활성화된 회원"
                            description="비활성화된 회원은 로그인할 수 없으며, 조직도에서 제외됩니다. 이 작업은 되돌릴 수 있습니다."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                          <Popconfirm
                            title="회원 비활성화 확인"
                            description={`정말 ${selectedMember.name}님을 비활성화하시겠습니까?`}
                            onConfirm={handleDeactivateMember}
                            okText="비활성화"
                            cancelText="취소"
                            okButtonProps={{ danger: true, loading: deactivateLoading }}
                          >
                            <Button
                              danger
                              icon={<StopOutlined />}
                              block
                              loading={deactivateLoading}
                            >
                              회원 비활성화
                            </Button>
                          </Popconfirm>
                        </div>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>

      {/* 동명이인 검색 결과 선택 모달 */}
      <Modal
        title={
          <Space>
            <SearchOutlined />
            검색 결과 선택 ({searchResults.length}명)
          </Space>
        }
        open={searchModalVisible}
        onCancel={() => {
          setSearchModalVisible(false);
          setSearchResults([]);
        }}
        footer={null}
        width={600}
      >
        <Alert
          message={`"${searchTerm}" 검색 결과 ${searchResults.length}명이 있습니다. 조회할 회원을 선택하세요.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={searchResults}
          renderItem={(member) => (
            <List.Item
              onClick={() => handleSelectSearchResult(member)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                marginBottom: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <List.Item.Meta
                avatar={<UserOutlined style={{ fontSize: 24, color: gradeColors[member.grade] }} />}
                title={
                  <Space>
                    <Tag color={gradeColors[member.grade]}>{gradeLabels[member.grade]}</Tag>
                    <Text strong>{member.name}</Text>
                    <Text type="secondary">(ID: {member.id})</Text>
                  </Space>
                }
                description={
                  <Space split={<Divider type="vertical" />}>
                    <span>이메일: {member.email || '-'}</span>
                    <span>누적PV: {member.cumulativePv?.toLocaleString() || 0}</span>
                    <span>직속 하위: {member.children?.length || 0}명</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </DashboardLayout>
  );
}
