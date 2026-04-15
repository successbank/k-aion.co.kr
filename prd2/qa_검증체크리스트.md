# QA팀 검증 체크리스트 (Stage 4 작업)

> **목적**: Stage 1 분석 결과(테스트 커버리지 0% + Critical 4건) + Stage 2 미완 항목을 Stage 4 사이클로 처리
> **합격 기준 (Stage 4)**: 자동 테스트 + 수동 스크린샷/로그 + 코드 diff **3가지 모두**
> **시도 횟수**: 각 항목 최대 3회 (3회 실패 시 강민호 에스컬레이션)
> **증거 위치**: `/data/successbank/projects/kaion/prd2/evidence/qa/{항목ID}/`
> **팀 정체성**: 테스트 커버리지 / 검증 자산 / 품질 게이트 (15명)
> **기준 분석 문서**: `prd/qa_파악된내용.md` §3 (Critical 4건 + High 5건 + Medium 3건)

---

## 우선순위 매트릭스

| 항목 ID | 분류 | 우선순위 | 영향도 | 난이도 | 의존 | 담당 페르소나 |
|---------|------|---------|--------|--------|------|------------|
| QA-001 | 미개발 (매트릭스 20 케이스) | P0 Critical | High | Medium | - | 이미영 (기능) |
| QA-002 | 미개발 (자동정산 크론 테스트) | P0 Critical | High | High | DEV2-002 | 한상우 (통합) + 최서연 |
| QA-003 | 미개발 (BonusCalculator) | P0 Critical | High | Medium | - | 이미영 + 박진우 |
| QA-004 | 미개발 (PromotionService 경계값) | P0 Critical | High | Medium | - | 이미영 |
| QA-005 | 미개발 (members 14 endpoint) | P1 High | High | Medium | DEV1-004 | 정유진 (API) |
| QA-006 | 미개발 (.bak 복원 29 케이스) | P1 High | Medium | Low | DEV2-014 | 최서연 (회귀) |
| QA-007 | 미개발 (수당 체인 통합) | P1 High | High | High | QA-003 | 한상우 |
| QA-008 | 미개발 (admin E2E Playwright) | P1 High | Medium | High | - | 오태준 + 임채영 |
| QA-009 | 미개발 (genealogy 부하) | P2 Medium | Medium | High | DEV1-005 | 김동현 (성능) |
| QA-010 | 미개발 (보안 RBAC 회귀) | P2 Medium | High | Medium | DEV1-004 | 최민규 + 강수민 |
| QA-011 | 오류 (CI jest 설정) | P2 Medium | Low | Low | DEV3-007 | 윤성재 (자동화) |
| QA-012 | 미개발 (coverage threshold) | P2 Medium | Low | Low | - | 윤성재 |
| QA-013 | 미개발 (격리 DB) | P2 Medium | Medium | Medium | - | 송지현 (환경) |
| QA-014 | 미개발 (PromotionService 다단계) | P3 Low | Low | Low | - | 이미영 |

---

## 의존 그래프

```
[DEV2-002 자동정산 실 구현]───>[QA-002 크론 테스트]
[DEV2-014 .bak 복원]──────────>[QA-006 29 케이스 실행]
[DEV1-004 JWT 가드 실구현]───>[QA-005 members endpoint 계약 테스트]
                               └──>[QA-010 보안 RBAC 회귀]
[DEV3-006 supertest 설치]────>[QA-005/007/008 supertest 기반 테스트]
[DEV3-007 jest rootDir]──────>[QA-011 CI jest 설정]
[DEV1-005 genealogy raw CTE]─>[QA-009 부하 테스트 baseline]
[QA-003 BonusCalculator spec]─>[QA-007 수당 체인 통합]
```

---

## 🔴 미개발 항목 (Critical — 돈 흐름 직결)

