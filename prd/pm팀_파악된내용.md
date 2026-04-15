# PM팀 파악된 내용

> 작성: 2026-04-15 / Stage 1 / 본 plan: `/home/successbank/.claude/plans/quirky-watching-thacker.md`
> 담당 페르소나: PM팀 14명 (소통관 3 + 총괄 PM 4 + 일관성 PM 5 + Git/이슈 PM 2)
> 관점: high-level 전체 진도 / 일관성 / 이슈 — 모듈별 깊은 탐색은 개발1팀/개발2팀/QA팀 등 분석 문서에 위임

---

## 1. 담당 영역 인벤토리

### 1.1 PM팀 high-level 책임 영역

#### 백엔드 모듈 (NestJS) — `apps/backend/src/`
| 모듈 | 주요 파일 | 라인수 (서비스 기준) | PM 관심 |
|------|---------|------|------|
| `sales/` | `sales.controller.ts`, `sales.service.ts` | 717 (service) | sales 체인 1단 |
| `recognized-sales/` | `recognized-sales.{controller,service}.ts` + `.bak` 2개 | 460 | 인정매출 |
| `commission-rates/` | `commission-rates.{controller,service}.ts` | 403 | 수당률 엔진 |
| `compensation-plan/` | `services/bonus-calculator.service.ts` (407), `services/bonus-simulator.service.ts` (343), `controllers/compensation-plan.controller.ts` | 750 | ★ 매트릭스 검증 핵심 |
| `bonuses/` | `bonuses.{controller,service}.ts` + `.bak` 1개 | 137+82 | 보너스 지급 |
| `settlements/` | `settlements.service.ts` (516), `settlement-schedule.service.ts` (346), `settlements.controller.ts` | 862+ | 자동 정산 |
| `tasks/` | `settlement-scheduler.task.ts` (107), `integrity-scheduler.service.ts`, `backup.task.ts` | — | 크론 배치 |
| `members/` | `members.service.ts` (2493), `members.controller.ts` (1050), `promotion.service.ts` (298), `genealogy.service.ts`, `genealogy-raw-queries.ts`, `integrity-check.service.ts` | 3841+ | ★ 가장 큰 모듈 |
| `temp-members/` | 가입 전 임시 회원 | — | 개발1팀 |
| `auth/` | JWT 가드 스캐폴드 | — | ★ Task #56 미완 (TODO) |
| `products/` | `product-commission-rates.{controller,service}.ts` + products | — | 매트릭스 API 위치 |
| `system-config/` | 런타임 설정 (한시적 승급 조건 등) | — | DB config |
| 기타 | `activity-logs`, `backup`, `notifications`, `orders`, `upload`, `users`, `common`, `health`, `prisma` | — | — |

#### 프론트엔드 페이지 (Next.js 14 App Router) — `apps/frontend/src/app/`
| 카테고리 | 페이지 수 | 주요 경로 |
|---------|---------|---------|
| **admin 페이지** | 18개 디렉토리 | `admin/{dashboard, users, bonuses, sales, settlements, commission-rates, compensation-plan, bonus-simulator, organization, products, centers, statistics, settings, integrity-check, onoff, login, member-view/[id], users/rollback-history}` |
| 사용자 페이지 | 15개 | `login, register, dashboard, mypage, mypage/password, bonuses, commissions, organization, my-organization, my-performance, products, sales, temp_join, temp_join_list, page.tsx` |
| WIP 컴포넌트 | 1개 | `components/BulkPasswordResetModal/` (Untracked) |
| WIP 페이지 | 1개 | `app/admin/member-view/[id]/` (Untracked, layout.tsx + page.tsx) |

**admin 페이지 대형 파일 (>500줄)**:
- `admin/organization/page.tsx` 1530줄
- `admin/commission-rates/page.tsx` 1023줄
- `admin/users/page.tsx` 942줄 (★ WIP)
- `admin/compensation-plan/page.tsx` 695줄
- `admin/bonuses/page.tsx` 502줄

