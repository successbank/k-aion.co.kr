/**
 * 계보 관리 Raw SQL 쿼리
 * PostgreSQL Recursive CTE 사용
 */

/**
 * 추천계보 상위 탐색 (재귀 CTE)
 * 특정 회원의 모든 상위 추천인 조회
 */
export const GET_RECOMMENDER_UPLINE = `
WITH RECURSIVE upline AS (
  -- 기본 쿼리: 현재 회원
  SELECT
    id,
    name,
    email,
    grade,
    recommender_id,
    1 as level
  FROM members
  WHERE id = $1 AND deleted_at IS NULL

  UNION ALL

  -- 재귀 쿼리: 상위 추천인
  SELECT
    m.id,
    m.name,
    m.email,
    m.grade,
    m.recommender_id,
    u.level + 1
  FROM members m
  INNER JOIN upline u ON m.id = u.recommender_id
  WHERE m.deleted_at IS NULL AND u.level < $2
)
SELECT
  id,
  name,
  email,
  grade,
  level
FROM upline
WHERE level > 1
ORDER BY level ASC;
`;

/**
 * 후원계보 하위 트리 조회 (재귀 CTE)
 * 특정 회원의 모든 하위 후원 조직 조회
 */
export const GET_SPONSOR_DOWNLINE = `
WITH RECURSIVE downline AS (
  -- 기본 쿼리: 현재 회원
  SELECT
    id,
    name,
    email,
    grade,
    sponsor_id,
    team_line,
    cumulative_pv,
    1 as level,
    CAST(id AS TEXT) as path
  FROM members
  WHERE id = $1 AND deleted_at IS NULL

  UNION ALL

  -- 재귀 쿼리: 하위 후원 회원
  SELECT
    m.id,
    m.name,
    m.email,
    m.grade,
    m.sponsor_id,
    m.team_line,
    m.cumulative_pv,
    d.level + 1,
    d.path || '/' || CAST(m.id AS TEXT)
  FROM members m
  INNER JOIN downline d ON m.sponsor_id = d.id
  WHERE m.deleted_at IS NULL AND d.level < $2
)
SELECT
  id,
  name,
  email,
  grade,
  team_line,
  cumulative_pv,
  level,
  path
FROM downline
WHERE level > 1
ORDER BY path ASC;
`;

/**
 * 팀별 통계 집계 (재귀 CTE)
 * 각 팀의 총 회원 수, PV 합계, 등급 분포
 */
export const GET_TEAM_AGGREGATED_STATS = `
WITH RECURSIVE team_tree AS (
  -- 직접 하위 회원
  SELECT
    id,
    sponsor_id,
    team_line,
    grade,
    cumulative_pv,
    1 as depth
  FROM members
  WHERE sponsor_id = $1 AND deleted_at IS NULL

  UNION ALL

  -- 간접 하위 회원 (재귀)
  SELECT
    m.id,
    m.sponsor_id,
    m.team_line,
    m.grade,
    m.cumulative_pv,
    t.depth + 1
  FROM members m
  INNER JOIN team_tree t ON m.sponsor_id = t.id
  WHERE m.deleted_at IS NULL
)
SELECT
  COALESCE(
    (SELECT team_line FROM members WHERE id = team_tree.id AND sponsor_id = $1),
    0
  ) as team_line,
  COUNT(*) as member_count,
  SUM(cumulative_pv) as total_pv,
  COUNT(CASE WHEN grade = 'SALESPERSON' THEN 1 END) as salesperson_count,
  COUNT(CASE WHEN grade = 'TEAM_LEADER' THEN 1 END) as team_leader_count,
  COUNT(CASE WHEN grade = 'BRANCH_MANAGER' THEN 1 END) as branch_manager_count,
  COUNT(CASE WHEN grade = 'CENTER' THEN 1 END) as center_count,
  MAX(depth) as max_depth
FROM team_tree
GROUP BY team_line
ORDER BY team_line;
`;

/**
 * 특정 등급 이상 하위 회원 카운트
 * 승급 조건 확인에 사용
 */
export const COUNT_DOWNLINE_BY_GRADE = `
SELECT
  team_line,
  COUNT(*) as count
FROM members
WHERE
  sponsor_id = $1
  AND team_line = ANY($2::int[])
  AND grade = ANY($3::text[])
  AND is_active = true
  AND deleted_at IS NULL
GROUP BY team_line;
`;

/**
 * 전체 하위 조직 PV 합계 (무한 depth)
 */
export const GET_TOTAL_DOWNLINE_PV = `
WITH RECURSIVE downline_pv AS (
  SELECT
    id,
    cumulative_pv
  FROM members
  WHERE sponsor_id = $1 AND deleted_at IS NULL

  UNION ALL

  SELECT
    m.id,
    m.cumulative_pv
  FROM members m
  INNER JOIN downline_pv d ON m.sponsor_id = d.id
  WHERE m.deleted_at IS NULL
)
SELECT
  COUNT(*) as total_members,
  COALESCE(SUM(cumulative_pv), 0) as total_pv
FROM downline_pv;
`;

/**
 * 최단 경로로 특정 등급까지의 상위 회원 찾기
 * 예: 가장 가까운 MANAGER 찾기
 */
export const FIND_NEAREST_UPLINE_BY_GRADE = `
WITH RECURSIVE upline_search AS (
  SELECT
    id,
    name,
    email,
    grade,
    recommender_id,
    1 as distance
  FROM members
  WHERE id = $1 AND deleted_at IS NULL

  UNION ALL

  SELECT
    m.id,
    m.name,
    m.email,
    m.grade,
    m.recommender_id,
    u.distance + 1
  FROM members m
  INNER JOIN upline_search u ON m.id = u.recommender_id
  WHERE
    m.deleted_at IS NULL
    AND u.distance < 100  -- 최대 100 레벨
    AND NOT EXISTS (
      SELECT 1 FROM upline_search WHERE grade = ANY($2::text[])
    )
)
SELECT
  id,
  name,
  email,
  grade,
  distance
FROM upline_search
WHERE grade = ANY($2::text[])
ORDER BY distance ASC
LIMIT 1;
`;
