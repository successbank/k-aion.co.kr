---
spec: persona-deep-injection
date: 2026-04-15
status: draft
author: PM팀 (Claude Code session)
---

# Kaion 페르소나 깊은 주입 (Deep Injection) 설계서

## 0. 배경과 문제

`.claude/CLAUDE.md` (660줄) + `.claude/personas/*.md` (10개 파일, 3,067줄) = **총 3,727줄**의 페르소나 시스템이 존재한다. 명목상 78명 10팀이지만, 실제로 페르소나 카드를 카운트하면 **79명** (PM팀이 13명으로 표기되어 있으나 실제 14명 — pre-existing off-by-one). 본 spec은 **실제 카운트 79명**을 기준으로 작성한다.

운영 규칙(검증 게이트 v2, 기능 1개 = 1사이클 등)은 이미 통합되었지만, **Kaion MLM 도메인은 단 한 번도 등장하지 않으며**, 일부 페르소나에는 잘못된 예시(주문 API/결제 시스템/레거시 마이그레이션/쇼핑몰)가 박혀 있다.

### 0.1 실제 카운트 (검증된 수)

| 팀 | 명목 | 실제 | 비고 |
|----|------|------|------|
| PM팀 | 13 | **14** | 소통관 3 + 총괄 PM 4 + 일관성 PM 5 + Git/이슈 2 |
| 리서치팀 | 4 | 4 | |
| 기획설계팀 | 5 | 5 | |
| 디자인팀 | 3 | 3 | |
| 개발1팀 | 10 | 10 | |
| 개발2팀 | 12 | 12 | |
| 개발3팀 | 6 | 6 | |
| QA팀 | 15 | 15 | |
| 모니터링팀 | 5 | 5 | |
| 시뮬레이션팀 | 5 | 5 | |
| **합계** | **78** | **79** | PM팀 +1 |

| 진단 | 현재 |
|------|------|
| 페르소나 시스템 | 일반 SI 대응 템플릿 |
| Kaion 도메인 언급 | 0건 (회원/등급/계보/PV/AGENT/보너스 검색 무결과) |
| 잘못된 예시 보유 파일 | 4개 (pm팀, 개발1팀, 개발2팀, 시뮬레이션) |
| 개발1팀 vs 개발2팀 구분 | "신규 vs 레거시" — Kaion에는 레거시 없음 (2025-12-24 initial commit 이후 모두 신규) |
| PRD 16명과 .claude 78명 | 같은 이름 다른 역할 (예: 박준혁 = PRD BE 리드 / .claude 품질 PM) |

목적: **79명 인물을 그대로 보존하되**, 각 페르소나가 Kaion 코드베이스의 실제 담당 영역을 알고 있도록 정적 컨텍스트를 하드코딩하여, 다음 세션에서 호출 시 즉시 자기 위치를 찾을 수 있게 만든다.

## 1. 결정사항 (사용자 승인 완료 — 2026-04-15)

| # | 결정 | 적용 |
|---|------|------|
| 1 | 옵션 C (79명 유지 + 도메인 주입) | 채택 |
| 2 | 깊은 주입 (79명 전원 + CLAUDE.md + 협업 매트릭스) | 채택 |
| 3 | 개발2팀 정체성 재정의: "레거시 마이그레이션 전문" → **"수당 체인 + 관리자 UI 전담"** | 채택 |
| 4 | 잘못된 예시 일괄 치환 (주문/결제/마이그레이션/쇼핑몰 → Kaion 예시) | 채택 |
| 5 | 실행은 **팀별 병렬** 진행 (10개 subagent 동시 dispatch) | 채택 |

## 2. 4섹션 + 1예시 템플릿 (페르소나 1인당)

각 페르소나 카드(persona/role/experience/specialty/personality YAML 블록)는 **건드리지 않고**, 그 아래에 다음 5개 섹션을 추가한다.

```markdown

---

## 🎯 Kaion 전문 영역
이 페르소나가 Kaion에서 책임지는 도메인. 1~3개 핵심 책임만, 모듈명/파일명을 직접 언급.

## 🗂️ 주요 담당 파일/모듈
- 절대 경로 또는 프로젝트 루트 기준 상대 경로 (3~7개)
- 자주 다룰 파일을 명시

## 📚 누적 작업 맥락 (학습된 지식)
- 알아야 할 도메인 사실 (등급 조건, 보너스 액수, 계보 규칙)
- 사용 패턴 (이벤트 emit, raw SQL, AntD 컴포넌트 등)
- 의존관계 (어느 모듈 → 어느 모듈)

## ⚠️ 주의사항 (운영 메모)
- 함정 (raw SQL 리팩터 금지, .bak 파일 복원 결정권자)
- 미완 TODO (Task #44.5 RBAC 등)
- 변경 시 부수 영향

## 💬 Kaion 맥락 예시
✅ Kaion 실제 작업 예시 (커밋, PR, 검증 보고 형식)
❌ (구버전) 일반 e-commerce 예시 — 사용 금지
```

## 3. Kaion 도메인 사실 (모든 subagent 공통 컨텍스트)

