# QA팀 파악된 내용

> **작성자**: QA팀 (15명 페르소나 — 김정훈 QA리드 주관)
> **작성일**: 2026-04-15
> **Stage**: Stage 1 — 시스템 파악
> **관점**: 테스트 커버리지 / 검증 자산 / 품질 게이트

---

## 1. 담당 영역 인벤토리

### 1.1 활성 테스트 자산 (★ 현재 거의 0건)

**활성 `.spec.ts` 파일**: **0건** (apps/backend/src/ 하위)
- Glob 검증: `apps/backend/**/*.spec.ts` → **No files found**
- 백엔드 8개 모듈(sales, recognized-sales, commission-rates, compensation-plan, bonuses, settlements, tasks, members) 전체에 단위 테스트 **전무**

**활성 E2E 테스트**: **1건**
- `/data/successbank/projects/kaion/apps/backend/test/app.e2e-spec.ts` (39줄)
  - 내용: `GET /` 200, `GET /health` 200 (DB/memory 필드 검증) — 서버 기동 헬스체크만
  - 비즈니스 로직 커버리지 **0%**

### 1.2 .bak 파일 4개 (보존된 이전 테스트 자산)

| 파일 | 크기 | 분류 | 핵심 내용 |
|------|------|------|----------|
| `/data/successbank/projects/kaion/apps/backend/src/bonuses/bonus-calculator.service.ts.bak` | 345줄 | **서비스 코드** | 구 6종 보너스(SALES/SALES_MANAGEMENT/LICENSE/SHARING/BRANCH_OPERATION) 계산 로직. `BonusType.SALES = 500000` 등 fallback 상수. `findUplineLeaders` (BRANCH_CHIEF/DIVISION_CHIEF 20-depth 탐색). `calculateBonusesOnSale()` + `previewBonuses()` |
| `/data/successbank/projects/kaion/apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak` | 598줄 | **단위 테스트** | 19개 시나리오: create 4건, findAll 3건, findOne 2건, cancel 2건, getEffectiveGrade 1건, **recognitionType 처리 6건(1~6)**, **hasActiveLicenseRecognition 7건(7~13)** |
| `/data/successbank/projects/kaion/apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak` | 153줄 | **컨트롤러 테스트** | 4개 endpoint 테스트: POST create, GET findAll, PATCH update, POST /:id/cancel. 모두 service mock 기반 |
| `/data/successbank/projects/kaion/apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak` | 373줄 | **통합(인정매출 연동)** | 11개 시나리오: **SHARING × 인정매출 4건** + **LICENSE × 인정판권 7건(14~20)**. calculateSharingBonus + calculateLicenseBonus 로직 검증 |

**합계**: 4개 파일, 코드 1,469줄, 테스트 시나리오 약 **34건** 보존됨

### 1.3 테스트 환경 설정

- **Jest 설정**: `/data/successbank/projects/kaion/apps/backend/jest.config.js`
  ```js
  rootDir: 'src'
  testRegex: '.*\\.spec\\.ts$'
  transform: ts-jest
  testEnvironment: 'node'
  ```
  - `.bak` 파일은 rootDir=src 내부에 있지만 `testRegex`가 `.spec.ts$` 이므로 자동 제외됨 (OK)
- **package.json test scripts**: `test / test:watch / test:cov` 정의 됨
- **지원 라이브러리**: `@nestjs/testing`, `jest`, `ts-jest`, `@types/jest` 설치 완료
- **누락**: `supertest` (e2e에서만 사용), Playwright(미설치), k6/artillery(미설치)

### 1.4 테스트 데이터 시드

- `apps/backend/prisma/seed.ts` 참조 (package.json `prisma.seed` 정의)
- 실제 파일 존재 미확인 — 시드 데이터 활용 가능 여부 송지현 페르소나 확인 필요

### 1.5 프론트엔드 테스트

- **검색 결과**: `apps/frontend` 영역 `*.spec.ts` / `*.test.ts` / `playwright.config.ts` 모두 **부재**
- 프론트엔드 테스트 커버리지 **0%** (유닛 / 통합 / E2E 전부 없음)

---

## 2. 기능별 테스트 커버리지 상태 (모듈별)

