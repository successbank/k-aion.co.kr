# (주)케이아이온 수당 PRD v2.0 (2026-04-15 신 체계 재작성)

**Product Requirements Document — 보상플랜 / 수당 / 정산**

| 항목     | 내용                                       |
| -------- | ------------------------------------------ |
| 문서버전 | 2.0                                        |
| 작성일자 | 2026-04-15                                 |
| 상태    | 재작성 (Rewritten, v1.0 전면 교체)          |
| 기반자료 | 첨부 보상플랜 이미지 + `schema.prisma` 현재 구현 |
| 우선순위 | 이미지 > 코드 > PRD 문서 (충돌 시 코드 신뢰) |

---

## 0. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성 |
|------|------|----------|------|
| v1.0 | 2025-12 | 초안 — 구 6종 보너스 체계 (SALES, SALES_MGMT, LICENSE, LICENSE_MGMT, SHARING, BRANCH_OPERATION) + 5단계 등급(MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF) | 기획설계팀 |
| v2.0 | 2026-04-15 | **신 체계로 전면 재작성** — 첨부 보상플랜 이미지 + 현재 schema(BonusType 2종 SALES_COMMISSION + EDUCATION_MANAGEMENT, 4단계 영업 + ADMIN) 기준. 제품별 매트릭스 + 자동정산 스케줄러 + RecognizedSales 모델 반영. | 기획설계팀 + PM팀 강민호 주관 |

### v1.0 → v2.0 구 체계 vs 신 체계 한눈에

| 영역 | v1.0 (구) | v2.0 (신, 현재 코드) |
|------|-----------|---------------------|
| 등급 체계 | 5단계 영업 (MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF) + ADMIN | **4단계 영업 (SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER) + ADMIN** |
| BonusType | 6종 (SALES, SALES_MGMT, LICENSE, LICENSE_MGMT, SHARING, BRANCH_OPERATION) | **2종 (SALES_COMMISSION, EDUCATION_MANAGEMENT)** |
| 수당 계산 | 보너스별 고정 금액 (ex. 판매 보너스 50만, 공유 보너스 2만) | **제품별 × 등급별 매트릭스 (ProductCommissionRate)** |
| 계보 사용 | 판매 보너스 = 추천계보 / 판권 달성 = 후원계보 | **후원계보(sponsor) 단일** — recommenderId는 @deprecated |
| 정산 | 화요일 수동 처리 | **자동정산 스케줄러 (SettlementSchedule + cron)** — 단, calculate/confirm/pay는 여전히 수동 (Stage 4 이슈) |
| 승급 조건 | PV 기반 (100만/15명/3팀 등) | **인원수 기반 (판매원 10명, 팀장 10명). SystemConfig로 "한시적 3명" 토글** |
| 수당률 관리 | CommissionRate + CommissionRateTier + CommissionQualification (구 6종 기반) | **ProductCommissionRate (productId + recipientGrade unique)**. 구 모듈은 유령 상태 (Stage 4 STAGE3-006) |

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보

| 항목          | 내용                                                             |
| ------------- | ---------------------------------------------------------------- |
| 프로젝트명    | (주)케이아이온 통합관리시스템                                     |
| 회사명        | (주)케이아이온                                                   |
| 프로젝트 목적 | 회원관리 · 제품관리 · 보상플랜(수당) 관리를 통합한 전산시스템 구축 |
| 브랜드 컬러   | **#E53935** (Material Red 600) — 실제 프론트엔드 하드코딩 기준. v1.0의 #7CB342는 Swagger topbar 1건 외 전량 폐기 |

### 1.2 핵심 기능 범위 (v2.0)

1. **회원관리**: 4단계 영업 등급 + ADMIN 계층 구조
2. **계보관리**: 후원계보(sponsorId) 단일 기반. 추천계보(recommenderId)는 @deprecated 유지만
3. **제품관리**: 카테고리 + PV + 제품별 수당율 매트릭스
4. **수당관리**: 2종 BonusType + 제품별 ProductCommissionRate 기반 자동 계산
5. **자동정산**: SettlementSchedule(DAILY/WEEKLY/MONTHLY) + settlement-scheduler.task.ts 크론
6. **인정매출/인정판권**: RecognizedSales 모델로 등급/판권 임시 효력 부여

---

## 2. 회원 등급 체계 (4단계 영업 + ADMIN)

Prisma enum (`schema.prisma` 363~369 line): `SALESPERSON | TEAM_LEADER | BRANCH_MANAGER | CENTER | ADMIN`

### 2.1 등급 정의

| 등급 | enum 값 | 자격 조건 | 수수료 분류 | 한글 표기 |
|------|--------|----------|----------|----------|
| 판매원 | `SALESPERSON` | 가입 시 기본 등급. **제품 1세트 판매 후** 수수료 자격 취득 (이미지 명시) | 판매 수수료 (SALES_COMMISSION) | 판매원 |
| 팀장 | `TEAM_LEADER` | 직속 후원 판매원 N명 소개 — 정상 10명, 한시적 3명 | 판매 수수료 (SALES_COMMISSION) | 팀장 |
| 지사장 | `BRANCH_MANAGER` | 직속 후원 팀장 N명 소개 — 정상 10명, 한시적 3명 | 교육 관리 (EDUCATION_MANAGEMENT) | 지사장 |
| 센터 | `CENTER` | 지역본부장으로 **관리자 수동 지정** (인원 조건 없음) | 교육 관리 (EDUCATION_MANAGEMENT) | 센터 |
| 관리자 | `ADMIN` | 시스템 관리자 지정 — **수당 대상 아님** | - | 관리자 |

### 2.2 등급 계층 (높은 순서)

`BonusCalculatorService.GRADE_ORDER` 상수:

```ts
const GRADE_ORDER: MemberGrade[] = [
  MemberGrade.ADMIN,           // 0 (가장 높음)
  MemberGrade.CENTER,          // 1
  MemberGrade.BRANCH_MANAGER,  // 2
  MemberGrade.TEAM_LEADER,     // 3
  MemberGrade.SALESPERSON,     // 4 (가장 낮음)
];
```