- [ ] **[QA-001]** [P0 Critical] ProductCommissionRate 매트릭스 20 케이스 spec (TC-PCR-01~20)
  - **현상**: 5제품 × 4등급 매트릭스 금액 자동 검증 부재. bonus-simulator를 사용한 Stage 2.1 수동 검증만 존재.
  - **근거**: `prd/qa_파악된내용.md` §3 [H-QA-09] + §4.2 TC-PCR 20 케이스 / 요청.md STAGE3-014
  - **검증 방법**:
    - 자동: `pnpm test product-commission-rate.spec.ts` → 20 케이스 Pass
    - 수동: jest 실행 결과 표 + DB 직접 조회 (`SELECT * FROM product_commission_rates ORDER BY product_id, recipient_grade`) 대조
  - **Pass 기준**:
    - 20 케이스 전부 Pass
    - 고주파/펄스온/제트5/통증패치/전용젤 × SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER
    - 통증패치/전용젤 × SALESPERSON은 0원 또는 row 부재 검증
    - 판매가 대비 총 수당 합계 ≤ 판매가 검증 (TC-TOTAL-01~05)
  - **증거 파일**:
    - `prd2/evidence/qa/QA-001/test-result.log`
    - `prd2/evidence/qa/QA-001/manual.md` (20 케이스 Pass/Fail 표)
    - `prd2/evidence/qa/QA-001/diff.patch`
  - **담당 페르소나**: 이미영 (기능) + 박진우 (요구사항)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-002]** [P0 Critical] 자동정산 크론 단위 + 통합 spec
  - **현상**: `settlement-scheduler.task.ts` 활성 spec 0건. 최근 commit `b6ca264 자동정산기능` 이후 단위/통합 검증 전무. 돈 손실 직결.
  - **근거**: `prd/qa_파악된내용.md` §3 [C-QA-01] / 요청.md STAGE3-004
  - **검증 방법**:
    - 자동:
      - `settlement-scheduler.task.spec.ts` (cron tick 시뮬레이션 + createAutoSettlement 호출 검증)
      - `settlements.service.spec.ts` (calculate/confirm/pay 라이프사이클)
      - `settlement-schedule.service.spec.ts` (DAILY/WEEKLY/MONTHLY 스케줄 + nextRunAt 계산)
    - 수동: Jest fake timer로 1분 경과 후 createAutoSettlement 호출 확인
  - **Pass 기준**:
    - 최소 20 케이스 spec
    - 경계값: 주말 스킵, 월말 처리, weekCode 전환, overlap 방지
    - 실패 시 Slack 알림 발송 검증 (mock)
  - **증거 파일**:
    - `prd2/evidence/qa/QA-002/test-result.log`
    - `prd2/evidence/qa/QA-002/manual.md`
    - `prd2/evidence/qa/QA-002/diff.patch`
  - **담당 페르소나**: 한상우 (통합) + 최서연 (회귀) + 김성진 (개발2팀 배치 협업)
  - **선행 의존**: DEV2-002 (자동정산 실제 동작 구현)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-003]** [P0 Critical] BonusCalculatorService 현행 2종 체계 spec
  - **현상**: `compensation-plan/services/bonus-calculator.service.ts` 407줄 — 수당 체인 계산 엔진의 단위/통합 테스트 전무. Stage 2.8 완료 후 회귀 위험 극대.
  - **근거**: `prd/qa_파악된내용.md` §3 [C-QA-02]
  - **검증 방법**:
    - 자동: `bonus-calculator.service.spec.ts`
    - 수동: 매 commit 후 실행 보존
  - **Pass 기준**:
    - 최소 15 케이스:
      - `processSaleBonusesInTx` 본인 + 상위 4단계 전파
      - `getBonusTypeForGrade` (SALESPERSON/TEAM_LEADER → SALES_COMMISSION, BRANCH_MANAGER/CENTER → EDUCATION_MANAGEMENT, ADMIN 제외)
      - `previewSaleBonuses` 반환값 검증
      - sponsor 계보 조회 (recommender 아님)
      - ADMIN 제외 / SALESPERSON 상위 제외
      - calculationBasis JSON 저장
      - 트랜잭션 실패 시 롤백
  - **증거 파일**:
    - `prd2/evidence/qa/QA-003/test-result.log`
    - `prd2/evidence/qa/QA-003/manual.md`
    - `prd2/evidence/qa/QA-003/diff.patch`
  - **담당 페르소나**: 이미영 (기능) + 박진우 (요구사항)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-004]** [P0 Critical] PromotionService 4단계 승급 경계값 spec
  - **현상**: `members/promotion.service.ts` — `checkPromotionEligibility()` + 승급 조건 경계값 테스트 0건. 회원 생애주기 핵심.
  - **근거**: `prd/qa_파악된내용.md` §3 [C-QA-04]
  - **검증 방법**: `promotion.service.spec.ts`
  - **Pass 기준**:
    - 12 케이스 이상:
      - SALESPERSON → TEAM_LEADER (직속 10명 / 한시적 3명)
      - TEAM_LEADER → BRANCH_MANAGER (동일)
      - BRANCH_MANAGER → CENTER (수동 거부 케이스)
      - SystemConfig `PROMOTION_TEMPORARY_CONDITION_ACTIVE` on/off 시 동작 차이
      - 경계값: 2명 → 승급 안 함, 3명 → 승급
      - recommenderId 무시 / sponsorId 기준 확인
      - ADMIN 등급은 승급 검사 제외
      - `processBatchPromotion` 다수 회원 일괄 처리
      - 이벤트 발행 (PROMOTED) 검증
  - **증거 파일**:
    - `prd2/evidence/qa/QA-004/test-result.log`
    - `prd2/evidence/qa/QA-004/manual.md`
    - `prd2/evidence/qa/QA-004/diff.patch`
  - **담당 페르소나**: 이미영 (기능)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## 🟡 오류 / 미개발 (P1 High)

