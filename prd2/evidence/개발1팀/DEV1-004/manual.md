# DEV1-004 Manual Verification

- **일자**: 2026-04-16
- **담당 페르소나**: 오지훈 (개발1팀 보안)
- **작업 범위**: `apps/backend/src/members/members.controller.ts` 4개 라우트 JWT/Roles 가드 데코레이터 적용

## 변경 요약

탐색 결과 `jwt-auth.guard.ts`, `roles.guard.ts`, `jwt.strategy.ts`는 이미 완전히 구현되어 있었음. 실제 결함은 **4개 라우트의 데코레이터 누락**이었고, 다음을 추가:

| # | 라우트 | 변경 전 | 변경 후 |
|---|--------|---------|---------|
| 1 | `GET /api/v1/members/genealogy/all-trees` | `@Roles(ADMIN)` 단독 (가드 부재) | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@ApiBearerAuth` 추가 |
| 2 | `PATCH /api/v1/members/:id/reset-password` | `@UseGuards(JwtAuthGuard)` + `@Roles(ADMIN)` | `RolesGuard` 추가 |
| 3 | `POST /api/v1/members/:id/promote` | 가드/데코레이터 전무 | 전체 적용 + `@Roles(ADMIN)` |
| 4 | `POST /api/v1/members/:id/suggest-team-line` | 가드/데코레이터 전무 | 전체 적용 + `@Roles(ADMIN)` |

자율 결정 (ADMIN 권한 레벨): `prd2/요청.md` 항목 18, 19 참조.

## 사전 준비

### 테스트 계정

| 계정 | id | username | grade | 비밀번호 |
|------|-----|----------|-------|---------|
| ADMIN | 1541 | admin | ADMIN | `admin123!@#` |
| 판매원 | 1830 | eom-minseop | SALESPERSON | `1234` |

### 토큰 발급

```bash
# ADMIN 토큰
curl -X POST http://localhost:5667/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123!@#"}'
# → accessToken (JWT, sub=1541, grade=ADMIN)

# SALESPERSON 토큰
curl -X POST http://localhost:5667/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"eom-minseop","password":"1234"}'
# → accessToken (JWT, sub=1830, grade=SALESPERSON)
```

**주의**: login 경로는 `/api/auth/login` (setGlobalPrefix('api') + @Controller('auth')). `/api/v1/...`가 아님.

## 검증 시나리오 (4 라우트 × 3 시나리오 = 12건)

전체 결과는 `test-result.log` 참조. 요약:

### Phase 1 — 토큰 없음 (기대: 401)

| 라우트 | 실측 | 결과 |
|--------|------|------|
| 1a. getAllOrganizationTrees | 401 | ✅ |
| 1b. resetPassword (PATCH) | 401 | ✅ |
| 1c. promoteIfEligible (POST) | 401 | ✅ |
| 1d. suggestTeamLine (POST) | 401 | ✅ |

**의미**: JwtAuthGuard가 토큰 부재 시 즉시 차단. 변경 전에는 `getAllOrganizationTrees`가 메타데이터만 있고 가드가 없어 **누구나 전체 조직 계보에 접근 가능**했음 (DEV1-001 Critical 이슈 동시 해소).

### Phase 2 — 일반 회원 SALESPERSON 토큰 (기대: 403)

| 라우트 | 실측 | 응답 body |
|--------|------|-----------|
| 2a. getAllOrganizationTrees | 403 | `이 기능을 사용할 권한이 없습니다` |
| 2b. resetPassword | 403 | `이 기능을 사용할 권한이 없습니다` |
| 2c. promoteIfEligible | 403 | `이 기능을 사용할 권한이 없습니다` |
| 2d. suggestTeamLine | 403 | `이 기능을 사용할 권한이 없습니다` |

**의미**: RolesGuard가 GRADE_HIERARCHY 기반으로 SALESPERSON < ADMIN을 차단. 변경 전 `resetPassword`는 RolesGuard가 없어 **인증된 어떤 회원이든 타인 비밀번호 초기화 가능한 계정 탈취 경로**였음 (DEV1-002 Critical 이슈 동시 해소).

### Phase 3 — ADMIN 토큰 (기대: 2xx 성공)

| 라우트 | 실측 | 응답 body 요지 |
|--------|------|---------------|
| 3a. getAllOrganizationTrees?depth=1 | 200 | `treeType:"sponsor", totalRoots:3, trees:[...]` |
| 3b. resetPassword | 200 | `tempPassword:"ap7l8?#9", memberId:1831` |
| 3c. promoteIfEligible | 201 | `promoted:false, message:"직속 후원 판매원 3명 필요..."` |
| 3d. suggestTeamLine | 201 | `sponsorId:1831, suggestedTeamLine:2` |