### 2.3 한시적 승급 조건 (DB 제어)

`SystemConfig` 테이블 key 3개로 런타임 제어. `PromotionService` 구현.

| SystemConfig.key | 설명 | 기본값 | 사용 위치 |
|-----------------|------|--------|----------|
| `PROMOTION_TEMPORARY_CONDITION_ACTIVE` | 한시적 조건 on/off (`'true'`/`'false'`) | `'false'` | `PromotionService.isTemporaryConditionActive()` |
| `SALESPERSON_TO_TEAM_LEADER_COUNT` | 판매원→팀장 승급 인원 (한시적일 때만 조회) | `'3'` | `PromotionService.getRequiredCount('SALESPERSON_TO_TEAM_LEADER')` |
| `TEAM_LEADER_TO_BRANCH_MANAGER_COUNT` | 팀장→지사장 승급 인원 (한시적일 때만 조회) | `'3'` | `PromotionService.getRequiredCount('TEAM_LEADER_TO_BRANCH_MANAGER')` |

- `PROMOTION_TEMPORARY_CONDITION_ACTIVE = false` → 강제로 10명 반환 (정상 조건)
- `PROMOTION_TEMPORARY_CONDITION_ACTIVE = true` → `SALESPERSON_TO_TEAM_LEADER_COUNT` / `TEAM_LEADER_TO_BRANCH_MANAGER_COUNT` 값 조회 (기본 3)
- BRANCH_MANAGER → CENTER, CENTER → ADMIN은 수동 지정이므로 SystemConfig 없음

### 2.4 계보 구조 (후원계보 단일 운영)

| 구분 | 필드 | 용도 | 운영 상태 |
|------|------|------|----------|
| 후원계보 | `Member.sponsorId` + `teamLine (1|2|3)` | **수당 계산 + 승급 조건** 모두 후원계보 기반 | ★ 실제 운영 |
| 추천계보 | `Member.recommenderId` | 구 체계에서 판매 보너스 분배 기준 | `@deprecated` — schema에만 존재, 런타임 미사용 |

`BonusCalculatorService.processSaleBonusesInTx()` line 227:

```ts
const upline = await this.genealogyService.getUpline(sale.sellerId, 100, 'sponsor');
```

두 번째 인자가 `'sponsor'`. v1.0 PRD의 "판매 보너스는 추천계보로 지급" 규정은 **폐기**.

> **주의** (Stage 1 발견 C1): 2026-04-15 이전 `BonusSimulatorService`는 `'recommender'`로 호출해 실제 계산기(Calculator)와 불일치했음. Stage 2.7에서 `'sponsor'`로 통일 완료.

---

## 3. 보너스 시스템 (2종 체계)

Prisma enum (`schema.prisma` 381~384 line): `BonusType = SALES_COMMISSION | EDUCATION_MANAGEMENT`

### 3.1 SALES_COMMISSION (판매 수수료)

| 항목 | 내용 |
|------|------|
| 대상 등급 | 판매원 (`SALESPERSON`) + 팀장 (`TEAM_LEADER`) |
| 트리거 | 실제 제품 판매 발생 시 (`Sale.isRecognizedSale = false`) |
| 계산 | `ProductCommissionRate.amount` (제품별 × 등급별 고정 금액) |
| 분배 | ① 판매자 본인에게 본인 등급 금액 + ② 후원계보 상위 라인의 TEAM_LEADER에게 TEAM_LEADER 금액 |
| amount = 0 케이스 | **Bonus row 생성 안 함** (`if (rate && rate.amount > 0)` 가드) |

### 3.2 EDUCATION_MANAGEMENT (교육 관리)

| 항목 | 내용 |
|------|------|
| 대상 등급 | 지사장 (`BRANCH_MANAGER`) + 센터 (`CENTER`) |
| 트리거 | 하위 라인의 실제 제품 판매 발생 시 |
| 계산 | `ProductCommissionRate.amount` (제품별 × 등급별 고정 금액) |
| 분배 | 판매자 후원계보 상위 라인의 BRANCH_MANAGER / CENTER에게 각각 해당 등급 금액 |
| 비고 | 판매자가 본인이 지사장/센터여도 본인이 받는 것이 아니라 **상위 라인에 지급**. 지사장/센터는 상위 라인 탐색 결과로만 수당 수령 |

### 3.3 Bonus 계산 흐름 (`BonusCalculatorService.processSaleBonusesInTx`)

```
Sale 생성 (isRecognizedSale=false)
  ↓
BonusCalculatorService.processSaleBonusesInTx(tx, saleId)
  ├─ weekCode = getWeekCode(sale.soldAt)              // "YYYY-Wnn"
  ├─ productId = sale.productId
  ├─ [1] 판매자 본인 수수료
  │   ├─ sale.seller.grade === ADMIN → skip
  │   ├─ rate = ProductCommissionRate[productId, seller.grade]
  │   ├─ if (rate && rate.amount > 0):
  │   │   ├─ bonusType = getBonusTypeForGrade(seller.grade)
  │   │   │   ├─ SALESPERSON | TEAM_LEADER → SALES_COMMISSION
  │   │   │   └─ BRANCH_MANAGER | CENTER   → EDUCATION_MANAGEMENT
  │   │   └─ Bonus.create({ memberId, saleId, bonusType, amount, weekCode, status: PENDING })
  │
  ├─ [2] 후원 상위 라인 탐색
  │   ├─ upline = genealogyService.getUpline(sellerId, 100, 'sponsor')
  │   └─ for ancestor in upline:
  │       ├─ ancestor.grade === ADMIN       → continue (skip)
  │       ├─ ancestor.grade === SALESPERSON → continue (상위 탐색이므로 판매원은 본인만)
  │       ├─ rate = ProductCommissionRate[productId, ancestor.grade]
  │       ├─ if (rate && rate.amount > 0):
  │       │   ├─ bonusType = getBonusTypeForGrade(ancestor.grade)
  │       │   └─ Bonus.create(...)
  │       └─ continue (상위로 계속)
  │
  └─ return bonuses[]
```