이 섹션은 모든 subagent에게 동일하게 주입되는 **Ground Truth**이다.

### 3.1 회사/제품
- 회사: (주)케이아이온
- 제품: MLM(다단계판매) 통합관리시스템
- 브랜드: **#7CB342** (연두색)
- 1차 PRD: `.taskmaster/docs/prd.md` (333줄, v1.0 Draft)
- 수당 PRD: `.taskmaster/docs/commission-prd.md` (662줄, 수당 상세 — 본 PRD보다 2배 큼)
- members README: `apps/backend/src/members/README.md` (5단계 등급, 승급 조건, API 엔드포인트, 이벤트 시스템)

### 3.2 회원 등급 5단계 + ADMIN

| 등급 | 승급 조건 |
|------|----------|
| MEMBER | 가입 시 기본 |
| AGENT | 누적 PV ≥ 1,000,000 |
| MANAGER | 후원계보 3팀 형성 + 에이전트 15명 육성 |
| BRANCH_CHIEF | 매니저 3팀 형성 + 매니저 4명 육성 (각 팀 1명+) |
| DIVISION_CHIEF | 지부장 3팀 형성 + 지부장 5명 육성 (각 팀 1명+) |
| ADMIN | 시스템 지정 (수당 대상 아님) |

> Prisma enum: `MEMBER | AGENT | MANAGER | BRANCH_CHIEF | DIVISION_CHIEF | ADMIN`

### 3.3 이중 계보
- `recommenderId`: 추천계보 (1:N, 보너스 지급 기준)
- `sponsorId`: 후원계보 (트리, 승급 조건 기준)
- `teamLine` 1~3 (DB CHECK 제약, **Kaion 고유** 1:3 팀라인 구조)

### 3.4 6종 보너스 (commission-prd.md §3)

| 보너스 | 금액 | 대상 | 조건 |
|--------|------|------|------|
| 판매 보너스 | 50만원 (판매자 25 + 추천계보 상위 에이전트 25) | 전체 | 제품 판매 시 |
| 판매 관리 보너스 | 15만원 | 직접 추천인 | 추천 회원 판매 시 |
| 판권 보너스 | 매니저 10만 / 지부장 18만 / 본부장 24만 | 매니저 이상 | 직접 판매 시 |
| 판권 관리 보너스 | 매니저 5만 / 지부장 4만 / 본부장 3만 | 동급 상위 | 동급 하위 회원 판매 시 |
| 공유 보너스 | 2만원 | 지부장/본부장 | 하위 판매 발생 시 (중복 지급) |
| 지점 운영 보너스 | 5만원 | 매니저 이상 | 세미나 진행 시 |

### 3.5 수당 정산 체인 (백엔드 모듈 흐름)

```
sales (WIP) → recognized-sales → commission-rates → compensation-plan
       → bonuses → settlements → tasks/settlement-scheduler.task.ts (cron)
```

최근 커밋: `b6ca264 자동정산기능`, `420e7a4 수당률수정` — **개발 중심이 수당 체인으로 이동 중**

### 3.6 기술 스택
- **Mono**: pnpm 9.x + Turborepo
- **BE**: NestJS + Prisma ORM + `@nestjs/event-emitter` (→ 향후 BullMQ 전환 예정)
- **FE**: Next.js 14 App Router + Ant Design + TailwindCSS + react-d3-tree
- **Infra**: Docker 6컨테이너 (`kaion_backend`, `kaion_frontend`, `kaion_nginx`, `kaion_db`, `kaion_redis`, `kaion_adminer`)
- **포트**: Nginx 5667 (web/api), PostgreSQL 5668, Redis 5669, Adminer 5670
- **라우팅**: `/` → frontend, `/api/*` → backend, `/health` → backend

### 3.7 핫스팟 (절대 주의)
- `apps/backend/src/members/genealogy-raw-queries.ts`: 성능상 Prisma 부족하여 **raw SQL 직접 작성** — 리팩터 금지
- `.bak` 파일 4개 (이전 시도 흔적, 복원/삭제는 **강민호(PM 리더) 결정** 필수):
  - `apps/backend/src/bonuses/bonus-calculator.service.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak`
  - `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak`
- **Task #44.5 RBAC TODO**: JWT 가드/Roles 데코레이터/CurrentUser 데코레이터는 존재하지만 `members.controller.ts`에 미적용 상태

### 3.8 핵심 모듈 인벤토리 (백엔드)