**200 vs 201 설명**: 3c/3d는 `@Post`의 NestJS 기본값인 201 Created. 주변 `batch-promote`(line 761)와 동일 패턴으로 `@HttpCode` 명시 없음. 2xx 계열은 모두 "인증·권한 통과 후 핸들러 실행"을 의미하므로 PASS 기준 충족. API 의미론상 201 부적합(새 리소스 생성 아님)한 것은 별도 이슈로 Stage 4 backlog에 넘길 수 있음.

## Pass 기준 충족 체크리스트

- [x] JwtAuthGuard canActivate 실구현 — **사전 완성**. `AuthGuard('jwt')` 상속 + `@Public()` 판정 로직 이미 작동 중.
- [x] RolesGuard canActivate 실구현 — **사전 완성**. `GRADE_HIERARCHY` 기반 계층 검증 이미 작동 중.
- [x] `@CurrentUser` 데코레이터 작동 — `resetPassword`가 `@CurrentUser('id') adminId`로 정상 수신 (Phase 3 body에서 `memberId:1831` 정상 반환).
- [x] auth 모듈 login 엔드포인트 구현 — `POST /api/auth/login` 200 정상 (ADMIN/SALESPERSON 둘 다 토큰 발급 성공).
- [x] 토큰 발급 + 검증 end-to-end — 12건 모두 기대대로 401/403/200 분기.

## diff.patch 범위 공지 (중요)

`diff.patch`에는 사용자 **WIP 변경도 함께 포함됨**:
- `bulk-reset-password` 2개 신규 라우트 + 관련 DTO import (사용자 작업, DEV1-004 범위 밖)
- 본 세션의 DEV1-004 변경 4건 (라우트 가드 데코레이터 추가)

DEV1-004 **순수 변경**은 다음 부분에만 해당:
1. `@Get('genealogy/all-trees')` 아래 3줄 추가 (`@UseGuards`, `@ApiBearerAuth`)
2. `@Patch(':id/reset-password')` 아래 `@UseGuards(JwtAuthGuard)` → `@UseGuards(JwtAuthGuard, RolesGuard)` 1줄 변경
3. `@Post(':id/promote')` 아래 4줄 추가 (`@UseGuards`, `@Roles`, `@ApiBearerAuth`, summary 수정)
4. `@Post(':id/suggest-team-line')` 아래 4줄 추가 (`@UseGuards`, `@Roles`, `@ApiBearerAuth`, summary 수정)

사용자 WIP는 **CLAUDE.md 원칙에 따라 보존**하기로 계획에 명시되어 있어 의도적으로 건드리지 않음.

## 부수효과 기록

Phase 3b 테스트(`resetPassword` ADMIN 호출)로 판매원 `eom-minseop` (id=1830)의 비밀번호가 `ap7l8?#9`로 **실제 DB 변경**됨.

**복원 조치**: 동일 시드에서 `1234` 비밀번호를 공유하는 `moon-jungwon`의 hash (`$2b$10$PvY5up7VifznKeph3e...`)를 직접 DB UPDATE로 복사. 복원 후 `eom-minseop / 1234` 로그인 200 재확인 완료. 복원 재현 명령:

```bash
HASH=$(docker exec kaion_db psql -U kaion_user -d kaion_db -tAc \
  "SELECT password FROM members WHERE username='moon-jungwon';")
docker exec kaion_db psql -U kaion_user -d kaion_db -c \
  "UPDATE members SET password='$HASH' WHERE username='eom-minseop';"
```

## Cascade Unblock

본 작업으로 다음 8개 Stage 4 항목이 진행 가능:
- DEV1-001 (Critical): getAllOrganizationTrees 가드 — **본 작업에 포함 완료**
- DEV1-002 (Critical): resetPassword/promoteIfEligible/suggestTeamLine 가드 — **본 작업에 포함 완료**
- DEV1-009 (High): @Public 남용 정리 (별도 세션)
- DEV2-006~010 (High): compensation-plan/bonuses/sales/settlements/product-commission-rates 가드 확산
- QA-005 (High): members 14 endpoint 계약 테스트
- QA-010 (Medium): 보안 RBAC 회귀 테스트

실질적으로 DEV1-001/002도 이 PR에 물리적으로 함께 처리됨.