**핵심 가드 2건**:
1. `ADMIN` 상위는 항상 skip (관리자는 수당 미수령)
2. `SALESPERSON` 상위도 skip (상위 탐색 단계에서 판매원은 본인 수당만 받고 라인 수당은 받지 못함)

### 3.4 주차 코드 (weekCode)

`BonusCalculatorService.getWeekCode(date: Date): string`

```ts
const year = date.getFullYear();
const startOfYear = new Date(year, 0, 1);
const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
return `${year}-W${weekNumber.toString().padStart(2, '0')}`;  // "2026-W15"
```

> **주의** (Stage 4 STAGE3-012): 현재 시스템에 weekCode 포맷 3종이 독립 존재.
> - `Sale.weekCode`: 일부 경로 `"2026-04"` (월 포맷)
> - `Bonus.weekCode` / `Settlement.weekCode`: `"2026-W15"` (ISO 주차 유사)
> - 이 불일치는 정산 조인 시 결함 원인. Stage 4 STAGE3-012로 정상화 예정.

### 3.5 인정매출(RecognizedSale) 처리

`Sale.isRecognizedSale = true`인 경우 Bonus 계산에서 **완전히 제외**. (bonus-calculator.service.ts line 86)

```ts
if (sale.isRecognizedSale) {
  this.logger.log(`인정매출(ID: ${saleId}, ${sale.saleCode})은 보너스 계산에서 제외됩니다.`);
  return [];
}
```

즉, 인정매출은 판매 기록으로만 남고 수당은 발생하지 않음. 인정매출의 목적은 "등급 유지/승급 기록용 가짜 매출"이며, 실제 수당 흐름과는 분리됨.

> **알려진 이슈** (Stage 4 STAGE3-007): `sales.createRecognizedSale()`과 `recognized-sales.create()` 두 경로가 이중 구현되어 있음. 통합 검증 부재.

---

## 4. 제품별 수당 매트릭스 (★ 이미지 Source of Truth)

이미지 원본 기반 5×4 매트릭스. `ProductCommissionRate` 테이블 + `compensation-plan.controller.ts` 하드코딩 commissionTable(line 86~132)에 동일 반영.

### 4.1 금액 매트릭스

| 제품 | 카테고리 | 판매원 (SALES_COMMISSION) | 팀장 (SALES_COMMISSION) | 지사장 (EDUCATION_MANAGEMENT) | 센터 (EDUCATION_MANAGEMENT) | 판매가 |
|------|----------|--------------------------|------------------------|------------------------------|----------------------------|-------|
| 고주파(온 체) | 의료기기 | 500,000원 | 1,000,000원 | 200,000원 | 50,000원 | **3,300,000원** |
| 펄스온(저주파) | 의료기기 | 400,000원 | 800,000원 | 150,000원 | 50,000원 | 2,490,000원 |
| 제트5(초음파) | 의료기기 | 250,000원 | 500,000원 | 50,000원 | 50,000원 | 1,500,000원 |
| 통증 패치 | 소모품 | **0 (미지급)** | 20,000원 | 4,800원 | 2,400원 | 48,000원 |
| 전용젤 | 소모품 | **0 (미지급)** | 15,000원 | 3,000원 | 1,500원 | 30,000원 |

### 4.2 "미지급" 구현 방식

통증 패치/전용젤의 판매원 row는 **두 가지 중 하나**로 저장:
- ① `ProductCommissionRate.amount = 0` 로 row 존재 (정식 저장, "명시적 0" 케이스)
- ② Row 자체가 없음 (`findUnique()` 가 null 반환)

`BonusCalculatorService.processSaleBonusesInTx()`의 가드:

```ts
if (rate && rate.amount > 0) {
  // Bonus.create(...)
}
```

→ 두 케이스 모두 Bonus row 미생성. 즉 통증패치/전용젤을 판매원이 팔면 **본인 수당 0원**. 상위 라인(팀장/지사장/센터)에게만 수당 발생.

### 4.3 미해결 nuance (Stage 4 이관 2건)

이미지에는 있지만 현재 schema가 표현 못 하는 미묘한 차이 2건. Stage 4에서 처리.

#### nuance #1: 온 체 팀장 "100만원 / 지점 120만원"

- 이미지 원본: 온 체(고주파) 팀장 column에 "100만원 / 지점 120만원" 표기
- 현재 코드: 100만원 단일
- "지점"의 정확한 의미 미정:
  - 가설 A: 일반 팀장 100만원, "지점장 직속 팀장" 차등 120만원 (계층 차등)
  - 가설 B: 자가 판매 vs 라인 판매 차이
  - 가설 C: 지점(법인 사무실 보유) 팀장 차등
- **현재 처리**: 100만원 단일 유지. 사용자 도메인 지식 필요.
- **Stage 4 항목 ID**: `BONUS-NUANCE-001` (P2 Medium)
- **확장 방향** (결정 시): `ProductCommissionRate`에 `branchBonusAmount` 필드 추가 + 마이그레이션 + 데이터 백필 + 코드 분기 + UI 반영

#### nuance #2: 온 체 지사장 "20만원 (소계 5만)"

- 이미지 원본: 온 체 지사장 column에 "20만원 (소계 5만)" 표기
- 현재 코드: 지사장 20만원 + 센터 5만원 독립 row (합계 25만)
- 해석: "(소계 5만)"은 센터 5만원이 별도 존재함을 알리는 메모로 해석 (v2.0 공식 결정)
- **현재 처리**: 지사장 20만원 단일 row + 센터 5만원 단일 row. 변경 없음.
- 이유: 데이터 정확성 측면에서 지사장/센터 분리 유지가 명확. 합산은 표시 단계에서 가능.
- **Stage 4 항목 없음** (v2.0 확정 해석)

### 4.4 제품별 수당율 관리 UI

`/admin/commission-rates` (프론트엔드) → `/admin/product-commission-rates` API → `ProductCommissionRate` 테이블.

