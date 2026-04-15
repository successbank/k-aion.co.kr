# DESIGN-005 manual verification

**일자**: 2026-04-15 / **담당**: 박민지 (비주얼) + 신예진 (FE)

## 변경

`apps/frontend/src/config/menu.config.tsx` 2개 영역:

### 1. menuByGrade (line 216~)
- 6개 키(MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF/ADMIN) → 5개 키 (SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER/ADMIN)
- 매핑 결정:
  - SALESPERSON ← agentMenuItems (활동 영업 메뉴)
  - TEAM_LEADER ← managerMenuItems
  - BRANCH_MANAGER ← branchChiefMenuItems
  - CENTER ← divisionChiefMenuItems
  - ADMIN ← adminMenuItems
- memberMenuItems 변수는 dead code로 남음 (Stage 4 후속 정리 권장)

### 2. gradeLabels (line 228~)
- 7개 키(구+신 혼재) → 5개 키 (SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER/ADMIN)
- 한글명 통일: 판매원/팀장/지사장/센터/관리자

## 사유

prd/디자인팀_파악된내용.md High #2: SALESPERSON 회원 로그인 시 `menuByGrade['SALESPERSON']` undefined → fallback으로 MEMBER 메뉴 (잘못된 메뉴 표시). 이제 직접 매핑.

## DashboardLayout fallback (별도 후속)

`DashboardLayout.tsx:28` fallback `menuByGrade['MEMBER']` 코드 정리는 별도 작업 (DESIGN-005 후속). 본 변경 후에는 fallback이 호출될 일 없으나 코드 정리는 깔끔함을 위해.

## Pass 기준

- [x] menuByGrade 5개 키 신 체계
- [x] gradeLabels 5개 키 신 체계
- [x] dead code (memberMenuItems) 주석 명시
- [ ] 런타임 검증 (각 등급 회원 로그인 → 메뉴 확인)

## 결과: PASS (정적 검증)