#### PRD/문서
- `.taskmaster/docs/prd.md` (333줄, v1.0 Draft) — ★ 구 5단계 등급 잔재
- `.taskmaster/docs/commission-prd.md` (662줄) — ★ 구 6종 보너스 체계
- `.taskmaster/tasks/tasks.json` — Task Master DB (★ Task #44 도 구 체계 잔재)
- `apps/backend/src/members/README.md` (220줄) — ★ 구 MEMBER/AGENT 등급 잔재
- `CLAUDE.md` (★ WIP — 수정됨, 미커밋)
- `.claude/CLAUDE.md` Kaion 도메인 섹션 (★ 부분 stale: PV 기반 승급은 거짓)
- `.claude/personas/*.md` 10개

#### `.bak` 파일 4개 (★ 강민호 결정 영역)
| 파일 | 라인수 | 추정 |
|------|-------|------|
| `apps/backend/src/bonuses/bonus-calculator.service.ts.bak` | 345 | 구 6종 보너스 계산 로직 |
| `apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak` | 598 | 구 RecognitionType 분리 테스트 |
| `apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak` | 153 | 구 controller 통합 |
| `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak` | 373 | 구 SHARING/LICENSE + 인정매출 통합 |
| **합계** | **1469줄** | |

#### 미커밋 작업 트리 (★ 본 작업과 무관 — 그대로 두기 권장)
- M `CLAUDE.md` (164줄 감소 — v3 페르소나 주입 이후 축소)
- M `apps/backend/src/members/members.controller.ts` (+58)
- M `apps/backend/src/members/members.service.ts` (+119)
- M `apps/frontend/src/app/admin/users/page.tsx` (+25)
- M `apps/frontend/src/services/members.service.ts` (+40)
- ?? `apps/backend/src/members/dto/bulk-password-reset.dto.ts` (신규)
- ?? `apps/frontend/src/app/admin/member-view/[id]/` (신규 layout+page)
- ?? `apps/frontend/src/components/BulkPasswordResetModal/` (신규 컴포넌트)
- ?? `.claude/페르소나_보강_프롬프트_가이드.md` (사용자 작성)
- ?? `006 (2).png` (첨부 이미지)
- D `.persona_team/` 8개 (구 페르소나 폴더 — v3로 대체되어 삭제 대기)

### 1.2 현재 Git 상태
- 브랜치: `main`
- origin/main 대비 **2 commits ahead** (로컬 미푸시: `c491d94 페르소나 깊은 주입 설계서 작성`, `5d32510 페르소나 시스템 Kaion 도메인 깊은 주입 (v3)`)
- 최근 커밋 (최신순):
  1. `5d32510 페르소나 시스템 Kaion 도메인 깊은 주입 (v3)`
  2. `c491d94 페르소나 깊은 주입 설계서 작성`
  3. `b6ca264 자동정산기능` (2026-01-20)
  4. `420e7a4 수당륲수정` (2026-01-20)
  5. `ad5ec5d 메뉴정리중1`
  6. `b74048d 추천제거`
  7. `f6c610f 디자인 수정.`
  8. `5b5b2bb Initial commit: Kaion MLM 통합관리시스템` (2025-12-24)

---

## 2. 기능별 정상 작동 여부

| 기능 | 상태 | 근거 |
|------|------|------|
| **백엔드 부트스트랩** | 미확인 | 본 Stage는 정적 코드 분석 only. Docker 기동/로그는 모니터링팀 담당 |
| **schema.prisma (신 2종 + 4등급)** | 정상 | schema.prisma L363-384 직접 확인 — `enum MemberGrade { SALESPERSON, TEAM_LEADER, BRANCH_MANAGER, CENTER, ADMIN }`, `enum BonusType { SALES_COMMISSION, EDUCATION_MANAGEMENT }` 존재 |
| **마이그레이션 `20260120_grade_restructure`** | 정상 | 310줄 SQL 확인: enum 변환 CASE 매핑, ProductCommissionRate 테이블 생성, 5개 제품 + 20 rows 수당율 삽입 완료 |
| **제품별 수당 매트릭스 (DB)** | 정상 (broadly) | migration.sql L276-309 — 이미지의 5×4 매트릭스 행과 20개 row 모두 수치 일치 (지점120만/소계5만 nuance 제외) |
| **BonusCalculatorService (현재)** | 정상 | L9-407 확인 — `SALESPERSON/TEAM_LEADER → SALES_COMMISSION`, `BRANCH_MANAGER/CENTER → EDUCATION_MANAGEMENT` 분기 로직 구현 |
| **BonusSimulatorService** | 정상 (존재) | L60 `simulateSale(dto)` + L87 `simulateSellerBonus` + L93 `simulateUplineBonuses` 구현 — Stage 2.1 매트릭스 검증 도구로 활용 예정 |
| **PromotionService (신 4등급)** | 정상 | L9-140 확인 — `SALESPERSON → TEAM_LEADER → BRANCH_MANAGER → CENTER` 승급 로직. system_configs의 `SALESPERSON_TO_TEAM_LEADER_COUNT` 기반 한시적 3명/정상 10명 동적 조회 |
| **자동 정산 (settlement-scheduler.task.ts)** | 정상 (존재) | 107줄, cron 기반. 상세 검증은 개발2팀 담당 |
| **sales 모듈** | 정상 (존재) | controller 253줄 + service 717줄. RBAC TODO 5건 포함 (L50, L59, L153, L161, L171, L217, L233, L249) |
| **settlements 모듈** | 정상 (존재) | service 516 + schedule 346 + controller. RBAC TODO 1건 (L142 `TODO: JWT 토큰에서 userId 추출`) |
| **members 모듈 (WIP 제외)** | 정상 | 2493+1050+298줄. 대규모 모듈. 개발1팀 자세한 분석 영역 |
| `members.controller.ts` RBAC | **이상** | ★ Task #44.5 RBAC TODO 미완 — `@Roles/@UseGuards/JwtAuthGuard/RolesGuard` grep 결과 **0건**. controller에 권한 가드 완전 미적용 |
| `genealogy-raw-queries.ts` | 정상 (보호대상) | 파일 존재, raw SQL로 재귀 계보 — **리팩터 금지 대상** |
| **.bak 파일 4개** | 이상 (폐기 대기) | 모두 구 6종 + 5등급 체계 잔재. 강민호 결정 대기 |
| **commission-prd.md (662줄)** | **이상** | ★ grep 결과: 구 용어 (MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF/SALES/LICENSE/SHARING) 13건. 신 2종 체계(SALES_COMMISSION/EDUCATION_MANAGEMENT) 0건 — **완전 구버전** |
| **prd.md (333줄)** | **이상** | L26, L128 "5단계 계층 구조" 직접 언급 — 구버전 |
| **members/README.md** | **이상** | L33 "MEMBER → AGENT: 누적 PV >= 1,000,000", L198 `grade MemberGrade @default(MEMBER)`, L207-208 `enum MemberGrade { MEMBER`… 구 체계 잔재 |
| **`.taskmaster/tasks/tasks.json` Task #44** | **이상** | L3389 "등급 enum: MEMBER, AGENT, MANAGER, BRANCH_CHIEF, DIVISION_CHIEF, ADMIN" + L3437 "BullMQ 기반 이벤트 버스" — 구 체계 + BullMQ 미구현. 그런데 상태는 `done` |
| **`prisma/seed-commission-rates.ts`** | **이상 (stale seed)** | 280줄 전체가 구 6종 (SALES/SALES_MANAGEMENT/LICENSE/LICENSE_MANAGEMENT/SHARING/BRANCH_OPERATION) + 구 5등급. 실행하면 에러 발생 예상 |
| **.claude/CLAUDE.md Kaion 컨텍스트** | **이상 (부분 stale)** | "회원 등급 5단계" + "6종 보너스" 테이블이 PRD와 동일한 구 체계 — v3 깊은 주입 작업에서 스키마와 어긋남. PromotionService 로직과 대조: PV 기반 승급 ❌ / 직속 카운트 기반 승급 ✅ |
| **@nestjs/event-emitter vs BullMQ** | 사용 중 | `apps/backend/package.json` L29: `"@nestjs/event-emitter": "^3.0.1"`. BullMQ 미설치. Task #44 서브태스크 4는 BullMQ로 잘못 기술됨 |
| **활성 `.spec.ts`** | **이상 (거의 0건)** | Glob `apps/backend/src/**/*.spec.ts` → 0개. .bak 4개가 유일한 테스트 유산 |
| **프론트엔드 admin 18개 페이지** | 미확인 | 정적 파일 존재 확인만. 기능 검증은 개발2팀 담당 |

---

## 3. 발견된 이슈

### Critical (P0)

- **[P0-1] `commission-prd.md` 662줄 전체가 구 6종 보너스 체계 (PRD ↔ 코드 시대 차이)**
  - 영향: 신 2종 체계(SALES_COMMISSION/EDUCATION_MANAGEMENT)는 코드/마이그레이션/bonus-calculator.service.ts에서 작동 중이지만, 문서는 완전히 구버전. 개발자가 문서를 믿고 개발하면 즉시 충돌.
  - 위치: `.taskmaster/docs/commission-prd.md` (662줄 전체)
  - Stage 2.3 의 핵심 재작성 작업으로 등록됨.
  - 담당: 최윤아 (커뮤니케이션 PM)

- **[P0-2] `prd.md` 5단계 등급 잔재 (PRD ↔ 코드 시대 차이)**
  - 영향: §1(개요) L26 "5단계 계층구조" + §5(L128) "5단계 계층 구조" 2건 — 신 4등급 체계(SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER)와 불일치
  - 위치: `.taskmaster/docs/prd.md` L26, L128, 해당 섹션 전후
  - Stage 2.4 메인 세션 inline 정정 (작은 편집)
  - 담당: 최윤아 + 강민호

- **[P0-3] `.claude/CLAUDE.md` Kaion 도메인 컨텍스트 부분 stale**
  - 영향: "회원 등급 5단계" 테이블 + "AGENT: 누적 PV ≥ 1,000,000" 조건이 구 체계. 현재 PromotionService는 직속 후원 카운트(10명 / 한시적 3명) 기반. "6종 보너스" 테이블도 구체계. 모든 페르소나가 호출 시 stale 컨텍스트를 자동 로드 → 신뢰 붕괴.
  - 위치: `.claude/CLAUDE.md` L12-47 (도메인 컨텍스트 섹션)
  - Stage 2.5의 핵심 작업 — 페르소나 시스템 갱신의 일부
  - 담당: 최윤아 + 강민호 (v3 주입 작업의 후속 정정)

- **[P0-4] `members/README.md` 구 등급 체계 잔재**
  - 영향: 220줄 README가 members 모듈 개발자의 1차 참고 문서인데 L33/L198/L207-208 등에서 구 MEMBER/AGENT 체계 언급. 개발1팀이 이 문서를 기준으로 새 코드를 짜면 잘못된 방향 진행.
  - 위치: `apps/backend/src/members/README.md`
  - Stage 2.5 작업에 포함 필요
  - 담당: 최윤아 + 개발1팀

### High (P1)

- **[P1-1] `seed-commission-rates.ts` 280줄 stale — 실행 시 에러 예상**
  - 영향: `import { ..., BonusType, MemberGrade, QualificationType } from '@prisma/client'` 에서 구 enum 값(SALES, SALES_MANAGEMENT, LICENSE, SHARING, BRANCH_OPERATION, MEMBER, AGENT, MANAGER, BRANCH_CHIEF, DIVISION_CHIEF) 참조. 현재 Prisma Client는 신 enum만 export → 컴파일 에러 / 런타임 에러. 실행 경로 확인 필요.
  - 위치: `apps/backend/prisma/seed-commission-rates.ts` (280줄 전체)
  - 결정 필요: 폐기 vs 재작성. ProductCommissionRate 데이터는 이미 마이그레이션 SQL로 삽입되므로 이 seed는 불필요할 가능성이 높음.
  - 담당: 이수진 + 윤성호 + 강민호 (Stage 2.6 .bak 결정과 함께 검토 권장)

- **[P1-2] `.taskmaster/tasks/tasks.json` Task #44 stale — "done" 상태지만 구 체계 기술**
  - 영향: Task #44 "멤버 도메인 및 등급 로직" 서브태스크 5개 모두 `done` 상태. 그런데 description/details에 `MEMBER, AGENT, MANAGER, BRANCH_CHIEF, DIVISION_CHIEF` 열거 + `BullMQ 기반 이벤트 버스` 기술. 코드와 어긋나고, 향후 Task Master로 재분석 시 혼동.
  - 위치: `.taskmaster/tasks/tasks.json` L3386-3454
  - 결정 필요: tasks.json 업데이트 (Task Master CLI 또는 MCP로 update-task)
  - 담당: 오민정 (이슈 PM) — "★ `tasks.json`은 수동 편집 금지" 원칙 준수

- **[P1-3] Task #44.5 RBAC TODO — members.controller.ts에 가드 0건 적용**
  - 영향: `members.controller.ts`에 `@Roles|@UseGuards|JwtAuthGuard|RolesGuard` grep 결과 **0건**. ADMIN 전용 등급 변경 API도 권한 검증 실질적 미적용. `common/guards/jwt-auth.guard.ts` L11 "TODO: Task #56에서 구현", `common/guards/roles.guard.ts` L23 동일. Task #44.5가 "done"으로 기록됐지만 Task #56 auth 시스템이 미구현이므로 실질적 보안 구멍.
  - 위치: `apps/backend/src/members/members.controller.ts` 전체, `apps/backend/src/common/guards/{jwt-auth,roles}.guard.ts`
  - 박준혁(품질 PM)의 상수 추적 대상
  - 담당: 오지훈 (개발1팀 보안) — 박준혁 게이트 차단 중

- **[P1-4] sales.controller.ts RBAC TODO 다수 (8건)**
  - 영향: sellerId/adminId/userId를 쿼리 파라미터로 받고 있음 — `// TODO: @CurrentUser()로 대체`. 외부에서 임의의 userId로 호출 가능. 실질적 IDOR 취약점.
  - 위치: `apps/backend/src/sales/sales.controller.ts` L50, L59, L153, L161, L171, L217, L233, L249 + L161 "Task #48 실제 보너스 계산 로직 구현" TODO
  - 담당: 개발2팀 (sales 모듈 책임)

- **[P1-5] products/categories/orders controller `@ApiBearerAuth() // TODO: Guard 추가`**
  - 영향: Swagger에 JWT 필요 표시는 있으나 실제 guard 미적용. 동일 RBAC 패턴 누락.
  - 위치: `apps/backend/src/products/products.controller.ts` L32, `apps/backend/src/products/categories.controller.ts` L29, `apps/backend/src/sales/sales.controller.ts` L44
  - 담당: 박준혁(품질 PM) + Task #56 완료 후 일괄 처리

- **[P1-6] 활성 `.spec.ts` 0건 — 테스트 커버리지 거의 전무**
  - 영향: Stage 4 "엄격 3-증거 합격 기준"에서 `자동 테스트 통과` 증거를 만들어낼 수 있는 기반이 없음. .bak 4개를 복원해야 할지, 신규 작성해야 할지 결정 필요.
  - 위치: `apps/backend/src/**` 전체
  - 담당: QA팀 (김정훈) — 개발3팀 Skill 연계 검토

### Medium (P2)

- **[P2-1] `.bak` 파일 4개 보존/폐기 최종 결정 미루어짐**
  - 내용: 1469줄 합계. 모두 구 6종 + 구 5등급 기반. 신 체계와 호환 불가.
  - 위치: `apps/backend/src/bonuses/bonus-calculator.service.ts.bak`, `apps/backend/src/recognized-sales/recognized-sales.{service,controller}.spec.ts.bak`, `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak`
  - 권장: 폐기 (rename → `.legacy-old-bonus-system` 또는 별도 아카이브 폴더)
  - 결정권자: **강민호 (PM 리더)** — 본 plan Stage 2.6
  - 근거: 마이그레이션 주석 "보너스 데이터 삭제" L14 + "DROP TYPE BonusType" 으로 구 enum 값 자체가 DB에서 사라진 상태. 복원 시 schema 롤백 필요.

- **[P2-2] 미커밋 작업 트리 — 본 작업과 무관하지만 관리 필요**
  - 내용: members.controller/service, admin/users/page.tsx, BulkPasswordResetModal, member-view/[id], CLAUDE.md 등 다수 WIP
  - 권장: 본 Stage 1-4 작업 시작 전에 stash 또는 별도 commit으로 분리 — 병합 충돌 위험 최소화
  - 결정권자: 김현태 (Git PM) + 사용자
  - 현재 상태: 그대로 두기 권장 (본 Stage는 prd/prd2 신규 파일 생성 + `.taskmaster/docs/` 업데이트 중심, 코드 수정 거의 없음)

- **[P2-3] nuance 3건 (이미지 vs 코드)**
  - **A) 온체 팀장 "100만 / 지점 120만"**: DB에는 `TEAM_LEADER: 1,000,000` 단일. 지점 차등 (+20만) 필드 부재.
    - 결정 필요: `ProductCommissionRate`에 `branchBonusAmount` 추가 vs 무시 vs 별도 BranchBonusRate 테이블
  - **B) 온체 지사장 "20만 (소계 5만)"**: DB에는 `BRANCH_MANAGER: 200,000`. "소계 5만"의 의미 모호.
    - 추정: 센터 5만 포함 합산? 또는 5만을 지사장 20만에서 분리 지급?
  - **C) 통증패치/전용젤 판매원 column 빈칸**: DB에는 `SALESPERSON: 0` row로 삽입됨 (L299, L306). 빈칸=0 의도라면 매치.
    - 결정 필요: 0 row 존재 유지 vs 아예 row 미삽입
  - Stage 2.2 에서 사용자(강민호 경유) 최종 확인 필요