구 `commission-rates` 모듈(`CommissionRate` + `CommissionRateTier` + `CommissionQualification`)은 **유령 모듈**. UI 일부에서 여전히 참조되나 실제 수당 계산은 `ProductCommissionRate`만 사용. Stage 4 STAGE3-006에서 폐기 예정.

---

## 5. 자격 조건 (승급 로직)

`PromotionService` (`apps/backend/src/members/promotion.service.ts`) 구현.

### 5.1 승급 조건표

| 현재 등급 | 목표 등급 | 조건 | 정상 | 한시적 | SystemConfig key |
|----------|----------|------|------|------|------------------|
| SALESPERSON | TEAM_LEADER | 직속 후원 판매원 N명 달성 | 10 | 3 | `SALESPERSON_TO_TEAM_LEADER_COUNT` |
| TEAM_LEADER | BRANCH_MANAGER | 직속 후원 팀장 N명 달성 | 10 | 3 | `TEAM_LEADER_TO_BRANCH_MANAGER_COUNT` |
| BRANCH_MANAGER | CENTER | 관리자 수동 지정 | - | - | (없음) |
| CENTER | ADMIN | 시스템 관리자 수동 | - | - | (없음) |

**"직속 후원"의 정의**: `Member.sponsorId = targetMemberId` 직계 (depth 1). 다단 후원은 집계에 포함하지 않음.

### 5.2 판매원 → 수당 자격 취득 (이미지 명시)

- 이미지 원본: "판매원 → 제품 1세트 판매 후 수수료 자격 취득"
- 현재 코드: **체크 로직 없음**. `BonusCalculatorService`는 판매 발생 즉시 판매원에게 수당 계산.
- **Stage 4 항목 등록**: `BONUS-QUALIFY-001` (P2 Medium, GAP-001로 개정 가능) — "첫 판매 이전 상태에서 수당 지급 가능 여부" 확정 필요.

### 5.3 승급 트리거 포인트

| 트리거 | 위치 | 설명 |
|-------|------|------|
| 판매 발생 시 | `SalesService.createSale()` → `PromotionService.checkPromotionEligibility(sponsorId)` | 하위 판매가 발생하면 상위 후원자의 승급 조건 재평가 |
| 수동 호출 | `POST /api/admin/members/:id/check-promotion` | 관리자가 수동으로 승급 조건 재계산 |
| 크론 배치 | 미구현 | 승급 조건 주기적 스윕은 현재 부재 (Stage 4 후보) |

---

## 6. 정산 시스템 (자동정산)

### 6.1 주요 모델

- `Settlement` (정산 단위, weekCode unique)
- `SettlementSchedule` (자동정산 스케줄, cycleType 기반)
- `SettlementStatus` enum: `OPEN | CALCULATING | CALCULATED | CONFIRMED | PAID | CLOSED`

### 6.2 정산 주기 (SettlementSchedule)

`SettlementCycleType` enum: `DAILY | WEEKLY | MONTHLY`

| 필드 | 설명 | WEEKLY 예시 | MONTHLY 예시 |
|------|------|-------------|-------------|
| `cycleType` | 주기 타입 | `WEEKLY` | `MONTHLY` |
| `dayOfWeek` | 0-6 (일-토) | 3 (수요일) | null |
| `dayOfMonth` | 1-31 | null | 15 |
| `hour` | 0-23 | 2 (새벽 2시) | 9 |
| `minute` | 0-59 | 0 | 0 |
| `isActive` | 활성 여부 | true | true |
| `lastRunAt` | 마지막 실행 시각 | - | - |
| `nextRunAt` | 다음 실행 예정 | - | - |

> 시스템에 하나의 `isActive=true` 스케줄만 활성화 가능 (schema 주석).

### 6.3 정산 상태 머신

```
OPEN  (신규 생성, 판매 수집 중)
  ↓  SettlementsService.calculate(id)
CALCULATING  (계산 진행 중, transient)
  ↓
CALCULATED  (Bonus 집계 완료, 검토 대기)
  ↓  SettlementsService.confirm(id)
CONFIRMED  (확정, 수정 불가)
  ↓  SettlementsService.pay(id)
PAID  (지급 완료, 개별 Bonus도 PAID로 전파)
  ↓  (선택)
CLOSED  (마감)
```

### 6.4 자동정산 흐름

```
settlement-scheduler.task.ts @Cron('0 * * * * *')   // 매분
  ↓
SettlementScheduleService.getActiveSchedule()
  → isActive = true 인 row 조회
  → nextRunAt <= now 조건 확인
  ↓
SettlementsService.createAutoSettlement(schedule)
  → 새 Settlement(status=OPEN) 생성 (해당 weekCode)
  → SettlementSchedule.lastRunAt = now
  → SettlementSchedule.nextRunAt = 다음 주기 계산
  ↓
(수동 또는 별도 트리거로) SettlementsService.calculate(settlementId)
  → 해당 weekCode의 Bonus 집계
  → Settlement.status = CALCULATED
  → Settlement.totalBonuses, totalSales, totalPv 채움
  ↓
SettlementsService.confirm(settlementId)
  → Settlement.status = CONFIRMED
  → Bonus.status 전파 CONFIRMED
  ↓
SettlementsService.pay(settlementId)
  → Settlement.status = PAID
  → Bonus.status 전파 PAID
```

### 6.5 알려진 이슈 (Stage 4 처리 예정)

| 이슈 ID | 심각도 | 설명 |
|--------|-------|------|
| `STAGE3-004` | P0 Critical | 자동정산 크론이 `OPEN` 껍데기만 생성하고 calculate/confirm/pay는 수동. 완전 자동화 미구현 |
| `STAGE3-005` | P0 Critical | `Bonus.settlementId` FK 미연결 — Bonus를 Settlement로 조인할 때 `weekCode` 문자열 매칭만 사용 |
| `STAGE3-012` | P1 High | weekCode 포맷 3종 독립 (Sale `"2026-04"` vs Bonus/Settlement `"2026-W15"`) → 크로스 조인 실패 |

---

## 7. 인정매출 / 인정판권 (RecognizedSales)