- [ ] **[QA-005]** [P1 High] members Controller 14 endpoint 계약 테스트
  - **현상**: `members.controller.ts` 14 endpoint 전부 API 스펙 없이 운영. Task #44.5 RBAC 미완 상태에서 계약 테스트도 없음 → 회귀 측정 불가.
  - **근거**: `prd/qa_파악된내용.md` §3 [C-QA-03]
  - **검증 방법**: `members.controller.spec.ts` + supertest
  - **Pass 기준**:
    - 14 endpoint 각각 최소 3 케이스 (unauth/일반회원/ADMIN)
    - RBAC 적용 여부 검증 (DEV1-001/002 완료 후)
    - 입력 validation (DTO) 검증
    - 응답 스키마 검증
  - **증거 파일**:
    - `prd2/evidence/qa/QA-005/test-result.log`
    - `prd2/evidence/qa/QA-005/manual.md`
    - `prd2/evidence/qa/QA-005/diff.patch`
  - **담당 페르소나**: 정유진 (API)
  - **선행 의존**: DEV1-004 (JWT 실구현), DEV3-006 (supertest 설치)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-006]** [P1 High] .bak 복원 29 케이스 실행 검증 (recognized-sales)
  - **현상**: 요청.md 항목 9 — `recognized-sales.service.spec.ts.bak` (25) + `recognized-sales.controller.spec.ts.bak` (4) enum rename 후 복원 예정. 현재 29 케이스 Pass/Fail 확인 필요.
  - **근거**: `prd/qa_파악된내용.md` §3 [H-QA-05] / 요청.md 항목 3 + 9
  - **검증 방법**: DEV2-014 완료 후 `pnpm test recognized-sales` 실행 결과 Pass/Fail 표
  - **Pass 기준**:
    - 복원된 29 케이스 전부 통과 (예상)
    - 부분 실패 시 각 케이스별 원인 분석 → DEV2-014 재시도 요청
  - **증거 파일**:
    - `prd2/evidence/qa/QA-006/test-result.log`
    - `prd2/evidence/qa/QA-006/manual.md` (29 케이스 Pass/Fail 표)
    - `prd2/evidence/qa/QA-006/diff.patch`
  - **담당 페르소나**: 최서연 (회귀)
  - **선행 의존**: DEV2-014
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-007]** [P1 High] 수당 체인 통합 테스트 (sales → settlements end-to-end)
  - **현상**: 체인 6단계 end-to-end 검증 0건. 체인 순서 역전 시 감지 수단 없음. 페르소나 문서는 "체인 순서 절대 변경 불가" 명시하나 자동 가드 없음.
  - **근거**: `prd/qa_파악된내용.md` §3 [H-QA-06]
  - **검증 방법**:
    - 자동: `bonus-chain.integration.spec.ts` (격리 DB 필수)
    - 수동: 전체 시나리오 출력 캡처
  - **Pass 기준**:
    - 시나리오 8개 이상:
      - 판매 등록 → 재고 차감 → 보너스 자동 생성 → PV 누적 → 승급 트리거
      - weekCode 일관성 (DEV2-011 완료 후)
      - settlementId FK 연결 (DEV2-003 완료 후)
      - 롤백 시나리오 (Tx 실패 → 전체 취소)
      - ADMIN/BRANCH_MANAGER 상위 계보 보너스 전파
  - **증거 파일**:
    - `prd2/evidence/qa/QA-007/test-result.log`
    - `prd2/evidence/qa/QA-007/manual.md`
    - `prd2/evidence/qa/QA-007/diff.patch`
  - **담당 페르소나**: 한상우 (통합 리드)
  - **선행 의존**: QA-003, DEV2-003, DEV2-011, QA-013 (격리 DB)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-008]** [P1 High] admin Playwright E2E 8 시나리오
  - **현상**: `apps/frontend/**/*.spec.ts` + `playwright.config.ts` 부재. admin/bonus-simulator, admin/settlements, admin/commission-rates 등 중요 페이지 E2E 0건.
  - **근거**: `prd/qa_파악된내용.md` §3 [H-QA-07] + §4.6 E2E-FULL-01~08
  - **검증 방법**:
    - 자동: Playwright 설치 + `pnpm --filter @kaion/frontend test:e2e`
    - 수동: 각 시나리오 스크린샷 + 비디오 저장
  - **Pass 기준**:
    - Playwright 설치 + `playwright.config.ts` 작성 (Nginx 5667 기준)
    - 8 시나리오:
      - E2E-FULL-01: 신규 가입 → SALESPERSON → 판매 → 수당
      - E2E-FULL-02: 10명 소개 → TEAM_LEADER 승급
      - E2E-FULL-03: 팀장 → 지사장 승급
      - E2E-FULL-04: 5제품 × 4등급 매트릭스 판매
      - E2E-FULL-05: RecognizedSales GRADE 유형
      - E2E-FULL-06: RecognizedSales LICENSE 유형
      - E2E-FULL-07: 자동정산 weekCode 생성
      - E2E-FULL-08: 정산 롤백
  - **증거 파일**:
    - `prd2/evidence/qa/QA-008/test-result.log`
    - `prd2/evidence/qa/QA-008/manual.md` (8개 비디오/스크린샷)
    - `prd2/evidence/qa/QA-008/diff.patch`
  - **담당 페르소나**: 오태준 (E2E 리드) + 임채영 (자동화 스크립트)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-009]** [P2 Medium] genealogy-raw-queries 부하 baseline (k6/artillery)
  - **현상**: `genealogy-raw-queries.ts` 핵심 쿼리의 성능 기준선 없음. 100만/1000만 회원 시나리오에서 회귀 감지 불가.
  - **근거**: `prd/qa_파악된내용.md` §3 [H-QA-08]
  - **검증 방법**: k6 부하 테스트 스크립트 + 결과 리포트
  - **Pass 기준**:
    - 10만 회원 seed 데이터 생성
    - getGenealogyTree depth=10 호출 → P95 < 500ms
    - getUpline depth=100 → P95 < 200ms
    - 리포트 작성
  - **증거 파일**: `prd2/evidence/qa/QA-009/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 김동현 (성능 리드) + 박준서 (확장성)
  - **선행 의존**: DEV1-005 (N+1 해결)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## 🔵 중요도 중간 (P2 Medium)

- [ ] **[QA-010]** [P2 Medium] 보안 RBAC 회귀 테스트 suite
  - **현상**: 무인증 호출 / 권한 우회 / IDOR 시도 자동 테스트 0건. DEV1/DEV2의 RBAC 수정이 완료되면 회귀 suite 필요.
  - **근거**: `prd/qa_파악된내용.md` §3 [C-QA-03] 보안 + §5.6
  - **검증 방법**: `security.regression.spec.ts` — 모든 controller의 unauth/유저/ADMIN 3종 호출 결과 행렬
  - **Pass 기준**:
    - 전 컨트롤러 엔드포인트 × 3 케이스 자동 매트릭스
    - 401/403/200 기대값 검증
    - DEV1-001/002/009, DEV2-006~010 완료 후 수행
  - **증거 파일**: `prd2/evidence/qa/QA-010/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 최민규 (보안 리드) + 강수민 (보안 코드)
  - **선행 의존**: DEV1-004
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-011]** [P2 Medium] CI jest 설정 완성 — testPathIgnorePatterns + coverage threshold
  - **현상**: `jest.config.js`에 `.bak` 명시적 제외 없음, coverage threshold 부재 → coverage 0%여도 통과. CI가 false green.
  - **근거**: `prd/qa_파악된내용.md` §3 [M-QA-10, M-QA-11]
  - **검증 방법**: jest.config.js 수정 후 `pnpm test:cov` 실행
  - **Pass 기준**:
    - `testPathIgnorePatterns: ['\\.bak$', '\\.legacy-old-system$']`
    - `coverageThreshold: { global: { statements: 5, branches: 5, functions: 5, lines: 5 } }` 초기값
    - 이후 점진 증가 (→ 50% 목표)
  - **증거 파일**: `prd2/evidence/qa/QA-011/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 윤성재 (자동화 리드)
  - **선행 의존**: DEV3-007
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-012]** [P2 Medium] CI에서 spec 개수 최소치 검증 (no-tests-found 차단)
  - **현상**: `pnpm test`가 0 테스트 상황에서도 통과 → false green. 활성 spec 0건 시 CI pass 방지 필요.
  - **근거**: `prd/qa_파악된내용.md` §2.2
  - **검증 방법**: CI 단계에서 `jest --passWithNoTests=false`
  - **Pass 기준**: 0 tests 상황 시 CI 실패
  - **증거 파일**: `prd2/evidence/qa/QA-012/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 윤성재
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[QA-013]** [P2 Medium] 격리 테스트 DB (docker-compose.test.yml)
  - **현상**: 실 운영 DB(kaion_db)만 존재. 통합 spec 작성 시 운영 데이터 오염 위험.
  - **근거**: `prd/qa_파악된내용.md` §3 [M-QA-12]
  - **검증 방법**: `docker-compose -f docker-compose.test.yml up -d`
  - **Pass 기준**:
    - 별도 테스트 DB 컨테이너 (kaion_db_test 5671 등 별도 포트)
    - 테스트 실행 전 migrate + seed
    - 테스트 실행 후 DB 초기화
  - **증거 파일**: `prd2/evidence/qa/QA-013/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 송지현 (테스트 환경)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## ⚪ Backlog (P3 Low)

- [ ] **[QA-014]** [P3 Low] PromotionService 다단계 승급 (SALESPERSON → TEAM_LEADER → BRANCH_MANAGER 1회 연쇄)
  - **현상**: `processBatchPromotion`이 한 번 호출 시 1단계만 승급 — 조건을 완전히 충족해도 1회만. 다단계 연쇄 승급 미구현.
  - **근거**: `prd/시뮬레이션_파악된내용.md` §2.2
  - **검증 방법**: 특정 회원이 동시에 TEAM_LEADER 및 BRANCH_MANAGER 조건 충족 시 2단계 모두 승급하는지 검증
  - **Pass 기준**: 다단계 승급 시나리오 동작 확인 (또는 1단계만 승급이 정상 설계임을 문서화)
  - **증거 파일**: `prd2/evidence/qa/QA-014/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 이미영 + 최민정 (개발2팀 비즈니스)
  - **선행 결정 필요**: 다단계 승급 vs 1단계 설계 (강민호)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