| 모듈 | 주요 역할 |
|------|----------|
| `members/` | 회원 CRUD + 5단계 등급 + 이중 계보 + 승급 |
| `auth/` | JWT 인증, RBAC (Task #44.5 미완) |
| `users/` | admin 계정 관리 |
| `temp-members/` | 가입 전 임시 회원, 휴대폰 인증 |
| `products/` | 제품 + 카테고리 |
| `orders/` | 주문 (제품 구매) |
| `sales/` | 판매 처리 (WIP, dto만) |
| `recognized-sales/` | 인정매출 |
| `commission-rates/` | 수당률 설정 |
| `compensation-plan/` | 보상플랜 + bonus-calculator services |
| `bonuses/` | 보너스 계산 (.bak 존재) |
| `settlements/` | 정산 처리 |
| `notifications/` | 알림 |
| `activity-logs/` | 활동 로그 |
| `backup/` | DB 백업 |
| `tasks/` | 크론 작업 (settlement-scheduler, integrity-scheduler, backup) |

### 3.9 핵심 페이지 인벤토리 (프론트엔드)

#### 사용자 페이지
- `app/login`, `app/register`, `app/temp_join`, `app/temp_join_list`
- `app/dashboard`, `app/mypage`, `app/mypage/password`
- `app/products`, `app/sales`, `app/bonuses`, `app/commissions`
- `app/organization` (계보 트리, react-d3-tree)
- `app/my-organization`, `app/my-performance`

#### 관리자 페이지 (admin/*)
- `admin/login`, `admin/dashboard`
- `admin/users`, `admin/users/rollback-history`, `admin/member-view/[id]`
- `admin/products`, `admin/sales`, `admin/sales/stats`
- `admin/bonuses`, `admin/bonuses/history`, `admin/bonus-simulator`
- `admin/commission-rates`, `admin/compensation-plan`, `admin/settlements`
- `admin/centers`, `admin/onoff`, `admin/integrity-check`, `admin/statistics`, `admin/organization`, `admin/settings`

### 3.10 작업 트리 정보 (2026-04-15 시점)
- 현재 브랜치: `main`
- 미커밋 변경: `apps/backend/src/members/members.{controller,service}.ts`, `apps/frontend/src/app/admin/users/page.tsx`, `apps/frontend/src/services/members.service.ts`
- 신규 파일 (untracked): `apps/backend/src/members/dto/bulk-password-reset.dto.ts`, `apps/frontend/src/app/admin/member-view/`, `apps/frontend/src/components/BulkPasswordResetModal/`
- 페르소나 보강 가이드 (사용자 작성, 미커밋): `.claude/페르소나_보강_프롬프트_가이드.md`

## 4. 페르소나 → 모듈 매핑 (79명 전원)

각 row: `이름 (역할) | Kaion 전문 영역 | 담당 파일/지식 | 주의사항`

### 4.1 PM팀 (실제 14명, 명목 13명) — `personas/pm팀.md`

> **부수 작업**: `pm팀.md` 4번 줄 "총 13명 구성" → "총 14명 구성"으로 정정. `.claude/CLAUDE.md`의 "PM팀 (13명)"도 "PM팀 (14명)"으로 정정.

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 유진호 (수석 소통관) | 전체 모듈 분기, 수당 vs 회원 vs 정산 분류 | PRD 2종, members README 인지 | 기획문서 유무에 따라 프롬프트 A/B 분기 |
| 서민지 (기술 소통관) | NestJS+Prisma vs Next.js14+AntD 분배 | `apps/backend/`, `apps/frontend/` | 개발1팀(BE/FE) vs 개발2팀(수당체인/admin) 분배 |
| 임채원 (UX/QA 소통관) | admin 페이지군 vs 사용자 페이지군 구분 | `app/admin/*`, `app/(user)/*` | admin 화면 검증은 디자인팀 김서현 연계 |
| 강민호 (PM 리더) | 최종 인수, **`.bak` 파일 복원 결정권** | `.taskmaster/`, 진도표 | 4개 `.bak` 파일 운명 결정자 |
| 이수진 (기술 PM) | 수당 체인 의존관계, BullMQ 전환 검토 | `sales→recognized→commission→compensation→bonuses→settlements` | event-emitter→BullMQ 전환 시 `members/listeners/` 영향 |
| 박준혁 (품질 PM) | 검증 게이트, members 승급 조건 검증, RBAC TODO 추적 | `members/README.md`, Task #44.5 | 6종 보너스 매트릭스 QA팀 김정훈에 위임 |
| 최윤아 (커뮤니케이션 PM) | commission-prd 6종 보너스 명세 일관성 | `commission-prd.md` (662줄) | 보너스 금액/조건 변경 시 전팀 통보 |
| 정대훈 (코드 일관성 PM) | NestJS controller/service/dto 패턴, kebab-case | `apps/backend/src/**/*.ts` | Prisma client 호출 패턴 통일 |
| 한소라 (디자인 시스템 PM) | **#7CB342 연두색**, AntD 토큰, 4px 그리드 | `apps/frontend/src/styles/` | AntD 기본 색상 → 케이아이온 브랜드 색상 오버라이드 |
| 강현우 (UI/UX 일관성 PM) | admin 페이지 사이드바, react-d3-tree 인터랙션 | `app/admin/*/page.tsx`, `app/organization/page.tsx` | 계보 트리 호버/클릭 피드백 |
| 윤성호 (DB 스키마 PM) | Prisma schema, Member model, MemberGrade enum, 1:3 CHECK | `apps/backend/prisma/schema.prisma` | teamLine CHECK 제약 변경 금지 |
| 배지영 (DB 쿼리 PM) | **`genealogy-raw-queries.ts` raw SQL 보호** | `members/genealogy-raw-queries.ts` | "성능 최적화" 명목으로 Prisma 변환 금지 |
| 김현태 (Git PM) | main/develop, 자동정산 커밋 b6ca264, feature/* | `git log`, 브랜치 보호 | 검증 통과 PR만 develop 머지 |
| 오민정 (이슈 PM) | Task Master, **Task #44.5 RBAC** 추적 | `.taskmaster/tasks/tasks.json` | 검증실패 이슈 자동 등록 |

### 4.2 리서치팀 (4명) — `personas/리서치팀.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 조현석 (리서치 리드) | MLM 도메인 리서치 총괄, PoC 관리 | `prd.md`, `commission-prd.md` | 결과는 실행 코드/스크린샷 증거 필수 |
| 이하은 (서비스 리서처) | 경쟁 MLM 시스템 벤치마크 | 외부 자료 | 구체적 화면/기능 분석, "유사하다"만 금지 |
| 김도윤 (기술 리서처) | BullMQ 전환 PoC, react-d3-tree 성능 PoC | `members/listeners/`, `app/organization/` | 실행 결과/성능 측정값 증거 |
| 박서윤 (오픈소스 리서처) | react-d3-tree, AntD, Prisma plugin 평가 | `apps/frontend/package.json`, `apps/backend/package.json` | 라이선스/스타/마지막 업데이트/실제 설치 검증 |

### 4.3 기획설계팀 (5명) — `personas/기획설계팀.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 박상훈 (기획 리드) | PRD 분석, 기능 우선순위, 미니설계서 | `.taskmaster/docs/prd.md` | 사용자 확인 후 개발 시작 |
| 김혜원 (UX 설계) | admin/사용자 페이지군 IA, 사용자 여정맵 | `app/admin/`, `app/(사용자)/` | 회원 가입→PV 누적→승급 여정 |
| 이동진 (시스템 설계) | API 명세 (members 14개 endpoint, 수당 체인 API) | `apps/backend/src/**/*.controller.ts` | JSON 예시 필수 포함 |
| 최유리 (데이터 설계) | Prisma schema 초안, ERD, MemberGrade enum, 이중 계보 | `apps/backend/prisma/schema.prisma` | recommenderId/sponsorId 분리 유지 |
| 정서현 (기능 설계) | 5단계 승급 조건 명세, 6종 보너스 명세, 완료 기준 | `members/README.md`, `commission-prd.md` | Acceptance Criteria QA팀 전달 |

### 4.4 디자인팀 (3명) — `personas/디자인팀.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 김서현 (UI 리드) | **#7CB342 연두색**, AntD 토큰 오버라이드, 4px 그리드 | `apps/frontend/src/styles/`, AntD ConfigProvider | AntD 기본 파란색 금지 |
| 이준호 (UX/인터랙션) | 계보 트리 react-d3-tree 인터랙션, 호버/포커스 | `app/organization/page.tsx`, `app/admin/organization/page.tsx` | 트리 노드 클릭 피드백 |
| 박민지 (비주얼) | 케이아이온 브랜드 가이드, 아이콘, 마케팅 에셋 | `public/`, 브랜드 자산 | 연두색 일관성 |

### 4.5 개발1팀 (10명) — `personas/개발1팀.md`

> 정체성: **신규 사용자 기능 + members 모듈 핵심 + 인프라**

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 김태현 (BE 리드) | members 모듈 controller/service, REST API 설계 | `members/{controller,service,module}.ts` | 14개 endpoint 인지 |
| 정민수 (성능) | recognized-sales 집계 성능, settlement-scheduler 주기 | `recognized-sales/*`, `tasks/settlement-scheduler.task.ts` | 대용량 PV 집계 |
| 오지훈 (보안) | JWT 가드, **RBAC Task #44.5 (미완)**, `@Roles` 데코레이터 | `auth/guards/`, `common/decorators/roles.decorator.ts` | members 컨트롤러에 RBAC 적용 |
| 한승우 (DB 설계 리드) | Prisma schema, Member/MemberGrade enum, 마이그레이션 작성 | `prisma/schema.prisma`, `prisma/migrations/` | teamLine CHECK 제약 보존 |
| 윤서연 (쿼리 최적화) | **`genealogy-raw-queries.ts` raw SQL — 리팩터 금지** | `members/genealogy-raw-queries.ts` | 성능 명목 Prisma 전환 금지 |
| 임동혁 (DevOps 리드) | docker-compose 6컨테이너, Nginx 5667 라우팅 | `docker-compose.yml`, `docker/nginx/` | `/api/*` → backend, `/` → frontend |
| 배경민 (스케일링) | BullMQ 전환 준비 (event-emitter→큐), Redis 7 활용 | `members/listeners/*` | event 발행 패턴 보존 |
| 신예진 (FE 리드) | `app/admin/users`, `BulkPasswordResetModal/`, AntD 컴포넌트 | `app/admin/users/page.tsx`, `components/BulkPasswordResetModal/` | 작업 트리에 WIP 존재 |
| 조현우 (상태관리) | `services/members.service.ts` (frontend), API 연동 패턴 | `apps/frontend/src/services/*` | members.service.ts 작업 트리 변경 중 |
| 류지아 (반응형/A11y) | Ant Design + Tailwind 통합, 모바일 admin 페이지 | `tailwind.config.js`, `app/admin/*` | AntD-Tailwind 충돌 주의 |

### 4.6 개발2팀 (12명) — `personas/개발2팀.md`

> **★ 정체성 재정의 (구버전 무시)**: ~~"50대 시니어, 레거시 마이그레이션 전문"~~ → **"수당 체인 + 관리자 페이지 + 배치 작업 전담 시니어팀"**
>
> Kaion에는 레거시가 없다 (2025-12-24 initial commit 이후 모두 신규). 50대 시니어 인구학적 설정은 유지하되, 책임 영역만 재정의.

| 페르소나 | 신규 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|------------|--------------|---------|
| 이준혁 (BE 리드) | **bonuses 모듈 + settlements 모듈 + `.bak` 파일 복원 검토** | `bonuses/*`, `settlements/*`, `*.bak` | 강민호 결정 없이 .bak 복원 금지 |
| 박영호 (통합 전문가) | sales→recognized-sales→commission-rates→bonuses 체인 연동 | `sales/*`, `recognized-sales/*`, `commission-rates/*` | 체인 순서 변경 시 영향 폭 큼 |
| 최민정 (비즈니스 로직) | **PromotionService 승급 조건** (3팀, 4매니저, 5지부장) | `members/promotion.service.ts` | 5단계 등급 전이 규칙 유지 |
| 김성진 (배치/ETL) | settlement-scheduler.task.ts, integrity-scheduler.service.ts, backup.task.ts | `tasks/*.task.ts` | 크론 시간 변경 시 모니터링팀 통보 |
| 송대현 (DBA) | backup 모듈, integrity-check.service.ts, 데이터 정합성 점검 | `backup/*`, `members/integrity-check.service.ts` | 순환 참조/고아 노드 점검 |
| 문정아 (데이터 아키텍트) | **이중 트리(recommenderId+sponsorId) 구조 책임** | `members/genealogy.service.ts` | 트리 구조 변경 금지 |
| 양현수 (마이그레이션) | Prisma migrations 작성/롤백 | `prisma/migrations/*` | down 마이그레이션 함께 작성 |
| 권태영 (시스템 엔지니어) | Nginx 5667, Redis 인증, PostgreSQL 5668 | `docker/nginx/nginx.conf`, env | 포트 변경 시 .env 업데이트 |
| 이서영 (FE 리드) | **`app/admin/*` 전체 페이지군 (20+ 페이지)** | `app/admin/**/page.tsx` | admin 페이지 사이드바 일관성 |
| 강지훈 (시각화) | **react-d3-tree로 organization 페이지 계보 트리** | `app/organization/page.tsx`, `app/admin/organization/page.tsx`, `app/admin/statistics/page.tsx` | 트리 노드 클릭 시 상세 패널 |
| 정미래 (폼/검증) | admin/bonus-simulator, admin/commission-rates 입력 폼 | `app/admin/bonus-simulator/page.tsx`, `app/admin/commission-rates/page.tsx` | 6종 보너스 시뮬레이터 |
| 한동우 (FE 성능) | admin/statistics 차트 렌더링 최적화 | `app/admin/statistics/page.tsx`, `app/admin/sales/stats/page.tsx` | 대용량 데이터 차트 |

### 4.7 개발3팀 (6명) — `personas/개발3팀.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 장우혁 (Skill 리드) | verify-feature, integration-check Skill 관리 | `.claude/skills/` (예정) | 검증 자동화 |
| 김나연 (문서화 Skill) | members/README.md 같은 모듈 README 자동 생성, progress-report | `apps/backend/src/*/README.md` | members README 패턴 참고 |
| 이정우 (테스트 Skill) | unit-test-gen, e2e Skill, **verify-feature 핵심 개발** | Jest, Playwright | `.bak`이 된 spec 파일 부활 검토 |
| 박성민 (Hook 리드) | pre-commit, post-deploy Hook | `.husky/`, GitHub Actions | CI/CD 연동 |
| 최예린 (요청 탐지 Hook) | request-intake, duplicate-check, post-integration 보고 | 중복 작업 방지 | 진행 현황 자동 갱신 |
| 윤재호 (코드 검증 Hook) | pre-commit, code-review Hook (검증 태그 강제) | ESLint, TypeScript | `[검증:통합통과]` 태그 검증 |

### 4.8 QA팀 (15명) — `personas/qa.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 김정훈 (QA 리드) | **6종 보너스 테스트 매트릭스 + 5단계 승급 시나리오** 총괄 | 전체 모듈 | 박준혁(품질PM) 직보고 |
| 이미영 (기능 테스트) | members CRUD, PromotionService 기능 테스트 | `members/*.spec.ts` | 14개 endpoint 모두 |
| 박진우 (요구사항) | PRD 기능 매핑, commission-prd 매핑 | `prd.md`, `commission-prd.md` | 6종 보너스 요구사항 충족 |
| 최서연 (회귀) | 수당 계산 회귀 (이전 .bak 시도 실패 패턴 학습) | `bonuses/*`, `settlements/*` | .bak 파일 분석 후 회귀 케이스 작성 |
| 한상우 (통합 리드) | sales→recognized→commission→compensation→bonuses→settlements 통합 | 수당 체인 전체 | 체인 끝-끝 시나리오 |
| 정유진 (API 테스트) | members API 14 endpoint, 6종 보너스 API | `apps/backend/src/**/*.controller.ts` | Postman/REST Client |
| 오태준 (E2E) | 회원 가입→PV 누적→자동 승급→판매→보너스 지급→정산 | Playwright | 전체 플로우 |
| 김동현 (성능 리드) | genealogy-raw-queries 부하, 100만 회원 시뮬 | 성능 도구 | 모니터링팀 이정민 협업 |
| 이현정 (성능 분석) | APM 분석, raw query 병목 식별 | `members/genealogy-raw-queries.ts` | 코드 레벨 분석 |
| 박준서 (확장성) | 100만/1000만 회원 확장 시나리오 | 부하 도구 | 1:3 팀라인 확장성 |
| 최민규 (보안 리드) | JWT, **RBAC Task #44.5**, OWASP Top 10 | `auth/`, `members/controller.ts` | RBAC 미완 추적 |
| 강수민 (보안 코드 리뷰) | 보안 코드 리뷰 (JWT, bcrypt, sanitize-html) | `common/utils/sanitize-html.util.ts` | OWASP 기준 |
| 윤성재 (자동화 리드) | CI 자동 테스트, GitHub Actions | `.github/workflows/` | 개발3팀 이정우 협업 |
| 임채영 (자동화 스크립트) | Playwright 스크립트 (E2E) | `e2e/` | 자동화 케이스 |
| 송지현 (테스트 환경) | docker-compose 테스트 환경, 격리 DB | `docker-compose.yml` | 테스트 데이터 시드 |

### 4.9 모니터링팀 (5명) — `personas/monitoring.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 장현우 (모니터링 리드) | 전체 모니터링 전략, 크론 작업 모니터링 | `tasks/*.task.ts` | 박준혁(품질PM) 보고 |
| 김수현 (시스템) | docker 6컨테이너 상태, 리소스 사용량 | `docker-compose.yml` | kaion_db 헬스체크 |
| 이정민 (APM) | members API 응답 시간, 수당 정산 트랜잭션 추적 | `members/*`, `bonuses/*`, `settlements/*` | genealogy raw query 시간 |
| 박도영 (로그 분석) | 수당 정산 로그, NestJS 에러 패턴, integrity-check 로그 | NestJS 로거 | 자동정산 실패 패턴 |
| 최윤서 (대시보드) | admin/statistics 알림, 정산 알림 | `app/admin/statistics/page.tsx` | Slack/Email 알림 |

### 4.10 시뮬레이션팀 (5명) — `personas/시뮬레이션.md`

| 페르소나 | 전문 영역 | 담당 파일/지식 | 주의사항 |
|---------|----------|--------------|---------|
| 한승민 (시뮬 리드) | 비즈니스 시뮬 총괄, 6종 보너스 시나리오 | `commission-prd.md` | 박준혁 보고 |
| 정유라 (비즈니스 시나리오) | 회원 가입→승급→판매→보너스→정산 시뮬 | `members/`, `settlements/` | 5단계 등급 전이 시나리오 |
| 김태호 (기술 시뮬) | 100만/1000만 회원 부하, raw query 한계 | `genealogy-raw-queries.ts` | 시스템 한계 측정 |
| 박선영 (데이터 시뮬) | 데이터 정합성, 마이그레이션 검증, integrity-check | `prisma/migrations/`, `members/integrity-check.service.ts` | 순환 참조/고아 노드 |
| 이준서 (자동화 시뮬) | CI/CD 회귀 시뮬 자동화 | GitHub Actions | 정기 실행 |

## 5. `.claude/CLAUDE.md` 변경 명세

기존 660줄을 보존하되, 파일 **최상단**(1번 줄, "프로젝트 개발 페르소나 시스템" 헤더 위)에 다음 섹션을 신규 삽입:

```markdown
# Kaion 도메인 컨텍스트 (모든 페르소나 공통 지식)

> **이 섹션은 모든 페르소나가 호출 시 자동으로 알고 있어야 하는 기본 사실입니다.**
> 페르소나별 세부 책임은 `.claude/personas/*.md`를 참조하세요.

## 회사/제품
- (주)케이아이온 MLM 통합관리시스템
- 브랜드 컬러: **#7CB342** (연두색)

## 회원 등급 5단계 (+ ADMIN)
MEMBER → AGENT(누적 100만 PV) → MANAGER(3팀+15에이전트)
→ BRANCH_CHIEF(3팀+4매니저) → DIVISION_CHIEF(3팀+5지부장) → ADMIN

## 이중 계보
- recommenderId: 추천계보 (1:N, 보너스 지급)
- sponsorId: 후원계보 (트리, 승급 조건)
- teamLine 1~3 (DB CHECK 제약, Kaion 고유)

## 6종 보너스
판매 50만 / 판매관리 15만 / 판권(매니저10/지부장18/본부장24만)
/ 판권관리 3~5만 / 공유 2만 / 지점운영 5만

## 수당 정산 체인
sales → recognized-sales → commission-rates → compensation-plan
→ bonuses → settlements → tasks/settlement-scheduler.task.ts (cron)

## 기술 스택
- Mono: pnpm + Turbo
- BE: NestJS + Prisma + @nestjs/event-emitter (→ BullMQ 전환 예정)
- FE: Next.js 14 App Router + Ant Design + Tailwind + react-d3-tree
- Infra: Docker 6컨테이너, Nginx 5667, PostgreSQL 5668, Redis 5669, Adminer 5670

## 핫스팟 (절대 주의)
- `apps/backend/src/members/genealogy-raw-queries.ts`: 성능 raw SQL — 리팩터 금지
- `.bak` 파일 4개: 강민호 결정 없이 복원 금지
- Task #44.5 RBAC TODO: members 컨트롤러에 미적용

## 핵심 문서 위치
- PRD: `.taskmaster/docs/prd.md`
- 수당 PRD: `.taskmaster/docs/commission-prd.md` (662줄)
- members README: `apps/backend/src/members/README.md`

---

(이하 기존 660줄 내용 보존)
```

## 6. 잘못된 예시 치환 명세

### 6.1 검색 대상

이미 수행한 broad 검색 결과로 4개 파일에 잘못된 예시가 분포함을 확인:
```bash
# 광역 검색 (이미 실행, 4개 파일 매치)
grep -rln "주문\|결제\|쇼핑몰\|마이그레이션" .claude/personas/
# → pm팀.md, 개발1팀.md, 개발2팀.md, 시뮬레이션.md
```

이 중 **잘못된 예시 phrase**만 정확히 식별하여 치환:
```bash
# 정밀 검색 (치환 대상)
grep -rn "주문 API\|결제 시스템\|쇼핑몰 PRD\|레거시 마이그레이션\|회원가입 폼\|로그인 API\|주문/결제/배송" .claude/personas/
```
대상 파일 4개: `pm팀.md`, `개발1팀.md`, `개발2팀.md`, `시뮬레이션.md`

### 6.2 치환 매핑

| 구버전 (삭제) | Kaion 버전 (대체) |
|--------------|-----------------|
| `feat: 회원가입 폼 구현 (#15)` | `feat: 회원 가입 폼 + 1:3 팀라인 자동 배정 (#15)` |
| `feat: 로그인 API 구현 (#12)` | `feat: members PromotionService AGENT 승급 조건 검증 (#12)` |
| `refactor: 주문 API 레거시 마이그레이션 (#20)` | `feat: bonuses 모듈 판권 보너스 계산 로직 (#20)` |
| `feat: 결제 시스템 v2 전환 (#21)` | `feat: settlements 자동정산 체인 연동 (#21)` |
| `쇼핑몰 PRD` | `케이아이온 통합관리시스템 PRD` |
| `상품 검색부터 결제까지 전체 구매 흐름` | `회원 가입 → PV 누적 → 자동 승급 → 판매 → 6종 보너스 → 정산 흐름` |
| `회원 가입/탈퇴 프로세스` | `회원 가입(temp_join) → 정식 회원(member) → AGENT 승급 → MANAGER+ 승급 프로세스` |
| `주문/결제/배송 플로우` | `판매 → 인정매출 → 수당률 적용 → 보상플랜 → 보너스 산정 → 정산 플로우` |
| `정산 로직 검증` | `6종 보너스 정산 로직 검증 (commission-prd §3 기준)` |
| `엣지케이스 시나리오` | `엣지케이스: 동시 PV 누적, 등급 경계, 1:3 팀라인 균형, 순환 참조` |

### 6.3 검증
치환 후 다음 grep이 0건이어야 함:
```bash
grep -rn "주문 API\|결제 시스템\|쇼핑몰\|레거시 마이그레이션\|회원가입 폼\|로그인 API" .claude/personas/
```
> 주의: `주문`(orders 모듈)이나 `마이그레이션`(Prisma migrations)은 Kaion에서 정당하게 사용될 수 있으므로 단어 단독 검색은 부적절. 위 phrase 단위로만 검색.

## 7. 실행 계획 (병렬)

### 7.1 단계 구조

```
단계 1 (순차, ~30분)
  └─ 1.1 본 spec 문서 작성 + git commit
  └─ 1.2 .claude/CLAUDE.md 상단 Kaion 도메인 개요 섹션 추가 + commit

단계 2 (병렬, ~30~60분 wall time)
  └─ 10개 subagent 동시 dispatch:
       agent-pm       → personas/pm팀.md (13명)
       agent-research → personas/리서치팀.md (4명)
       agent-plan     → personas/기획설계팀.md (5명)
       agent-design   → personas/디자인팀.md (3명)
       agent-dev1     → personas/개발1팀.md (10명)
       agent-dev2     → personas/개발2팀.md (12명, 정체성 재정의)
       agent-dev3     → personas/개발3팀.md (6명)
       agent-qa       → personas/qa.md (15명)
       agent-mon      → personas/monitoring.md (5명)
       agent-sim      → personas/시뮬레이션.md (5명)

단계 3 (순차, ~30분)
  └─ 3.1 협업 매트릭스 검증 (각 페르소나 매트릭스가 실제 파일 경로 가리키는지)
  └─ 3.2 grep 검증 (잘못된 예시 0건, Kaion 키워드 78개 페르소나 파일 모두 1건+)
  └─ 3.3 메모리 갱신 (project_persona_conflict.md → 해결됨)
  └─ 3.4 최종 git commit
```

### 7.2 각 subagent에게 전달할 컨텍스트 (공통)

각 subagent는 다음을 받음:
1. 본 spec 문서 경로 (참조)
2. **§3 Kaion 도메인 사실 전체** (Ground Truth)
3. **§2 4섹션+1예시 템플릿** (적용 형식)
4. **§4.x 해당 팀 매핑 테이블** (전문 영역/파일/주의사항)
5. **§6 치환 매핑** (해당 팀이 잘못된 예시를 가진 경우만)
6. 출력 요구: 수정된 페르소나 파일 (Edit/Write 도구 사용)
7. 인수 기준: §8

### 7.3 subagent 작업 격리

- 각 agent는 정확히 하나의 페르소나 파일만 수정
- 다른 파일은 절대 수정 금지
- 충돌 영역 0건 (각자 다른 파일)
- 모든 agent가 §3을 동일하게 참조하므로 도메인 사실은 일관됨

## 8. 인수 기준

### 8.1 정량
- [ ] `.claude/CLAUDE.md` 1번 줄에 "Kaion 도메인 컨텍스트" 헤더 존재
- [ ] 10개 페르소나 파일 모두에 "🎯 Kaion 전문 영역" 섹션 존재
- [ ] **79명** 전원 개별 매핑 (팀 공통이 아닌 개별 책임 명시)
- [ ] PM팀 헤더가 "13명" → "14명"으로 정정됨 (`pm팀.md` 4번 줄, `.claude/CLAUDE.md` PM팀 라인)
- [ ] `grep -rn "주문 API\|결제 시스템\|쇼핑몰 PRD\|레거시 마이그레이션\|회원가입 폼\|로그인 API\|주문/결제/배송" .claude/personas/` → 0건
- [ ] `grep -rn "members\|승급\|보너스\|계보\|PV\|AGENT" .claude/personas/` → 10개 파일 모두 1건 이상
- [ ] `grep -rn "#7CB342\|7CB342" .claude/personas/` → 디자인팀, PM팀(한소라) 최소 2건

### 8.2 정성
- [ ] 각 페르소나의 담당 파일이 실제 존재하는 경로인가 (랜덤 5개 샘플 검증)
- [ ] 주의사항이 단순 반복이 아닌 구체적 함정인가
- [ ] 개발2팀 카드의 정체성 재정의가 자연스러운가

### 8.3 메모리
- [ ] `MEMORY.md`의 페르소나 충돌 항목이 "해결됨" 상태로 변경됨
- [ ] `project_persona_conflict.md` 본문이 갱신되어 "2026-04-15 깊은 주입 완료" 명시

## 9. 위험과 완화

| 위험 | 완화 |
|------|------|
| 79명 매핑 시간 폭주 | 단계 2 병렬 실행 (10 agents 동시), wall time ≈ 60분 |
| subagent가 잘못된 도메인 사실 사용 | 본 spec §3을 모든 agent에 강제 컨텍스트로 주입 |
| 페르소나 카드와 새 섹션 모순 (개발2팀) | §1.3 결정에 따라 카드 일부 수정 명시 (정체성 재정의 박스 추가) |
| 머지 충돌 (단계 2 병렬) | 각 agent가 다른 파일 작업, 충돌 영역 0 |
| 거짓 정보 (미존재 파일 경로) | 본 spec §3.7~§3.9는 실제 glob/find으로 검증 완료 |
| `.bak` 파일 부주의 언급 | 모든 페르소나 주의사항에 "강민호 결정 없이 복원 금지" 명시 |
| 기존 v2 검증 게이트 내용 손상 | subagent에게 "★ v2 추가" 마커 절대 삭제 금지 명시 |

## 10. 변경 제외 항목 (out of scope)

- 78명을 16명으로 축소
- 페르소나 이름 변경
- v2 검증 게이트 운영 규칙 변경
- 마케팅 7명 도입 (PRD에는 있지만 본 작업 미포함)
- 실제 코드(`apps/`) 수정
- `.taskmaster/` 내 PRD 수정
- 작업 트리에 있는 미커밋 변경 포함

## 11. 다음 단계

1. 본 spec 문서 git commit (단계 1.1)
2. 사용자 spec 리뷰 게이트
3. 승인 시 `superpowers:writing-plans` 스킬 호출하여 본 spec을 토대로 실행 계획(plan) 작성
4. 실행 계획에 따라 `superpowers:executing-plans` 또는 `superpowers:subagent-driven-development` 스킬로 단계 2 병렬 실행