### 7.1 목적

실제 판매가 없더라도 특정 효력(등급/판권)을 임시로 부여하여, 보너스 계산이나 승급 평가에서 해당 등급으로 취급받도록 하는 메커니즘.

### 7.2 RecognitionType

`schema.prisma` 429~432:

| enum | 의미 | 사용 |
|------|------|------|
| `GRADE` | 등급 인정 | 대상 회원을 보너스 계산/조회 시 `recognizedGrade`로 취급 |
| `LICENSE` | 판권 인정 | 특정 제품 판권 효력 — 현재 미활성화, 미래 확장 |

### 7.3 RecognizedSalesStatus

| enum | 의미 |
|------|------|
| `ACTIVE` | 활성화. `startDate ≤ now ≤ endDate` (또는 `endDate == null`)인 동안 효력 |
| `EXPIRED` | 만료. `endDate` 경과 시 배치로 전환 |
| `CANCELLED` | 관리자가 수동 취소. `deactivatedAt`/`deactivatedBy` 기록 |

### 7.4 핵심 메서드

`RecognizedSalesService.getEffectiveGrade(memberId: number): Promise<MemberGrade>` (recognized-sales.service.ts line 346)

```ts
const member = await prisma.member.findUnique({ where: { id: memberId }, select: { grade: true } });
const recognition = await getActiveRecognition(memberId);
if (!recognition) return member.grade;

const actualIndex = GRADE_ORDER.indexOf(member.grade);
const recognizedIndex = GRADE_ORDER.indexOf(recognition.recognizedGrade);
return recognizedIndex < actualIndex ? recognition.recognizedGrade : member.grade;
```

→ 실제 등급과 인정 등급 중 **더 높은 쪽** 반환.

### 7.5 현재 운영상 중요한 갭 (★)

**현재 `BonusCalculatorService`는 `getEffectiveGrade()`를 호출하지 않음**. 대신 `sale.seller.grade` (DB에 저장된 실제 등급)를 직접 사용.

→ 즉, 현재 시점에서 인정매출/인정판권은 **수당 계산에 영향을 주지 않음**. 단지 "해당 회원이 이 등급으로 인정되었다"는 기록용. Stage 4에서 `BonusCalculatorService`가 `getEffectiveGrade()`를 경유하도록 통합 가능성 있음 — 현재는 미연결.

### 7.6 `Sale.isRecognizedSale` vs `RecognizedSales` 모델의 관계

| 구분 | `Sale.isRecognizedSale=true` | `RecognizedSales` 테이블 |
|------|------------------------------|-------------------------|
| 저장 위치 | `sales` 테이블의 boolean 필드 | 독립 `recognized_sales` 테이블 |
| 효과 | 수당 계산에서 제외 (bonus-calculator line 86) | `getEffectiveGrade()` 반환 변경 (단, 계산기에서는 미호출) |
| 생성 경로 | `SalesService.createRecognizedSale()` | `RecognizedSalesService.create()` |
| 감사 | `Sale.recognizedBy`, `recognizedAt`, `recognizedGrade` | `RecognizedSales.createdBy`, `deactivatedBy` 등 |

**두 경로의 이중성**은 Stage 4 `STAGE3-007`에서 정합화 예정.

---

## 8. 시스템 설정 (SystemConfig)

런타임 동적 변경 가능한 설정 저장소. `SystemConfig` 테이블 (`key` unique).

### 8.1 보상플랜 관련 주요 key

| key | 기본값 | 용도 | 담당 모듈 |
|-----|-------|------|----------|
| `PROMOTION_TEMPORARY_CONDITION_ACTIVE` | `'false'` | 한시적 승급 조건 on/off | `PromotionService` |
| `SALESPERSON_TO_TEAM_LEADER_COUNT` | `'3'` | 판매원→팀장 한시적 인원 | `PromotionService` |
| `TEAM_LEADER_TO_BRANCH_MANAGER_COUNT` | `'3'` | 팀장→지사장 한시적 인원 | `PromotionService` |

(기타 확장 key는 운영 중 추가 가능. 현재 보상플랜에 직접 관여하는 key는 위 3종.)

### 8.2 SystemConfig 변경 경로

- `/admin/system-settings` UI → `/api/admin/system-config` API → `SystemConfig` upsert
- 관리자만 접근 가능 (가드 필요 — 현재 부분 적용, Stage 4 STAGE3-001 항목에 포함)

---

## 9. 데이터 모델 (Prisma schema 핵심)

이하 모델은 `apps/backend/prisma/schema.prisma` 현재 버전 기준. 보상플랜에 직접 관여하는 10개 모델만 기술.

### 9.1 Member (members)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 회원 고유 ID |
| `username` | String (unique) | 로그인 ID |
| `email` | String? | 이메일 |
| `password` | String | 해시 (bcrypt) |
| `name` | String | 실명 |
| `phone` | String? | 연락처 |
| `birthDate` | DateTime? | 생년월일 |
| `grade` | MemberGrade (default SALESPERSON) | 4단계 + ADMIN |
| `recommenderId` | Int? | 추천인 ID (★ `@deprecated` — 런타임 미사용) |
| `sponsorId` | Int? | **후원인 ID (★ 계보 핵심)** |
| `teamLine` | Int? (1/2/3) | 팀라인 번호. DB CHECK 제약조건 있음 |
| `cumulativePv` | Int (default 0) | 누적 PV |
| `agentPromotedAt` | DateTime? | 등급 승급 시각 (레거시 이름) |
| `bankName` / `accountNumber` / `accountHolder` | String? | 지급 계좌 정보 |
| `centerName` | String? | 센터명 (센터 등급 전용) |
| `isActive` | Boolean (default true) | 활성 여부 |
| `emailVerified` | Boolean (default false) | 이메일 인증 |
| `createdAt` / `updatedAt` / `deletedAt` | DateTime | 감사 타임스탬프 |

주요 관계: `bonuses[]`, `sales[]`, `recognizedSales[]`, `hostedSeminars[]`, `confirmedSettlements[]`, `recognizedSalesRecords[]`, `cultivatedMembers[]`, `cultivatedBy[]`