- **[P2-4] `CLAUDE.md` 작업 트리 수정 (164줄 축소)**
  - 내용: `git diff --stat` 기준 `CLAUDE.md | 164 +------------------------` — 대폭 축소. 사용자가 직접 정리했을 가능성.
  - 권장: 내용 확인 후 페르소나 시스템 v3와 일관성 확인
  - 담당: 최윤아 (문서화 표준)

- **[P2-5] Task #45 (계보 관리) 의 "BullMQ 소비자" 기술 stale**
  - 내용: Task #45 descriptions에 BullMQ 언급 가능성. 실제로는 @nestjs/event-emitter 사용 중.
  - 담당: 오민정

### Low (P3)

- **[P3-1] `006 (2).png` 루트 첨부 이미지 untracked**
  - 내용: 프로젝트 루트에 보상플랜 이미지 untracked. 본 Stage 1-2의 참조 자료.
  - 권장: 본 작업 종료 후 `docs/images/` 또는 `prd/images/` 로 이동 후 commit

- **[P3-2] `.persona_team/` 8개 deleted 상태 미정리**
  - 내용: 구 페르소나 폴더 (v3로 대체됨). Git staged delete 상태.
  - 권장: 본 작업 중 별도 cleanup commit으로 삭제 확정

- **[P3-3] TODO 주석 30+ 건 총집합**
  - 분포: Task #56 (JWT/Roles/CurrentUser) 관련 8건, BullMQ 관련 5건, 알림 관련 6건, AuditLog 관련 2건, Slack/Email 관련 1건 등
  - 위치: `apps/backend/src/common/guards/`, `apps/backend/src/common/decorators/`, `apps/backend/src/members/listeners/member-grade.listener.ts`, `apps/backend/src/sales/sales.controller.ts`, `apps/backend/src/products/*.controller.ts`, `apps/backend/src/common/interceptors/logging.interceptor.ts`, `apps/backend/src/common/filters/all-exceptions.filter.ts`, `apps/backend/src/settlements/settlements.controller.ts`
  - 권장: Task Master 단위로 묶어 backlog 생성 (오민정)

