# DESIGN-004 manual verification

**일자**: 2026-04-15 / **담당**: 이준호 (UX) + 신예진 (FE)

## 변경

`apps/frontend/src/app/organization/page.tsx` 2개 영역:

### 1. gradeColors + gradeLabels (line 39-56)
- 이전 5단계 (ADMIN/DIVISION_CHIEF/BRANCH_CHIEF/MANAGER/AGENT/MEMBER)
- 신 5등급 (ADMIN/CENTER/BRANCH_MANAGER/TEAM_LEADER/SALESPERSON)
- 한글명: 관리자/센터/지사장/팀장/판매원

### 2. Select.Option (line 434-439)
- 동일하게 6개 → 5개로 정정 (구 MEMBER + AGENT 통합 → SALESPERSON)

## 사유

prd/디자인팀_파악된내용.md High #1: SALESPERSON 회원이 /organization 접속 시 Tag undefined/회색. 이제 정상 색상/한글명 표시.

## 후속 (Stage 4 후속)

- DESIGN-006 console.log 30+ 정리 (별도 batch)
- react-d3-tree로 전환 권장 (admin과 일관) — 별도 항목

## Pass 기준

- [x] gradeColors 5개 키 신 체계
- [x] gradeLabels 5개 키 신 체계
- [x] Select.Option 5개 키 신 체계
- [ ] 런타임 검증 (브라우저 접속)

## 결과: PASS (정적 검증)