주요 인덱스: `[grade]`, `[sponsorId]`, `[sponsorId, teamLine]`, `[grade, createdAt]`

### 9.2 Sale (sales)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | 판매 ID |
| `saleCode` | String (unique) | 판매 코드 |
| `sellerId` | Int (FK Member) | 판매자 |
| `productId` | Int (FK Product) | 제품 |
| `quantity` | Int (default 1) | 수량 |
| `unitPrice` / `totalPrice` | Int | 단가 / 총 금액 |
| `unitPv` / `totalPv` | Int | 단위 PV / 총 PV |
| `soldAt` | DateTime | 판매 일시 |
| `weekCode` | String | 주차 코드 (포맷 불일치 이슈 — §3.4) |
| `status` | SaleStatus (PENDING/CONFIRMED/SETTLED/CANCELLED) | 상태 |
| `settlementId` | Int? (FK Settlement) | 소속 정산 |
| **인정매출** | | |
| `isRecognizedSale` | Boolean (default false) | 인정매출 플래그 |
| `recognizedGrade` | MemberGrade? | 인정 등급 |
| `recognizedBy` | Int? (FK Member) | 인정 처리자 |
| `recognizedAt` | DateTime? | 인정 처리 시각 |
| `description` | String? | 메모 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

주요 관계: `bonuses[]`, `product`, `seller`, `settlement?`, `recognizer?`

주요 인덱스: `[sellerId]`, `[weekCode]`, `[sellerId, weekCode]`, `[weekCode, status]`, `[isRecognizedSale]`

### 9.3 Bonus (bonuses)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | 보너스 ID |
| `memberId` | Int (FK Member) | 수령자 |
| `saleId` | Int? (FK Sale) | 관련 판매 (nullable — 향후 세미나 보너스 등 대비) |
| `seminarId` | Int? (FK Seminar) | 관련 세미나 (현재 미사용) |
| `bonusType` | BonusType | `SALES_COMMISSION` or `EDUCATION_MANAGEMENT` |
| `amount` | Int | 금액 (원) |
| `description` | String? | 설명 텍스트 |
| `calculationBasis` | String? | 계산 근거 JSON (productId, productCode, sellerGrade 등) |
| `weekCode` | String | 주차 코드 |
| `settlementId` | Int? (FK Settlement) | 소속 정산 (★ 실제 FK 연결 부족 — §6.5 STAGE3-005) |
| `status` | BonusStatus (PENDING/CONFIRMED/PAID/CANCELLED) | 상태 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

주요 인덱스: `[memberId]`, `[weekCode]`, `[bonusType]`, `[status]`, `[memberId, weekCode]`

### 9.4 Settlement (settlements)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | 정산 ID |
| `weekCode` | String (unique) | 주차 코드 |
| `startDate` / `endDate` | Date | 정산 기간 |
| `totalSales` | Int (default 0) | 총 판매액 |
| `totalPv` | Int (default 0) | 총 PV |
| `totalBonuses` | Int (default 0) | 총 보너스 금액 |
| `status` | SettlementStatus | OPEN / CALCULATING / CALCULATED / CONFIRMED / PAID / CLOSED |
| `calculatedAt` / `confirmedAt` / `paidAt` | DateTime? | 각 단계 전환 시각 |
| `confirmedBy` | Int? (FK Member) | 확정자 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

주요 관계: `bonuses[]`, `sales[]`, `confirmer`

### 9.5 ProductCommissionRate (product_commission_rates)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | 수당율 row ID |
| `productId` | Int (FK Product) | 제품 |
| `recipientGrade` | MemberGrade | 수령 등급 |
| `amount` | Int | 고정 금액 (원). 0 저장 가능 (§4.2 미지급 케이스) |
| `isActive` | Boolean (default true) | 활성 여부 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

**unique constraint**: `[productId, recipientGrade]` — 한 제품/등급 조합당 1개 row.

주요 인덱스: `[productId]`, `[recipientGrade]`, `[isActive]`

### 9.6 RecognizedSales (recognized_sales)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | - |
| `memberId` | Int (FK Member) | 대상 회원 |
| `recognizedGrade` | MemberGrade | 인정 등급 |
| `recognitionType` | RecognitionType (default GRADE) | GRADE / LICENSE |
| `status` | RecognizedSalesStatus (default ACTIVE) | ACTIVE / EXPIRED / CANCELLED |
| `reason` | String? | 사유 |
| `startDate` / `endDate` | Date | 효력 기간 (endDate null = 무기한) |
| `createdBy` | Int (FK Member) | 생성자 (관리자) |
| `createdAt` / `updatedAt` / `deactivatedAt` | DateTime | 감사 |
| `deactivatedBy` | Int? (FK Member) | 비활성화 처리자 |

**unique constraint**: `[memberId, recognizedGrade, recognitionType, status]` — 동일 회원/등급/타입/상태 중복 방지.

주요 인덱스: `[memberId]`, `[status]`, `[recognitionType]`, `[startDate, endDate]`

### 9.7 Seminar (seminars)

구 체계의 "지점 운영 보너스"는 폐기되었지만 `Seminar` 모델 자체는 schema에 존속. 향후 EDUCATION_MANAGEMENT 하위로 세미나 보상 확장 가능성 보유.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | - |
| `hostId` | Int (FK Member) | 주최자 |
| `title` / `description` / `location` | String | 세미나 정보 |
| `hasOffice` / `hasEquipment` | Boolean | 사무실/장비 보유 |
| `participantsCount` | Int (default 0) | 참석자 수 |
| `heldAt` | DateTime | 개최 일시 |
| `isApproved` / `approvedAt` | Boolean / DateTime? | 승인 여부 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

관계: `host`, `bonuses[]` (seminarId를 가진 Bonus들 — 현재 사용처 없음)