- **[P3-4] `orders/` 모듈 존재 — PRD 범위 외?**
  - 내용: `apps/backend/src/orders/orders.service.ts` 존재 (`주문 코드 생성 ORD-YYYYMMDD-XXXX`). 현재 MLM 수당 체인은 `sales/` 기반. orders는 관련성 미확인.
  - 권장: 리서치팀 또는 개발2팀 확인 — 사용 중인지, 데드 코드인지

---

## 4. 보상플랜 관련 내용

### 4.1 이미지 매트릭스 (참조용)

| 제품 | 판매원 | 팀장 | 지사장 | 센터 | 판매가 |
|------|--------|------|--------|------|--------|
| 고주파(온체) | 50만 | 100만 / **지점 120만** | 20만 (**소계 5만**) | 5만 | 330만 |
| 펄스온(저주파) | 40만 | 80만 | 15만 | 5만 | 249만 |
| 제트5(초음파) | 25만 | 50만 | 5만 | 5만 | 150만 |
| 통증 패치 | **(빈칸)** | 2만 | 4,800 | 2,400 | 4만8천 |
| 전용젤 | **(빈칸)** | 1만5천 | 3,000 | 1,500 | 3만 |

### 4.2 DB (migration.sql L276-309) 현재 데이터

| 제품 (code, 판매가) | SALESPERSON | TEAM_LEADER | BRANCH_MANAGER | CENTER |
|---------|-----|-----|-----|-----|
| MED-001 온체 (2,860,000) ★ | 500,000 | 1,000,000 | 200,000 | 50,000 |
| MED-002 펄스온 (2,490,000) | 400,000 | 800,000 | 150,000 | 50,000 |
| MED-003 제트5 (1,500,000) | 250,000 | 500,000 | 50,000 | 50,000 |
| MED-ACC-001 통증 패치 (48,000) | 0 | 20,000 | 4,800 | 2,400 |
| MED-ACC-002 전용젤 (30,000) | 0 | 15,000 | 3,000 | 1,500 |