| 모듈 | 상태 | 활성 테스트 | .bak 존재 | 비고 |
|------|------|-----------|----------|------|
| **auth** | ❌ 0% | 0건 | 없음 | JWT 가드 / RBAC 테스트 전무 (Task #44.5 미완과 별도) |
| **members** (promotion, genealogy 포함) | ❌ 0% | 0건 | 없음 | 14 endpoint + PromotionService + genealogy-raw-queries 전부 미검증 |
| **sales** | ❌ 0% | 0건 | 없음 | 판매 등록 / weekCode 생성 / Sale → Bonus 체인 시작점 미검증 |
| **recognized-sales** | ⚠️ 0% (단, .bak 복원 가능) | 0건 | 2건 (service 598줄 + controller 153줄) | **단위 19건 + 통합 11건 분량의 이전 자산 존재** — 단, RecognitionType 타입이 현 schema에 유지되었는지 확인 후 복원 가능 여부 판단 (유지됨 확인) |
| **commission-rates** (ProductCommissionRate 포함) | ❌ 0% | 0건 | 없음 | 제품×등급 매트릭스 CRUD 미검증. 5×4 = 20 케이스 후보 |
| **compensation-plan** (bonus-calculator, bonus-simulator) | ⚠️ 0% (인정매출 .bak 존재) | 0건 | 1건 (373줄) | `.bak`은 구 SHARING/LICENSE 보너스 + 인정매출 연동. **현 2종 체계(SALES_COMMISSION/EDUCATION_MANAGEMENT)와 정면 충돌** → 직접 복원 불가 |
| **bonuses** | ❌ 0% | 0건 | 1건 (service 코드 345줄) | `.bak`은 구 6종 보너스 fallback 상수 코드. **코드 부활 금지** (페르소나 시스템 지시) |
| **settlements** (settlement-schedule, settlements.service) | ❌ 0% | 0건 | 없음 | 자동정산 크론 (`settlement-scheduler.task.ts`) 미검증 — **P0 리스크** (실제 돈 흐름) |
| **tasks** (settlement-scheduler, integrity-scheduler) | ❌ 0% | 0건 | 없음 | 크론 실행 경로 단위/통합 모두 미검증 |
| **app/admin/\*** (프론트 20+ 페이지) | ❌ 0% | 0건 | 없음 | Playwright E2E 전무 |
| **app/** (사용자 화면: login, register, dashboard, mypage, organization, sales, bonuses 등) | ❌ 0% | 0건 | 없음 | 전무 |
| **AppController / health** | ✅ 100% (shallow) | 1건 (e2e) | - | `/` + `/health` 2케이스만 |

### 2.1 수치 요약

- **백엔드 모듈 커버리지**: 거의 0% (약 **14개 모듈 × 평균 8 endpoint = 112 endpoint 미검증**)
- **프론트엔드 커버리지**: 0%
- **E2E 커버리지**: shallow 2 케이스 (health check)
- **총 활성 spec 수**: **1개** (app.e2e-spec.ts)
- **총 .bak 시나리오 수**: **약 34건** (대부분 폐기 후보)

### 2.2 `jest.config.js`와 현실의 괴리

```js
collectCoverageFrom: ['**/*.(t|j)s']
```

`pnpm test:cov` 실행 시 **모든 소스가 수집 대상**으로 잡히지만 실제 spec이 0건이므로 **coverage 0%**가 나옴. CI에 coverage threshold 미설정 상태 (운영상 위험 — 신 테스트 작성 전에 threshold 수립 필요, 윤성재(자동화 리드) 범위).

---

## 3. 발견된 이슈 (테스트 부재 + .bak 분석 결과)

> **분류 원칙**: 테스트 자체 부재 이슈는 대부분 Critical/High (도메인이 돈/정산 직결)

### [Critical] C-QA-01: 자동정산 크론 테스트 전무 (돈 손실 직결)
- **위치**: `apps/backend/src/tasks/settlement-scheduler.task.ts`, `apps/backend/src/settlements/settlements.service.ts`
- **현상**: 최근 commit `b6ca264 자동정산기능`으로 도입된 크론이 테스트 없이 운영 중. `createAutoSettlement()` 경로 검증 없음
- **영향**: 크론 실행 실패 / 잘못된 금액 / 중복 정산 등 즉시 **재무 영향** 발생 가능. 롤백 경로도 검증 안 됨
- **근거**: `Glob apps/backend/**/*.spec.ts → 0건` + `.bak`에도 settlement 테스트 부재

### [Critical] C-QA-02: BonusCalculatorService (현행) 테스트 전무
- **위치**: `apps/backend/src/compensation-plan/services/bonus-calculator.service.ts` (활성) + `.../bonus-simulator.service.ts`
- **현상**: 신 체계 `SALES_COMMISSION + EDUCATION_MANAGEMENT` 보너스 계산 로직의 단위/통합 테스트 전무
- **영향**: 이미지 매트릭스(고주파 50/100/20/5만 등)대로 계산되는지 **검증 수단 없음**. 수당률 수정(commit `420e7a4`) 후 회귀 위험
- **근거**: `.bak` 파일은 **구 6종 체계 기반**이라 복원 불가, 재작성 필요

### [Critical] C-QA-03: members Controller 14 endpoint 계약 테스트 전무
- **위치**: `apps/backend/src/members/members.controller.ts`
- **현상**: Task #44.5 RBAC 미완 상태에서 **계약 테스트도 없음** → 스펙 없이 운영 중
- **영향**: JWT 가드 적용 시 회귀 측정 불가. bulk-password-reset WIP 완료 시 검증 수단 부재
- **근거**: 활성 `.spec.ts` 0건 + 최근 작업 트리에 `bulk-password-reset.dto.ts` WIP 확인

### [Critical] C-QA-04: PromotionService (4단계 승급) 테스트 전무
- **위치**: `apps/backend/src/members/promotion.service.ts`
- **현상**: `checkPromotionEligibility()` + PV 누적 + 후원계보 3팀 조건 검증 로직의 경계값 테스트 0건
- **영향**: 승급 판정 오류 시 보너스 자격이 연쇄적으로 틀어짐. 회원 생애주기 핵심
- **근거**: Glob 결과 0 + PromotionService 페르소나 카드 (이미영, 박진우)

### [High] H-QA-05: recognized-sales `.bak` 테스트 폐기 위험
- **위치**: `.../recognized-sales.service.spec.ts.bak` (598줄), `.../recognized-sales.controller.spec.ts.bak` (153줄)
- **현상**: RecognitionType enum (GRADE/LICENSE)은 **현재 schema에도 유지됨** (schema.prisma line 429~432 확인) → 복원 가능성 있음
- **영향**: 잘못 폐기하면 19+4 = 23 시나리오의 이전 노력 유실. 보존하면 부실한 mock-only 테스트가 유지됨
- **근거**: `grep enum RecognitionType` = hit. `recognitionType: GRADE / LICENSE` 필드 현재도 사용 중
- **결정 필요**: 강민호(PM 리더) — .bak 4개 중 **2개(recognized-sales 관련)만 복원, 2개(bonus-calculator 관련)는 폐기** 가능성 있음

### [High] H-QA-06: 수당 체인 통합 테스트 전무
- **위치**: sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements 체인 전체
- **현상**: 체인 end-to-end 검증 0건. 체인 순서 역전 시 감지 수단 없음
- **영향**: 한상우(통합 테스트 리드)의 핵심 영역. 페르소나 문서 명시 "체인 순서 절대 변경 불가"지만 **자동 가드 없음**
- **근거**: 활성 integration spec 0건

### [High] H-QA-07: admin 페이지 E2E 전무 (20+ 페이지)
- **위치**: `apps/frontend/src/app/admin/**/page.tsx`
- **현상**: bonus-simulator(매트릭스 검증 도구), settlements(정산 실행), commission-rates(수당률 수정) 등 중요 페이지 E2E 0건
- **영향**: Stage 2 작업에서 `bonus-simulator` UI로 이미지 매트릭스 검증할 때 페이지 자체가 깨지면 즉시 실패
- **근거**: Glob `apps/frontend/**/*.spec.ts` + `playwright.config.ts` 모두 부재

### [High] H-QA-08: genealogy-raw-queries 부하/정합성 테스트 부재
- **위치**: `apps/backend/src/members/genealogy-raw-queries.ts` (★ raw SQL, 리팩터 금지)
- **현상**: 이중 트리(recommenderId + sponsorId) + 1:3 팀라인 CHECK 제약 가진 핵심 쿼리의 성능 기준선 없음
- **영향**: 100만/1000만 회원 시나리오에서 회귀 감지 불가. 김동현(성능 리드) + 박준서(확장성) 관심 영역
- **근거**: k6/artillery 미설치, 성능 수치 문서 없음

### [High] H-QA-09: ProductCommissionRate 매트릭스 무결성 테스트 없음
- **위치**: `apps/backend/prisma/schema.prisma` `ProductCommissionRate` (line 113~129)
- **현상**: `@@unique([productId, recipientGrade])` 제약만으로는 **5×4 = 20 row 누락 감지 불가** (예: "통증 패치 × SALESPERSON" row 자체가 없어야 되는지 / 금액=0으로 존재해야 되는지 검증 없음)
- **영향**: Stage 2 nuance 3번 (통증패치/전용젤 판매원 빈칸)과 직결
- **근거**: schema.prisma 확인

### [Medium] M-QA-10: `.bak` 파일 CI 제외 설정 부재
- **현상**: `jest.config.js`가 `.spec.ts$` regex를 사용하므로 자연스럽게 `.bak` 제외되지만, **명시적 `testPathIgnorePatterns` 없음**
- **영향**: 누군가 `.spec.ts.bak` → `.spec.ts`로 rename 시 구 6종 보너스 테스트가 자동 포함되어 CI 폭발
- **근거**: jest.config.js line 1~13

### [Medium] M-QA-11: coverage threshold 미설정
- **현상**: `jest.config.js`에 `coverageThreshold` 부재 → coverage 0%여도 test 통과
- **영향**: 규모 확장 후에도 커버리지 후퇴 감지 불가

### [Medium] M-QA-12: 테스트 격리 DB 부재
- **현상**: `docker-compose.test.yml` 미존재. 실 운영 DB(kaion_db)만 존재
- **영향**: 추후 통합 spec 작성 시 운영 데이터 오염 위험
- **근거**: 송지현 페르소나 카드 "격리 DB 필요"

### .bak 파일 상세 분석 (핵심)

#### A. `bonus-calculator.service.ts.bak` (bonuses/) — **폐기 권장**
- **본질**: 서비스 **코드**이지 테스트 아님 (.bak 중 유일)
- **내용**: `BonusType.SALES / SALES_MANAGEMENT / LICENSE (4등급 차등) / SHARING / BRANCH_OPERATION` fallback + `findUplineLeaders` 20-depth loop
- **현 체계와 충돌**: 현재 schema는 `BonusType = SALES_COMMISSION | EDUCATION_MANAGEMENT` 뿐. BRANCH_CHIEF/DIVISION_CHIEF enum은 제거되고 `BRANCH_MANAGER` 하나로 통합
- **복원 불가**: 타입 이름/필드 자체가 schema에 없음. 컴파일 실패 확실
- **살릴 수 있는 것**: `findUplineLeaders`의 **탐색 depth 20 제한** 패턴 + 무한루프 방지 알고리즘은 신 체계로 포팅 가치 있음

#### B. `recognized-sales.service.spec.ts.bak` (598줄) — **부분 복원 가능**
- **본질**: 순수 service 단위 테스트 (Prisma mock 기반)
- **현 schema와의 호환성**:
  - `RecognizedSales` 모델 ✅ 유지
  - `RecognitionType` enum ✅ 유지 (GRADE / LICENSE)
  - `RecognizedSalesStatus` ✅ 유지 (ACTIVE / CANCELLED)
  - `MemberGrade.MANAGER` ❌ → 현 `TEAM_LEADER`로 rename 필요
  - `MemberGrade.AGENT` ❌ → `SALESPERSON`으로 rename
  - `MemberGrade.BRANCH_CHIEF` ❌ → `BRANCH_MANAGER`
- **살릴 수 있는 시나리오 (grade enum rename만 하면 바로 살림)**:
  - `create()` 4 케이스 (유효, NotFound, 잘못된 등급, 중복)
  - `findAll()` 3 케이스 (페이징, 상태 필터, 검색)
  - `findOne()` 2 케이스 (조회, NotFound)
  - `cancel()` 2 케이스 (취소, 이미 취소)
  - `getEffectiveGrade()` 1 케이스 (인정 > 실제)
  - **recognitionType 처리 6 케이스** (기본값 GRADE, LICENSE 명시, GRADE+LICENSE 공존, 중복 불가, GRADE/LICENSE 필터)
  - **hasActiveLicenseRecognition 7 케이스** (ACTIVE+기간내, GRADE만, 만료, CANCELLED, 시작전, 무기한, 다른 등급)
- **총 복원 가능**: 25 케이스

#### C. `recognized-sales.controller.spec.ts.bak` (153줄) — **복원 가능**
- **본질**: 컨트롤러 4 endpoint 테스트 (service mock)
- **현 schema와 호환**: 위 B와 동일하게 MemberGrade rename만 필요
- **살릴 수 있는 시나리오**:
  - POST /recognized-sales (create)
  - GET /recognized-sales (findAll)
  - PATCH /recognized-sales/:id (update)
  - POST /recognized-sales/:id/cancel (cancel)
- **총 복원 가능**: 4 케이스

#### D. `bonus-calculator.recognized.spec.ts.bak` (373줄, compensation-plan/) — **폐기 권장**
- **본질**: bonus-calculator + 인정매출 통합 테스트
- **내용**: `calculateSharingBonus()` (구 SHARING 보너스) + `calculateLicenseBonus()` (구 LICENSE 보너스)
- **현 체계와 충돌**: SHARING / LICENSE 보너스 타입 자체가 **현 BonusType enum에 없음**. 서비스 메서드 이름도 아마 변경됐을 것
- **살릴 수 있는 것**:
  - **테스트 구조**는 가치 있음: "인정 등급으로 자격 조건 우회" 로직 검증 패턴
  - **`hasActiveLicenseRecognition` 연동 테스트** 시나리오 14~20은 현재 체계에서 EDUCATION_MANAGEMENT 자격 조건 검증으로 **아이디어 재활용** 가능
- **직접 복원 불가**: 타입/메서드 모두 재설계 필요

### .bak 폐기/복원 종합 권고 (강민호 결정 제안)

| 파일 | 권고 | 근거 |
|------|------|------|
| `bonus-calculator.service.ts.bak` (bonuses) | **폐기** (.legacy 디렉터리로 이동) | 서비스 코드이고 신 체계와 타입 충돌. 알고리즘 아이디어만 메모로 추출 |
| `recognized-sales.service.spec.ts.bak` | **복원 (enum rename 후)** | RecognizedSales/RecognitionType 모델 유지됨. 25 케이스 즉시 활용 가능 |
| `recognized-sales.controller.spec.ts.bak` | **복원 (enum rename 후)** | 동일. 4 케이스 즉시 활용 가능 |
| `bonus-calculator.recognized.spec.ts.bak` | **폐기** (구 SHARING/LICENSE 기반) | 신 2종 체계와 메서드 이름 자체가 다름 |

**결과**: 4개 중 **2개 복원 + 2개 폐기** 권고. 복원 2개도 현 MemberGrade enum(SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER)으로 일괄 치환 필요.

---

## 4. 보상플랜 관련 내용 (매트릭스 검증 테스트 시나리오 제안)

### 4.1 이미지 매트릭스 (Ground Truth — 재인용)

| 제품 | 판매원 (SALESPERSON) | 팀장 (TEAM_LEADER) | 지사장 (BRANCH_MANAGER) | 센터 (CENTER) | 판매가 | 합계 |
|------|---------------------|-------------------|------------------------|--------------|--------|------|
| 고주파(온체) | 50만 | 100만 / **지점 120만** | 20만 (**소계 5만**) | 5만 | 330만 | ≤330만 |
| 펄스온(저주파) | 40만 | 80만 | 15만 | 5만 | 249만 | 140만 |
| 제트5(초음파) | 25만 | 50만 | 5만 | 5만 | 150만 | 85만 |
| 통증 패치 | **(빈칸)** | 2만 | 4,800 | 2,400 | 4만8천 | 2.72만 |
| 전용젤 | **(빈칸)** | 1만5천 | 3,000 | 1,500 | 3만 | 1.95만 |

### 4.2 매트릭스 기반 테스트 케이스 제안 (5 × 4 = 20 케이스)

```yaml
test_suite: ProductCommissionRate 매트릭스 정합성
담당: 이미영(기능) + 박진우(요구사항) + 한상우(통합) 3자 공동
기준_파일: apps/backend/src/compensation-plan/services/bonus-simulator.service.ts
데이터: apps/backend/prisma/seed.ts (seed 작성 필수)

cases:
  # 고주파(온체) 4 케이스
  - TC-PCR-01: 고주파 × SALESPERSON → 500,000원
  - TC-PCR-02: 고주파 × TEAM_LEADER → 1,000,000원 (기본) OR 1,200,000원 (지점 소속 시) ★ nuance 1
  - TC-PCR-03: 고주파 × BRANCH_MANAGER → 200,000원 (소계 5만 표시 방법 nuance 2)
  - TC-PCR-04: 고주파 × CENTER → 50,000원

  # 펄스온 4 케이스
  - TC-PCR-05: 펄스온 × SALESPERSON → 400,000원
  - TC-PCR-06: 펄스온 × TEAM_LEADER → 800,000원
  - TC-PCR-07: 펄스온 × BRANCH_MANAGER → 150,000원
  - TC-PCR-08: 펄스온 × CENTER → 50,000원

  # 제트5 4 케이스
  - TC-PCR-09: 제트5 × SALESPERSON → 250,000원
  - TC-PCR-10: 제트5 × TEAM_LEADER → 500,000원
  - TC-PCR-11: 제트5 × BRANCH_MANAGER → 50,000원
  - TC-PCR-12: 제트5 × CENTER → 50,000원

  # 통증 패치 4 케이스 (SALESPERSON 빈칸 → nuance 3)
  - TC-PCR-13: 통증패치 × SALESPERSON → row 부재 OR amount=0 (★ 결정 필요)
  - TC-PCR-14: 통증패치 × TEAM_LEADER → 20,000원
  - TC-PCR-15: 통증패치 × BRANCH_MANAGER → 4,800원
  - TC-PCR-16: 통증패치 × CENTER → 2,400원

  # 전용젤 4 케이스 (SALESPERSON 빈칸 → nuance 3)
  - TC-PCR-17: 전용젤 × SALESPERSON → row 부재 OR amount=0 (★ 결정 필요)
  - TC-PCR-18: 전용젤 × TEAM_LEADER → 15,000원
  - TC-PCR-19: 전용젤 × BRANCH_MANAGER → 3,000원
  - TC-PCR-20: 전용젤 × CENTER → 1,500원

assertions:
  - 각 케이스: BonusSimulatorService.simulate(productId, sellerGrade) 호출 → 반환 금액이 위 값과 일치
  - @@unique([productId, recipientGrade]) 제약 검증
  - TC-PCR-13, 17: SALESPERSON 판매 시 본인 수당 없음 (빈칸 nuance)
  - TC-PCR-02: 지점 소속 TEAM_LEADER 구분 (★ schema 확장 필요 — branchBonusAmount 컬럼?)
  - TC-PCR-03: 소계 5만 의미 해석 (★ 합산? 별도? Stage 2 사용자 확인)

verification:
  도구: BonusSimulatorService (existing)
  수동: GET /admin/bonus-simulator 페이지에서 5제품 × 4등급 = 20회 수동 실행 → 스크린샷
```

### 4.3 매트릭스 합계 검증 (수당 총합 ≤ 판매가)

```yaml
test_suite: 판매가 대비 수당 총합 상한 검증
목적: 총 지급 수당이 판매가를 초과하지 않음 (MLM 지속가능성 핵심)

cases:
  - TC-TOTAL-01: 고주파 총 지급(50+120+20+5=195 또는 50+100+20+5=175) ≤ 330만 ✅
  - TC-TOTAL-02: 펄스온 총 지급(40+80+15+5=140만) ≤ 249만 ✅
  - TC-TOTAL-03: 제트5 총 지급(25+50+5+5=85만) ≤ 150만 ✅
  - TC-TOTAL-04: 통증패치 총 지급(2+0.48+0.24=2.72만) ≤ 4.8만 ✅
  - TC-TOTAL-05: 전용젤 총 지급(1.5+0.3+0.15=1.95만) ≤ 3만 ✅
  - TC-TOTAL-SUM: 위 각 케이스가 "판매가 - 총수당 > 0" 확인 (수익 보장)
```

### 4.4 자격 조건 테스트 (승급 + 보상 수령)

```yaml
test_suite: 등급 승급 + 보상 자격 조건
담당: 이미영(기능), 박진우(요구사항), 오태준(E2E)

grades_lifecycle:
  - TC-PRO-01: 신규 가입 → SALESPERSON 기본 할당
  - TC-PRO-02: SALESPERSON + 1세트 판매 → 판매원 자격 활성
  - TC-PRO-03: 10명 소개 (한시적 3명 규정) → TEAM_LEADER 승급 트리거
  - TC-PRO-04: 팀장으로서 10명 소개 → BRANCH_MANAGER 승급 트리거
  - TC-PRO-05: BRANCH_MANAGER → CENTER 지정(지역본부장 직권)
  - TC-PRO-06: 각 등급의 수당 분류 (판매수수료 vs 교육관리) 올바른 BonusType 매핑
```

### 4.5 Nuance 3건 테스트 시나리오 (Stage 2 완료 후)

```yaml
nuance_1:
  제목: 고주파 × TEAM_LEADER "100만 / 지점 120만" 차등
  테스트: schema 확장 후 (예: branchBonusAmount 필드)
    - TC-NUANCE1-A: 일반 TEAM_LEADER → 100만
    - TC-NUANCE1-B: 지점 소속 TEAM_LEADER → 120만
    - TC-NUANCE1-C: 지점 플래그 없는 경우 기본값(100만) 사용

nuance_2:
  제목: 고주파 × BRANCH_MANAGER "20만 (소계 5만)"
  해석_후보_A: "20만 합계 중 센터 5만 포함" → DB에는 15만 저장, 표시만 합산
  해석_후보_B: "20만 + 별도 5만" → DB에 20만, 5만은 별도 항목
  테스트: 사용자 결정 후 작성

nuance_3:
  제목: 통증패치 / 전용젤 × SALESPERSON 빈칸
  테스트:
    - TC-NUANCE3-A: ProductCommissionRate.findUnique({productId:통증패치, recipientGrade:SALESPERSON}) → null 확인
    - TC-NUANCE3-B: SALESPERSON이 통증패치 판매 시 본인 수당 생성 0건
    - TC-NUANCE3-C: 전용젤 동일
    - TC-NUANCE3-D: TEAM_LEADER 이상은 정상 수당 지급 (2만/1만5천)
```

### 4.6 E2E 플로우 (회원 가입 → 승급 → 판매 → 정산 전체)

```yaml
test_suite: 전체 비즈니스 플로우 E2E
담당: 오태준(E2E 리드), 임채영(Playwright 스크립트)
기술: Playwright (설치 필요)

scenarios:
  - E2E-FULL-01: 신규 가입 → SALESPERSON → 고주파 1대 판매 → 본인 50만 수당 → 자동정산 → 지급 확인
  - E2E-FULL-02: SALESPERSON → 10명 소개 → TEAM_LEADER 승급 → 하위 판매 → 100만 수당
  - E2E-FULL-03: TEAM_LEADER → 팀 확대 → BRANCH_MANAGER 승급 → 20만 수당
  - E2E-FULL-04: 5 제품 각각 판매 → 4 등급별 수당 지급 매트릭스 검증
  - E2E-FULL-05: RecognizedSales (GRADE type) 등록 → SHARING 성격 보너스 자격 획득 (★ 현 체계 재해석)
  - E2E-FULL-06: RecognizedSales (LICENSE type) 등록 → 팀 조건 우회 → 승급 보너스
  - E2E-FULL-07: 자동정산 스케줄 실행 → weekCode 생성 → Settlement 레코드 확정
  - E2E-FULL-08: 정산 후 롤백 / 오류 보정 경로
```

---

## 5. 향후 개발 참조 사실 (핵심 규칙 / 패턴 / 함정)

### 5.1 테스트 작성 규칙 (신 체계 기준)

1. **MemberGrade enum은 4단계** (SALESPERSON / TEAM_LEADER / BRANCH_MANAGER / CENTER) + ADMIN
   - 구 5단계(MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF) 사용 금지
2. **BonusType enum은 2종** (SALES_COMMISSION / EDUCATION_MANAGEMENT)
   - 구 6종(SALES/SALES_MANAGEMENT/LICENSE/SHARING/BRANCH_OPERATION) 사용 금지
3. **RecognitionType은 유지** (GRADE / LICENSE) — .bak에서 복원 가능한 유일한 테스트 영역
4. **수당은 고정 금액** (`ProductCommissionRate.amount`) — 퍼센트 계산 없음
5. **weekCode 생성 로직**은 sales → settlements 체인의 pivot key (테스트 시 명시 필수)

### 5.2 .bak 파일 함정

- `.bak` 4개는 `apps/backend/src/` 내부에 위치하지만 `jest.config.js`의 `.spec.ts$` regex로 **우연히** 제외됨
- **명시적 exclude 추가 필요**: `testPathIgnorePatterns: ['\\.bak$']`
- `.bak` 중 2개(recognized-sales)는 복원 가능하지만 `MemberGrade` enum 일괄 치환 필수
- `.bak` 2개(bonus 관련)는 신 체계와 근본 충돌 → 폐기 권고

### 5.3 수당 체인 순서 절대 규칙

```
sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements
```

- 테스트 작성 시 **이 순서 역전 금지**
- 통합 spec에서 단계 스킵 금지 (mock해도 호출 순서 검증 필수)
- 한상우(통합 리드) 카드 명시: "체인 중 어느 단계라도 순서 역전 시 통합 실패"

### 5.4 자동정산 크론 테스트 시 주의

- `settlement-scheduler.task.ts`는 `@Cron()` 데코레이터 기반
- **실 크론 실행 대신** `settlementsService.executeAutoSettlement()` 직접 호출로 단위 테스트
- `weekCode` 생성 시 `Date` mock 필수 (테스트 시간 고정)
- Prisma `$transaction` 내부 실행이므로 mock 설정 복잡

### 5.5 raw SQL 테스트 주의

- `genealogy-raw-queries.ts`는 Prisma client 대신 `$queryRaw` 사용
- **mock 불가** → 통합 spec에서 실 Postgres 필요 → 격리 DB 필수 (송지현 담당)
- 이 영역은 **리팩터 금지**, 테스트만 추가
- 김동현(성능 리드)와 협업, k6 부하 측정 도입 시 함께 설계

### 5.6 Task #44.5 RBAC 미완 인식

- members.controller.ts는 현재 **익명 접근 가능** 상태
- 계약 테스트 작성 시 "현재는 익명 통과가 정상"으로 가정
- 최민규(보안 리드)와 추적 협업, RBAC 구현 완료 후 **테스트 일괄 수정** 예정

### 5.7 프론트엔드 테스트 도입 로드맵

1. Playwright 설치 (임채영 담당)
2. `playwright.config.ts` 생성 (Nginx 5667 기준)
3. AntD 컴포넌트 label/role 기반 셀렉터 원칙
4. react-d3-tree SVG 노드는 data-testid 추가 요청 필요 (개발2팀)

### 5.8 CI 파이프라인 도입 필수

- 현재 `.github/workflows/` 미확인 (윤성재 담당 영역)
- CI에서 `.bak` 제외 명시
- 수당 체인 spec은 **병렬 실행 금지** (순서 꼬임 위험)
- verify-feature / integration-check Skill (개발3팀 예정) 결과를 CI 코멘트 게시

---

## 6. 다른 팀과의 의존

### 6.1 이 영역(QA)이 의존하는 팀

| 팀 | 담당자 | 의존 내용 | 상태 |
|----|-------|----------|------|
| **개발1팀** | 윤서연, 김태현 등 | members 모듈 (14 endpoint, PromotionService, genealogy) 테스트 가능한 구조로 제공 | ⚠️ 현 구조로 테스트 작성은 가능하나 시드 부재 |
| **개발2팀** | 이준혁, 정미래 등 | **수당 체인 전체** (sales / recognized-sales / commission-rates / compensation-plan / bonuses / settlements / tasks) + admin 페이지 20+ — 테스트 훅 제공 | ❌ 테스트 훅 없음 (fixture/seed 부재) |
| **개발3팀** | 이정우, 기타 | verify-feature / integration-check Skill + mock-data-gen + unit-test-gen Skill | ⏳ 미생성 (Stage 3 후보) |
| **PM팀** | 강민호(리더), 박준혁(품질) | .bak 4개 복원/폐기 최종 결정 + 점진적 테스트 스케줄 승인 | ⏳ 이 문서가 결정 인풋 |
| **기획설계팀** | 정서현 등 | Acceptance Criteria 문서 (기능별) — 박진우 요구사항 테스트 입력 | ❌ 미작성 |
| **리서치팀** | — | (직접 의존 없음) |
| **디자인팀** | 한소라, 강현우 | admin 페이지 레이아웃 확정 후 E2E 스크립트 작성 | ⏳ |
| **모니터링팀** | 이정민, 박도영 | 성능 지표 base line + APM 데이터 (김동현 성능 테스트 협업) | ❌ APM 미구성 |
| **시뮬레이션팀** | 김태호 등 | 단계별 시나리오 데이터 (100만 회원, 1:3 팀라인 준수) | ❌ 시뮬레이터 미구성 |

### 6.2 이 영역(QA)에 의존하는 팀

| 팀 | 담당자 | 의존 내용 |
|----|-------|----------|
| **PM팀 (박준혁)** | 점진적 테스트 Pass/Fail 표 → 검증 게이트 통과 판정 입력 |
| **PM팀 (강민호)** | 전체 회귀 테스트 결과 → 릴리즈 승인 입력 |
| **개발1팀 / 개발2팀** | 자체 검증 후 QA 점진적 테스트 결과로 "완료" 선언 가능 |
| **모니터링팀** | 배포 후 모니터링 baseline을 QA 성능 테스트에서 공급 |
| **시뮬레이션팀** | QA E2E 시나리오를 비즈니스 시뮬레이션 입력으로 재사용 |

### 6.3 핵심 협업 포인트 (즉시 필요)

```
김정훈(QA 리드) ──┬─> 강민호(PM 리더): .bak 4개 결정 요청 (본 문서 §3 D 권고안)
                  ├─> 박준혁(품질 PM): Stage 3 검증 체크리스트 작성 지원
                  ├─> 이준혁(개발2팀 BE 리드): 수당 체인 테스트 훅 요청
                  ├─> 윤성재(자동화 리드): CI 설정 + .bak testPathIgnorePatterns 추가
                  └─> 송지현(테스트 환경): 격리 DB 구성 (docker-compose.test.yml)

이미영(기능 테스트) ─> members 14 endpoint 테스트 작성 (Stage 4 우선 투입)
박진우(요구사항) ───> commission-prd 재작성 후 매트릭스 Acceptance Criteria 작성
한상우(통합) ───────> 수당 체인 spec 설계 (sales→settlements)
최서연(회귀) ───────> .bak 2개 복원 + MemberGrade enum rename 작업
오태준(E2E) ────────> Playwright 도입 + admin/bonus-simulator E2E 작성
김동현(성능) ───────> genealogy-raw-queries.ts 부하 baseline 측정 (이정민 협업)
최민규(보안) ───────> Task #44.5 RBAC 테스트 준비 (구현 완료 대기)
윤성재(자동화) ─────> CI 파이프라인 + verify-feature Skill 연동 설계
```

---

## 부록: 신 체계 기반 테스트 작성 우선순위 (Stage 3/4 투입 순서)

| 우선순위 | 대상 | 유형 | 담당 | 근거 |
|---------|------|------|------|------|
| **P0** | 자동정산 크론 (settlement-scheduler) | 단위 + 통합 | 한상우 + 최서연 | C-QA-01 돈 손실 직결 |
| **P0** | BonusCalculatorService (현행 2종) | 단위 | 이미영 + 박진우 | C-QA-02 매트릭스 검증 |
| **P0** | ProductCommissionRate 매트릭스 20 케이스 | 단위 | 이미영 | H-QA-09 + Stage 2 nuance 3건 |
| **P1** | members 14 endpoint 계약 테스트 | API | 정유진 | C-QA-03 RBAC 이전 baseline |
| **P1** | PromotionService 경계값 | 단위 | 이미영 | C-QA-04 승급 체인 |
| **P1** | recognized-sales .bak 복원 (25+4 케이스) | 단위 + 컨트롤러 | 최서연 | H-QA-05 자산 회수 |
| **P2** | 수당 체인 통합 (sales→settlements) | 통합 | 한상우 | H-QA-06 체인 순서 가드 |
| **P2** | admin/bonus-simulator E2E | E2E | 오태준 + 임채영 | H-QA-07 Stage 2 검증 도구 |
| **P3** | genealogy-raw-queries 부하 baseline | 성능 | 김동현 | H-QA-08 |
| **P3** | CI 파이프라인 + jest 설정 보강 | 자동화 | 윤성재 | M-QA-10, M-QA-11 |

---

**종합**: 현재 Kaion 백엔드의 테스트 커버리지는 사실상 **0%** (E2E health check 2 케이스 제외). `.bak` 4개 중 **2개(recognized-sales)는 복원 가능**(25+4=29 시나리오 회복), **2개(bonus 관련)는 폐기** 권고. Stage 3 체크리스트 작성 시 **P0 3건(크론/Bonus/Matrix)에 집중 투입** 권장. 페르소나 강민호(PM 리더) 결정이 `.bak` 최종 처분을 좌우함. 본 문서는 박준혁(품질 PM) → 강민호 인수 후 Stage 2/3의 QA 게이트 입력으로 활용.

*작성 완료 — 김정훈(QA 리드) 주관 15인 페르소나 집단 분석 결과*