### 9.8 SettlementSchedule (settlement_schedules)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | - |
| `name` | String | 스케줄 이름 |
| `cycleType` | SettlementCycleType | DAILY / WEEKLY / MONTHLY |
| `dayOfWeek` | Int? | 0-6 (일-토, WEEKLY 시) |
| `dayOfMonth` | Int? | 1-31 (MONTHLY 시) |
| `hour` / `minute` | Int | 실행 시각 |
| `isActive` | Boolean (default true) | 활성 여부 (시스템에 1개만 권장) |
| `lastRunAt` / `nextRunAt` | DateTime? | 실행 추적 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

### 9.9 CultivationRecord (cultivation_records)

승급 조건(판매원 N명, 팀장 N명 육성) 평가의 보조 기록. 누가 누구를 어떤 등급까지 육성했는지의 이력.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | - |
| `cultivatorId` | Int (FK Member) | 육성자 (상위) |
| `cultivatedMemberId` | Int (FK Member) | 피육성자 (하위) |
| `achievedGrade` | MemberGrade | 달성한 등급 |
| `treeType` | TreeType (RECOMMENDER / SPONSOR) | 어느 계보의 육성인지 |
| `qualificationCount` | Int (default 1) | 조건에 카운트될 수 |
| `achievedAt` | DateTime | 달성 시각 |
| `teamNumber` | Int? | 팀 라인 번호 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

**unique constraint**: `[cultivatorId, cultivatedMemberId, achievedGrade, treeType]`

### 9.10 SystemConfig (system_configs)

§8 참조. 한시적 승급 등 런타임 설정 저장.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | - |
| `key` | String (unique) | 설정 키 |
| `value` | String (Text) | 설정 값 (문자열로 저장, 파싱은 호출자 책임) |
| `description` | String? | 설명 |
| `createdAt` / `updatedAt` | DateTime | 감사 |

---

## 10. 폐기된 v1.0 개념 (참고용)

v1.0 `commission-prd.md`에서 정의되었으나 v2.0에서 폐기된 개념. 구 코드/문서 잔재를 찾을 때 참고.

| 폐기 항목 | v1.0 정의 요약 | 폐기 사유 / v2.0 대응 |
|----------|--------------|---------------------|
| **SALES 판매 보너스 50만원** | 판매자 25만 + 추천 상위 에이전트 25만 | 제품별 매트릭스로 교체. 온 체의 경우 판매원 50만 / 팀장 100만 / 지사장 20만 / 센터 5만 → 단일 판매당 최대 175만원 지급. |
| **SALES_MGMT 판매 관리 보너스 15만원** | 직접 추천인에게 고정 지급 | v2.0 BonusType에 부재. 제품별 매트릭스에 흡수됨 (관리 수당 개념은 EDUCATION_MANAGEMENT로 재정의). |
| **LICENSE 판권 보너스 (매니저 10만, 지부장 18만, 본부장 24만)** | 직접 판매 시 등급별 판권 보너스 추가 지급 | v2.0 BonusType에 부재. 제품별 × 등급별 매트릭스에 단일 체계로 통합. |
| **LICENSE_MGMT 판권 관리 보너스 (3만~5만)** | 동급 상위자 판매 시 지급 | v2.0 BonusType에 부재. "동급 상위자" 개념 자체가 폐기. |
| **SHARING 공유 보너스 (지부장/본부장 각 2만, 중복 지급)** | 라인 상위 지부장/본부장 전원에 중복 지급 | v2.0 BonusType에 부재. `RecognizedSales`의 `RecognitionType.GRADE`가 이전 SHARING 역할을 일부 대체. |
| **BRANCH_OPERATION 지점 운영 보너스 (매니저 이상 5만, 세미나 진행)** | 사무실 + 장비 + 세미나 진행 조건 | v2.0 BonusType에 부재. `Seminar` 모델은 schema에 존속 but 보너스 연결 없음. 미래 확장 여지. |
| **5단계 등급 체계 (MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF)** | 5단계 + ADMIN | **4단계 영업 + ADMIN**으로 축소. AGENT는 SALESPERSON에 흡수, MANAGER→TEAM_LEADER, BRANCH_CHIEF+DIVISION_CHIEF→BRANCH_MANAGER, CENTER 신설. |
| **이중 계보 (추천계보 + 후원계보)** | 추천계보 = 수당, 후원계보 = 승급 | **후원계보 단일**. `recommenderId`는 `@deprecated` — schema에 존재만 함. |
| **PV 기반 승급 (에이전트 100만 PV)** | 누적 100만 PV 이상 에이전트 승급 | v2.0은 **인원수 기반 승급** (10명 소개). PV는 `cumulativePv` 필드로 schema에 존속 but 승급 조건에서 제거. |
| **매니저 3팀 + 15명 육성 / 지부장 3팀 각 1명 매니저 + 4명 / 본부장 3팀 각 1명 지부장 + 5명** | 구 분산 조건 | 단순 인원 조건(10명 / 한시적 3명)으로 교체. `CultivationRecord`는 감사용으로 존속. |
| **정산: 일~월 마감, 화요일 계산, 수요일 지급** | 주간 고정 스케줄 | **SettlementSchedule로 동적 관리** (DAILY/WEEKLY/MONTHLY). 주기/시각을 DB 값으로 제어. |
| **BR-03 판매 보너스 25만+25만 분배 규칙** | 판매자 25만, 상위 에이전트 25만 | 제품별 매트릭스로 완전 교체. |
| **BR-05 공유 보너스 중복 지급** | 라인 상위 모든 지부장/본부장에 중복 | v2.0에서 정당한 "중복 지급"은 후원 라인 상위의 **각 등급별 1회씩 지급** (BRANCH_MANAGER 1명 + CENTER 1명)이며, 동일 등급이 라인에 여러 명 있어도 `processSaleBonusesInTx` 루프로 각각 수당 발생. 의미 자체는 남아 있으나 BonusType은 EDUCATION_MANAGEMENT로 통합. |

### 10.1 v1.0 문서 구조 vs v2.0 섹션 대응