---

## 다른 팀과의 의존

### 선행 작업
- **개발1팀**: DEV1-004 (JWT 가드 실구현) → QA-005, QA-010
- **개발1팀**: DEV1-005 (N+1 해결) → QA-009
- **개발2팀**: DEV2-002 (자동정산 실동작) → QA-002
- **개발2팀**: DEV2-003 (settlementId FK), DEV2-011 (weekCode 통일) → QA-007
- **개발2팀**: DEV2-014 (.bak 복원) → QA-006
- **개발3팀**: DEV3-006 (supertest), DEV3-007 (jest config) → QA 모든 항목의 기반

### 후속 작업
- **PM팀 (박준혁)**: QA-001~004 P0 완료 → Stage 4 3-증거 중 "자동 테스트" 조건 충족 가능
- **시뮬레이션팀**: QA-007 수당 체인 통합 완료 → 비즈니스 시나리오 시뮬 가능

---

## Stage 4 진행 추적

```
[전체 진도] 0/14 (0%)
[상태별] PENDING: 14 / IN_PROGRESS: 0 / PASS: 0 / FAIL: 0 / ESCALATED: 0
[P0 Critical] 0/4 (0%)  — QA-001~004
[P1 High]     0/4 (0%)  — QA-005~008
[P2 Medium]   0/5 (0%)  — QA-009~013
[P3 Low]      0/1 (0%)  — QA-014
```

**Stage 4 진입 권장 순서**: QA-013 (격리 DB, 다른 테스트의 기반) → QA-011 (jest CI 설정) → QA-001 (매트릭스 20 케이스, 독립) → QA-003 (BonusCalculator 핵심) → QA-004 (PromotionService 경계값)

---

*작성: PM팀 (강민호 + 박준혁 + 오민정) / Stage 3 검증 체크리스트 / 기준: prd/qa_파악된내용.md*