**★ 온체 판매가 불일치**: 이미지 330만원 vs DB 286만원 — **미스매치 발견! Stage 2.2에 추가 필요**.

### 4.3 매치 상태 요약

- ✅ **팀장/지사장/센터 4개 행**: 펄스온/제트5/통증패치/전용젤 4개 제품 × 4개 등급 = **16 cells 모두 수치 일치**
- ✅ **통증패치/전용젤 판매원 0원**: 이미지의 "빈칸"을 "0원"으로 해석한 DB 구현 — 의미 확인 필요 (nuance C)
- ✅ **bonus 분류**: SALESPERSON/TEAM_LEADER → SALES_COMMISSION / BRANCH_MANAGER/CENTER → EDUCATION_MANAGEMENT (이미지 자격 조건 §"수수료 분류"와 완전 일치)
- ⚠️ **온체 판매가 불일치**: 이미지 330만 vs DB 2,860,000 (286만) — **새 발견**
- ⚠️ **온체 팀장 지점 차등 (nuance A)**: DB 1,000,000 단일. 120만 지점 차등 필드 부재
- ⚠️ **온체 지사장 소계 5만 (nuance B)**: DB 200,000 단일. 소계 의미 미반영

### 4.4 PM팀 관점 — PRD ↔ 코드 시대 차이