| v1.0 섹션 | v2.0 섹션 | 변경 요약 |
|-----------|----------|----------|
| §1 프로젝트 개요 | §1 | 브랜드 컬러 #7CB342 → #E53935 |
| §2 회원 등급 체계 (5단계) | §2 (4단계 + ADMIN) | 재작성 |
| §3 보너스 시스템 (6종) | §3 (2종) + §4 (매트릭스) | 완전 교체 |
| §4 보너스 정산 | §6 자동정산 | SettlementSchedule 반영 |
| §5 데이터베이스 설계 (MySQL ENUM) | §9 Prisma 모델 | Postgres + Prisma schema로 재작성 |
| §6 기능 명세 | (생략, 세부 기능은 각 팀 README와 `prd.md`로 위임) | - |
| §7 화면 설계 | (생략, 화면은 `prd.md` 및 디자인팀 문서) | - |
| §8 기술 요구사항 | §3.3 계산 흐름 + §6 정산 | 통합 |
| §9 비즈니스 규칙 | §10 폐기 항목 (구 규칙) + §3/§5 (신 규칙) | 교체 |
| §10 개발 일정 | (생략) | Stage 4 Task Master에서 관리 |
| §11 체크리스트 | `prd2/` 폴더로 이관 | Stage 3 산출물 |

---

## 부록 A. 주요 파일 위치

### 백엔드 (수당 관련)

- **계산 엔진**: `apps/backend/src/compensation-plan/services/bonus-calculator.service.ts`
- **시뮬레이터**: `apps/backend/src/compensation-plan/services/bonus-simulator.service.ts` (★ Stage 2.7에서 `sponsor` 전환)
- **수당율 API**: `apps/backend/src/products/product-commission-rates.{service,controller}.ts`
- **보너스 조회**: `apps/backend/src/bonuses/bonuses.{service,controller}.ts`
- **정산 상태머신**: `apps/backend/src/settlements/settlements.service.ts`
- **정산 스케줄**: `apps/backend/src/settlements/settlement-schedule.service.ts`
- **자동정산 크론**: `apps/backend/src/tasks/settlement-scheduler.task.ts`
- **승급 평가**: `apps/backend/src/members/promotion.service.ts`
- **후원 라인 탐색**: `apps/backend/src/members/genealogy.service.ts` + `genealogy-raw-queries.ts` (★ raw SQL — 리팩터 금지)
- **인정매출**: `apps/backend/src/recognized-sales/recognized-sales.service.ts`
- **판매 진입점**: `apps/backend/src/sales/sales.service.ts`
- **Prisma schema**: `apps/backend/prisma/schema.prisma`

### 프론트엔드 (수당 화면)

- `/admin/sales`, `/admin/sales/stats`
- `/admin/bonuses`, `/admin/bonuses/history`
- `/admin/bonus-simulator` (★ 매트릭스 검증 도구)
- `/admin/commission-rates`
- `/admin/compensation-plan`
- `/admin/settlements`
- 사용자측: `/sales`, `/bonuses`, `/commissions`, `/organization`

### 레거시 잔재 (Stage 4 폐기 대상)

- `apps/backend/src/commission-rates/` 전체 모듈 (CommissionRate/Tier/Qualification — 유령 상태)
- `apps/backend/src/bonuses/bonus-calculator.service.ts.legacy-old-system` (.bak에서 rename 완료)
- `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.legacy-old-system` (.bak에서 rename 완료)
- `apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak` (★ enum rename 후 복원 예정 — Stage 4 BAK-RESTORE-001)
- `apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak` (★ enum rename 후 복원 예정)

---

## 부록 B. Stage 4 대기 항목 (보상플랜 관련)

본 PRD 재작성 시점에 남아 있는 보상플랜 관련 Stage 4 이슈. 상세는 `prd2/{팀}_검증체크리스트.md` 참조.

| ID | 우선순위 | 영역 | 설명 |
|----|---------|------|------|
| STAGE3-003 | P0 Critical | seed | `seed-commission-rates.ts`가 구 enum 참조 → 컴파일 불가 |
| STAGE3-004 | P0 Critical | 정산 | 자동정산 크론이 OPEN 껍데기만 생성, calculate/confirm/pay 수동 |
| STAGE3-005 | P0 Critical | 정산 | `Bonus.settlementId` FK 미연결, weekCode 문자열 매칭만 |
| STAGE3-006 | P1 High | commission-rates | 구 6종 enum 참조 유령 모듈 → 런타임 실패 가능 |
| STAGE3-007 | P1 High | 인정매출 | sales.createRecognizedSale vs recognized-sales.create 이중 구현 |
| STAGE3-012 | P1 High | weekCode | 포맷 3종 독립 (Sale/Bonus/Settlement) |
| BONUS-NUANCE-001 | P2 Medium | 매트릭스 | "지점 120만" 의미 확정 + schema 확장 (§4.3) |
| BONUS-QUALIFY-001 | P2 Medium | 자격 | 판매원 첫 판매 이전 수당 지급 가능 여부 확정 (§5.2) |
| BONUS-PRICE-001 | P1 High | 시드 | `20260120_grade_restructure` migration의 온 체 판매가 286만 → 330만 정정 마이그레이션 추가 |
| BAK-RESTORE-001 | P1 High | 테스트 | `recognized-sales.*.spec.ts.bak` 2개 enum rename 후 복원 |
| BONUS-BRAND-001 | P3 Low | 브랜드 | Swagger topbar `#7CB342` → `#E53935` 정렬 |
| STAGE3-008 | P1 High | 프론트 | 프론트엔드 구 6종 보너스 잔재 5+ 곳 (admin/compensation-plan 등) |
| STAGE3-014 | P0 Critical | 테스트 | 테스트 커버리지 0건 |

---

_— 문서 끝 —_

**작성**: 기획설계팀 (PM팀 강민호 주관) | **검토 대상**: 강민호, 박준혁, 정대훈, 유진호
**v1.0 → v2.0 전면 재작성 사유**: 구 6종 보너스 체계 → 신 2종 체계 전환 (`b6ca264 자동정산기능`, `420e7a4 수당률수정` 커밋이 분기점). 이미지 + 현재 schema를 source of truth로 확정.