| | `commission-prd.md` (구 문서) | `schema.prisma` + migration (현재 코드) |
|---|---|---|
| **등급 체계** | 5단계 (MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF) | **4단계** (SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER) |
| **보너스 체계** | 6종 (판매/판매관리/판권/판권관리/공유/지점운영) | **2종** (SALES_COMMISSION + EDUCATION_MANAGEMENT) |
| **수당 계산 모델** | 보너스 타입별 고정 금액 + isGradeTiered + 차액 지급 | **제품별 × 등급별 ProductCommissionRate** 직접 조회 |
| **승급 기준** | "AGENT: PV ≥ 1,000,000" | **직속 후원 카운트** (10명 / 한시적 3명, system_configs 기반) |
| **정산** | 수동 | **자동** (settlement-scheduler.task.ts cron) |
| **문서 잔재 근거** | L26, L128 "5단계", grep 13건 구 용어 | migration L58-192 CASE WHEN 매핑 확인 |

**결론**: 2026-01-20 커밋 `b6ca264 자동정산기능` + `420e7a4 수당률수정` 시점에 구→신 대규모 전환이 발생. 이후 PRD/README/tasks.json/`.claude/CLAUDE.md` 문서 전반이 갱신되지 않음. Stage 2 의 존재 이유.

### 4.5 `.bak` 파일 4개 강민호 결정 영역

- 파일 4개 합계 **1469줄** — 모두 구 6종 + 5등급 기반
- 복원 시 리스크:
  1. DB에 구 enum (SALES/LICENSE/SHARING 등)이 존재하지 않아 TypeScript 컴파일 에러
  2. `MemberGrade.MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF` 참조 — 신 enum에 없음
  3. `isGradeTiered/isDifferential/isSameRankOnly/isFirstGenOnly` 등 commission_rates 테이블의 구 필드를 참조하는 spec → schema와 불일치
- **PM팀 권장 (강민호 결정 대기)**: 폐기 (별도 아카이브 폴더 `.legacy/old-bonus-system-2026-01-20/` 이동 or rename) → tree 오염 방지

### 4.6 매트릭스 검증 도구

- **BonusSimulatorService** (`apps/backend/src/compensation-plan/services/bonus-simulator.service.ts`, 343줄)
- 메서드: `simulateSale(dto)` L60, `simulateSellerBonus(seller, productId)` L126, `simulateUplineBonuses(sellerId, productId)` L168
- Stage 2.1 매트릭스 검증의 핵심 도구. UI는 `admin/bonus-simulator/page.tsx` (276줄) 존재.

---

## 5. 향후 개발 참조 사실

### 5.1 결정권자 / 책임자 매트릭스

| 영역 | 담당 페르소나 | 키 역할 |
|------|-------------|--------|
| `.bak` 파일 4개 복원/폐기 | **강민호** (PM 리더) | 최종 결정권 — 본 plan Stage 2.6 |
| 최종 인수 판정 (Stage 4) | **강민호** | 전체 기능 체크리스트 전수 확인 |
| Task #44.5 RBAC TODO 추적 | **박준혁** (품질 PM) | 완료 시까지 매 스프린트 추적 |
| 검증 게이트 관리 (gate 1-6) | **박준혁** | 증거 없는 완료 보고 차단 |
| Git workflow + 검증 통과 PR만 develop 머지 | **김현태** (Git PM) | PR 검증 결과 섹션 필수, `[검증:통과]` 태그 강제 |
| tasks.json 업데이트 (Task #44 stale 정정 등) | **오민정** (이슈 PM) | `task-master` CLI/MCP only — 수동 편집 금지 |
| NestJS controller/service/dto 패턴 | **정대훈** (코드 일관성) | kebab-case 파일, PascalCase 클래스, Prisma Client 호출 패턴 통일 |
| 브랜드 컬러 `#7CB342` + AntD 토큰 | **한소라** (디자인 시스템) | ConfigProvider `colorPrimary` 오버라이드 |
| react-d3-tree 계보 트리 인터랙션 | **강현우** (UI/UX 일관성) | `app/organization`, `app/admin/organization` |
| `prisma/schema.prisma` Member/MemberGrade/ProductCommissionRate | **윤성호** (DB 스키마) | **teamLine 1~3 CHECK 제약 변경 절대 금지** |
| **`genealogy-raw-queries.ts` raw SQL** | **배지영** (DB 쿼리) | **★ 리팩터 금지 — "Prisma로 바꾸자" PR 무조건 반려** |
| commission-prd.md 일관성 | **최윤아** (커뮤니케이션 PM) | Stage 2.3 재작성 담당 후보 |
| 아키텍처/수당 체인 의존관계 | **이수진** (기술 PM) | `sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements → tasks/*.task.ts` 순서 유지 |

### 5.2 핵심 규칙/패턴/제약

1. **수당 체인 6단계 순서**: `sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements → tasks/settlement-scheduler.task.ts (cron)`. 순서 변경 시 파급 범위 큼.
2. **이중 계보**: `recommenderId` (추천, 보너스 지급 기준) vs `sponsorId` (후원, 승급 조건 기준) — **합치기 금지**.
3. **teamLine CHECK 제약 (1~3)**: Kaion 고유 1:3 팀라인. **DB CHECK 변경 PR 무조건 반려** (윤성호).
4. **`genealogy-raw-queries.ts`**: Prisma로 표현 불가능한 재귀 계보 쿼리. **리팩터 금지** (배지영).
5. **승급 조건 (신 체계)**: SALESPERSON → TEAM_LEADER는 **직속 후원 SALESPERSON+ 카운트 ≥ N** (N은 `system_configs.SALESPERSON_TO_TEAM_LEADER_COUNT` 런타임 조회, 한시적 3 / 정상 10). TEAM_LEADER → BRANCH_MANAGER 동일 패턴. BRANCH_MANAGER → CENTER는 **관리자 수동 지정**.
6. **BonusType 분기**: `SALESPERSON/TEAM_LEADER → SALES_COMMISSION` (판매 수수료), `BRANCH_MANAGER/CENTER → EDUCATION_MANAGEMENT` (교육 관리). 이미지 "수수료 분류"와 일치.
7. **ProductCommissionRate**: 제품별 × 등급별 고정 금액 직접 조회. 조회 로직은 `BonusCalculatorService` 및 `BonusSimulatorService`에 집중.
8. **RBAC 미적용 현실**: `jwt-auth.guard.ts` L11, `roles.guard.ts` L23 모두 Task #56 TODO. 현재 members.controller + sales.controller + products.controller + categories.controller 가드 0건 적용.
9. **Task Master 수동 편집 금지**: `tasks.json` 직접 편집 금지 — `task-master update-task` / `update-subtask` CLI 또는 MCP만 사용.
10. **1기능 1브랜치 1검증사이클**: `feature/{이슈}-{기능명}` → 단위검증(`[검증:통과]`) → 통합검증(`[검증:통합통과]`) → PR → develop 머지.
11. **@nestjs/event-emitter 사용 중**: BullMQ는 PoC 단계. Task #44 서브태스크 4의 "BullMQ 기반 이벤트 버스" 기술은 stale. 전환 결정은 이수진 + 개발1팀 배경민.

### 5.3 함정 (반드시 피할 것)

- **.bak 복원 강민호 승인 없이 금지** — tree에 복원 시 컴파일 에러 + schema 불일치
- **`seed-commission-rates.ts` 실행 금지** — 구 enum 참조로 즉시 에러
- **members/README.md를 신뢰하고 개발 금지** — 구 체계 내용 다수
- **`.taskmaster/docs/commission-prd.md`를 기준 문서로 참조 금지** — Stage 2.3 재작성 완료 시까지
- **tasks.json Task #44 내용 신뢰 금지** — done 상태지만 구 체계 기술 (description/details)
- **`.claude/CLAUDE.md` 도메인 컨텍스트 6종 보너스 표 신뢰 금지** — Stage 2.5 갱신 대상
- **Task #56 (JWT/Roles/CurrentUser) 완료 전까지 새 endpoint에 RBAC 기대 금지** — 박준혁 게이트로 추적
- **`genealogy-raw-queries.ts` 리팩터 PR 제출 금지** — 무조건 반려

### 5.4 Git PM (김현태) 관점

- 현재 브랜치: `main`
- origin/main 대비 2 commits ahead — **push 결정 필요** (사용자 확인 대기)
- 미커밋 작업 트리: 본 Stage 1-4 작업과 무관 → **그대로 두기 권장**. Stage 1은 `prd/` 신규 파일 생성만, Stage 2는 `.taskmaster/docs/` + `.claude/` 갱신, Stage 3/4는 `prd2/` + evidence 생성 중심이므로 WIP과 충돌 없음.
- Stage 2 commit / Stage 4 최종 commit / Stage 4 인수증 commit 3회 예정 (본 plan L540-542)
- 사용자 WIP(BulkPasswordResetModal, member-view, users/page.tsx)은 사용자가 별도 feature 브랜치로 분리하거나 사용자가 완성 후 직접 commit — PM팀 개입 금지

### 5.5 Stage 2 PM팀 작업 역할 분담 (권장)

- **Stage 2.1 매트릭스 검증**: 배지영 (DB 쿼리) + 이수진 (아키텍처) + 한소라 (UI 토큰) — bonus-simulator UI 실행 검증
- **Stage 2.2 nuance 3+1건 해결**: 강민호 (최종 결정) + 최윤아 (용어 일관성) + 사용자 확인 대기
  - 추가: **온체 판매가 330만 vs DB 286만 미스매치 해결** (본 분석에서 신규 발견)
- **Stage 2.3 commission-prd 재작성**: 최윤아 (주도) + 이수진 (기술 검토) — 1 subagent 전담
- **Stage 2.4 prd.md 등급 정정**: 최윤아 inline edit
- **Stage 2.5 페르소나 시스템 갱신**:
  - `.claude/CLAUDE.md` 도메인 컨텍스트 섹션 (최윤아)
  - `.claude/personas/*.md` 10개 grep + 정정 (최윤아)
  - `members/README.md` (최윤아 + 개발1팀)
  - `.taskmaster/tasks/tasks.json` Task #44 update (오민정 — task-master update-task로)
- **Stage 2.6 `.bak` 4개 결정**: 강민호 최종 판정 → 권장: 폐기

---

## 6. 다른 팀과의 의존

PM팀은 **모든** 다른 팀에 대한 coordination 책임. 본 Stage 1 관점에서의 의존 관계:

### 6.1 PM팀이 다른 팀의 산출물에 의존

| 의존 대상 팀 | 기대 산출물 | Stage 1 영향 |
|------------|-----------|------------|
| 리서치팀 | `commission-prd.md` 구체계 분석 + BullMQ 후보 모듈 분석 | Stage 2.3 재작성 근거 자료 |
| 기획설계팀 | `prd.md` / `commission-prd.md` / `members/README.md` stale 매핑 | Stage 2.3/2.4/2.5 작업 지원 |
| 디자인팀 | 브랜드 토큰 + AntD 사용 위치 + `#7CB342` 인벤토리 | Stage 2.5 페르소나 일관성 검증 |
| 개발1팀 | members 모듈 (2493+1050줄) 깊은 분석 + 사용자 페이지 / RBAC 상태 | P1-3/P1-4 이슈 해결 |
| 개발2팀 | **수당 체인 6모듈 + admin 18페이지 + 배치** 깊은 분석 — ★ 가장 큰 부담 | P1-5 처리 + 매트릭스 검증 실행 |
| 개발3팀 | `.claude/skills/` 존재 여부 + 검증 자동화 도구 후보 | Stage 3-4 evidence 수집 자동화 |
| QA팀 | 활성 .spec.ts 0건 / .bak 4개 분석 + 검증 도구 인벤토리 | P1-6 해결 방향 + Stage 4 근거 |
| 모니터링팀 | docker-compose 인프라 + NestJS 로거 + 크론 상태 | Stage 4 실행 환경 확보 |
| 시뮬레이션팀 | `bonus-simulator` + `integrity-check` + 승급/정산 시나리오 | Stage 4 회귀 케이스 |

### 6.2 다른 팀이 PM팀에 의존

**모든 팀**이 PM팀 검증 게이트를 통과해야 함 (박준혁 주관). 특히:

- **개발1팀 / 개발2팀**: 모든 feature 브랜치의 `[검증:통과]` / `[검증:통합통과]` 커밋 태그 → 김현태 PR 머지 승인
- **QA팀**: 박준혁 경유로 김정훈(QA 리드) 호출 — 6종 보너스 매트릭스 회귀 케이스는 Stage 2 재정의 후 재작성 필요
- **시뮬레이션팀**: 박준혁 경유 (한승민 리드) — Stage 2 산출물 기반 시나리오 재작성
- **모니터링팀**: 박준혁 경유 (장현우 리드) — 크론 실행/에러 로그 증거 수집
- **디자인팀/기획설계팀/리서치팀**: 최윤아 경유 — 문서화 표준 일관성 유지
- **개발3팀**: 서민지 (기술 소통관) / 이수진 (기술 PM) — Stage 3-4 자동화 Skill/Hook 기술 검토

### 6.3 PM팀 내부 14명 서로의 연결

- 소통관 (유진호/서민지/임채원) → 강민호 (총괄) → 일관성 PM (정대훈/한소라/강현우/윤성호/배지영) → Git/이슈 PM (김현태/오민정)
- 검증 게이트 관리: **박준혁** 주관 — 각 단계 증거 수집 + 차단 권한
- 최종 인수 판정: **강민호** 전담 — 체크리스트 전수 확인 없이 완료 선언 불가
- Stage 2 PRD 재작성: **최윤아** 주도 + 강민호 최종 승인

---

## 부록: PM팀 관점 Stage 1 결론

### Top 3 Critical 발견 (PM팀 관점)

1. **[P0-1] commission-prd.md 662줄 전체가 구 체계** — Stage 2.3 전담 subagent 재작성 필수. 재작성 실패 시 개발자가 잘못된 문서를 따라 구 체계로 재구현할 위험 존재.

2. **[P0-3] `.claude/CLAUDE.md` + 10개 페르소나 파일의 6종 보너스 / 5단계 등급 / PV 기반 승급 잔재** — v3 깊은 주입 작업(2026-04-15 커밋 `5d32510`)에서 스키마와 어긋남. 모든 페르소나가 호출 시 stale 컨텍스트 자동 로드 → 신뢰 붕괴. Stage 2.5 작업 없이 후속 단계 진행 시 모든 페르소나의 판단이 왜곡됨.

3. **[P1-3] Task #44.5 RBAC TODO — members.controller.ts 가드 0건** — Task #56 (JWT/Roles/CurrentUser) 완료되지 않은 채로 ADMIN 전용 등급 변경 API가 존재. 박준혁 게이트로 상수 추적. 신규 admin endpoint 추가 PR 반려 기준.

### 이슈 카운트 요약
- **Critical (P0)**: 4건 (P0-1~4)
- **High (P1)**: 6건 (P1-1~6)
- **Medium (P2)**: 5건 (P2-1~5)
- **Low (P3)**: 4건 (P3-1~4)
- **합계**: 19건

### 보상플랜 매트릭스 매치 상태
- **Broadly match** (16/20 cells 완전 일치)
- **미스매치 1건 (신규 발견)**: 온체 판매가 330만 vs DB 286만 — Stage 2.2에 추가 필요
- **nuance 3건 (기존)**: 지점 120만 차등 / 소계 5만 / 빈칸=0 해석 — 사용자 확인 대기
- **매트릭스 검증 도구**: `BonusSimulatorService.simulateSale(dto)` + `admin/bonus-simulator` UI 실행 가능

### 다음 단계 (Stage 2) PM팀 사전 준비사항
- [ ] 본 분석 문서 강민호 1차 review
- [ ] 10개 팀 분석 문서 종합 (메인 세션)
- [ ] Critical/High 이슈 종합 표 출력
- [ ] 사용자에게 nuance 3+1건 질의 준비
- [ ] Stage 2.3 재작성 subagent 프롬프트 템플릿 준비 (최윤아 주도)
- [ ] `.bak` 4개 최종 결정 강민호 판정 준비 (권장: 폐기)

---

*작성자: PM팀 14명 (대표: 강민호 PM 리더) / 본 plan §"Stage 1" / Stage 2에서 이 문서를 참조하여 commission-prd 재작성 + 페르소나 정정 작업 수행*
