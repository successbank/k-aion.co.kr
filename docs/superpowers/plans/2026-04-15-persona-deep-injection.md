# Kaion 페르소나 깊은 주입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Tasks 2-11 are designed to dispatch in parallel. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 79명 페르소나 카드 전부에 Kaion MLM 도메인 지식(전문 영역, 담당 파일, 누적 작업 맥락, 주의사항, Kaion 예시)을 정적으로 주입하고, `.claude/CLAUDE.md` 상단에 공통 도메인 컨텍스트 섹션을 추가한다.

**Architecture:**
- Sequential preparation (Task 1: `.claude/CLAUDE.md` 상단 prepend + PM팀 13→14 정정)
- **Parallel injection (Tasks 2-11: 10개 subagent를 동시 dispatch — 각자 정확히 하나의 페르소나 파일만 수정)**
- Sequential verification (Task 12: grep/카운트 인수 기준)
- Sequential cleanup (Task 13: memory update, Task 14: commit decision)

**Tech Stack:** Markdown editing (Edit/Read tools), Bash grep, git

**Spec:** `docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md` (commit `c491d94`)

---

## Pre-flight checklist

먼저 다음을 확인:
- [ ] spec 문서를 처음부터 끝까지 읽음 (`docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md`)
- [ ] 4섹션 템플릿 이해 (spec §2)
- [ ] Kaion 도메인 사실 이해 (spec §3 — 5단계 등급, 이중 계보, 6종 보너스, 수당 체인)
- [ ] 79명 분포 이해 (spec §0.1: PM 14, 리서치 4, 기획설계 5, 디자인 3, 개발1 10, 개발2 12, 개발3 6, QA 15, 모니터링 5, 시뮬레이션 5)
- [ ] `.claude/personas/*.md` 10개 파일이 모두 존재하는지 `Glob` 으로 확인
- [ ] 현재 브랜치: main (또는 별도 feature 브랜치)

> 중요: `.claude/` 디렉토리는 현재 git에 untracked 상태. 본 plan은 파일 수정만 다루며, 첫 commit은 Task 14에서 사용자 확인 후 진행.

---

## Task 1: `.claude/CLAUDE.md` Kaion 도메인 컨텍스트 prepend + PM팀 카운트 정정

**Files:**
- Modify: `.claude/CLAUDE.md` (currently untracked)

**Owner:** Main session (subagent 불필요, 단순 Edit 작업)

- [ ] **Step 1.1: Read current CLAUDE.md head**

Run: `Read .claude/CLAUDE.md` (offset 0, limit 30)

Expected: 첫 줄은 `# 프로젝트 개발 페르소나 시스템`. 4번째 줄 즈음에 "**버전**: 2.0.0 | **총 인원**: 78명 | **팀 수**: 10개"가 존재.

- [ ] **Step 1.2: Prepend Kaion domain context section using Edit**

Edit `.claude/CLAUDE.md`:

old_string:
```
# 프로젝트 개발 페르소나 시스템
```

new_string:
````
# Kaion 도메인 컨텍스트 (모든 페르소나 공통 지식)

> **이 섹션은 모든 페르소나가 호출 시 자동으로 알고 있어야 하는 기본 사실입니다.**
> 페르소나별 세부 책임은 `.claude/personas/*.md`를 참조하세요.

## 회사/제품
- (주)케이아이온 MLM 통합관리시스템
- 브랜드 컬러: **#7CB342** (연두색)
- PRD: `.taskmaster/docs/prd.md`
- 수당 PRD: `.taskmaster/docs/commission-prd.md` (662줄)
- members README: `apps/backend/src/members/README.md`

## 회원 등급 5단계 (+ ADMIN)

| 등급 | 승급 조건 |
|------|----------|
| MEMBER | 가입 시 기본 |
| AGENT | 누적 PV ≥ 1,000,000 |
| MANAGER | 후원계보 3팀 형성 + 에이전트 15명 육성 |
| BRANCH_CHIEF | 매니저 3팀 + 매니저 4명 (각 팀 1명+) |
| DIVISION_CHIEF | 지부장 3팀 + 지부장 5명 (각 팀 1명+) |
| ADMIN | 시스템 지정 (수당 대상 아님) |

Prisma enum: `MEMBER | AGENT | MANAGER | BRANCH_CHIEF | DIVISION_CHIEF | ADMIN`

## 이중 계보
- `recommenderId`: 추천계보 (1:N, 보너스 지급 기준)
- `sponsorId`: 후원계보 (트리, 승급 조건 기준)
- `teamLine` 1~3 (DB CHECK 제약, **Kaion 고유** 1:3 팀라인)

## 6종 보너스 (commission-prd §3)

| 보너스 | 금액 | 대상 |
|--------|------|------|
| 판매 | 50만원 (판매자 25 + 추천계보 상위 에이전트 25) | 전체 |
| 판매 관리 | 15만원 | 직접 추천인 |
| 판권 | 매니저 10 / 지부장 18 / 본부장 24만 | 매니저 이상 |
| 판권 관리 | 매니저 5 / 지부장 4 / 본부장 3만 | 동급 상위 |
| 공유 | 2만원 (중복) | 지부장/본부장 |
| 지점 운영 | 5만원 | 매니저 이상 (세미나 시) |

## 수당 정산 체인
sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements → tasks/settlement-scheduler.task.ts (cron)

최근 커밋: `b6ca264 자동정산기능`, `420e7a4 수당률수정`

## 기술 스택
- Mono: pnpm + Turbo
- BE: NestJS + Prisma + @nestjs/event-emitter (→ 향후 BullMQ 전환 예정)
- FE: Next.js 14 App Router + Ant Design + TailwindCSS + react-d3-tree
- Infra: Docker 6컨테이너 (kaion_backend, kaion_frontend, kaion_nginx, kaion_db, kaion_redis, kaion_adminer)
- 포트: Nginx 5667 (web/api), PostgreSQL 5668, Redis 5669, Adminer 5670

## 핫스팟 (절대 주의)
- `apps/backend/src/members/genealogy-raw-queries.ts`: 성능상 raw SQL — **리팩터 금지**
- `.bak` 파일 4개 — **강민호(PM 리더) 결정 없이 복원 금지**:
  - `apps/backend/src/bonuses/bonus-calculator.service.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak`
  - `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak`
- **Task #44.5 RBAC TODO**: JWT 가드/Roles 데코레이터/CurrentUser 데코레이터는 존재하지만 `members.controller.ts`에 미적용

---

# 프로젝트 개발 페르소나 시스템
````

- [ ] **Step 1.3: PM팀 카운트 13 → 14 정정 (다이어그램 영역)**

Edit `.claude/CLAUDE.md`:

old_string:
```
PM팀 (13명) ─┬─ 리서치팀 (4명)     ← 기술/서비스/오픈소스 탐색
```

new_string:
```
PM팀 (14명) ─┬─ 리서치팀 (4명)     ← 기술/서비스/오픈소스 탐색
```

- [ ] **Step 1.4: 총 인원 78 → 79 정정**

Edit `.claude/CLAUDE.md`:

old_string:
```
> **버전**: 2.0.0 | **총 인원**: 78명 | **팀 수**: 10개
```

new_string:
```
> **버전**: 3.0.0 (Kaion 깊은 주입) | **총 인원**: 79명 | **팀 수**: 10개
```

- [ ] **Step 1.5: PM팀 핵심 담당자 섹션의 헤더 정정 (`### 소통관 (요청 접수)` 위에 PM팀 13명 표기가 있는지 확인)**

Run: `grep -n "PM팀.*13명" .claude/CLAUDE.md`

만약 매치가 있으면 각각 14명으로 Edit. 매치가 0이면 skip.

- [ ] **Step 1.6: Verify all changes applied**

Run: `head -3 .claude/CLAUDE.md`
Expected: 첫 줄 `# Kaion 도메인 컨텍스트 (모든 페르소나 공통 지식)`

Run: `grep -c "#7CB342" .claude/CLAUDE.md`
Expected: ≥ 1

Run: `grep -c "PM팀 (14명)" .claude/CLAUDE.md`
Expected: ≥ 1

Run: `grep -c "78명" .claude/CLAUDE.md`
Expected: 0 (모두 79로 정정됨)

- [ ] **Step 1.7: NO COMMIT YET** — 모든 변경은 Task 14에서 일괄 commit.

---

## Task 2-11: 페르소나 파일 깊은 주입 (10개 subagent 병렬 dispatch)

**중요: 이 10개 task는 한 메시지 안에서 동시에 dispatch한다 (Agent 도구 멀티 호출). 각 subagent는 독립된 파일을 수정하므로 충돌 없음.**

### 공통 subagent 프롬프트 골격

각 subagent에게 다음 프롬프트를 전달 (FILE_PATH, TEAM_SECTION, EXTRA_NOTES만 task별 치환):

```
You are tasked with deep-injecting Kaion MLM domain knowledge into a single persona file. This is part of a larger plan - you handle exactly ONE file.

## REQUIRED READING (read these first, in order)

1. /data/successbank/projects/kaion/docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md
   - §2: 4섹션+1예시 템플릿 (적용 형식)
   - §3: Kaion 도메인 사실 (Ground Truth — 등급/계보/보너스/체인/스택/핫스팟)
   - §<TEAM_SECTION>: your team mapping table (담당 페르소나별 전문 영역/파일/주의사항)
   - §6: 잘못된 예시 치환 매핑 (해당 시)
   - §8: 인수 기준

2. <FILE_PATH> (the persona file you will modify — read it in full first)

## YOUR FILE
<FILE_PATH>

## YOUR TASK

For EVERY persona card in this file (count varies by team):

1. Inject the 4-section + 1-example block AFTER the existing persona YAML card (closing ```), BEFORE the next persona heading (#### or ###) or end of file.

2. The injected block uses this EXACT structure (fill in per spec §<TEAM_SECTION> for that specific persona):

   ```markdown
   
   ## 🎯 Kaion 전문 영역
   <1-3개 핵심 책임, 모듈명/파일명 직접 언급. spec §<TEAM_SECTION> table 의 "전문 영역" 컬럼>
   
   ## 🗂️ 주요 담당 파일/모듈
   - <절대/상대 경로 3-7개. spec §<TEAM_SECTION> table 의 "담당 파일/지식" 컬럼>
   
   ## 📚 누적 작업 맥락 (학습된 지식)
   - <Kaion 도메인 사실 + 사용 패턴 + 의존관계 (spec §3에서 발췌, persona 역할에 맞게)>
   
   ## ⚠️ 주의사항 (운영 메모)
   - <함정/.bak/TODO. spec §<TEAM_SECTION> table 의 "주의사항" 컬럼 + spec §3.7 핫스팟에서 관련된 것>
   
   ## 💬 Kaion 맥락 예시
   ✅ <Kaion 실제 작업 예시 — 커밋, PR, 검증 보고 형식 중 1개>
   ❌ (구버전 — 사용 금지) <일반 예시 패턴>
   ```

3. Replace any wrong example phrases listed in spec §6.2 with the Kaion equivalents. The exact phrases to find and replace:

   | OLD | NEW |
   |-----|-----|
   | `feat: 회원가입 폼 구현 (#15)` | `feat: 회원 가입 폼 + 1:3 팀라인 자동 배정 (#15)` |
   | `feat: 로그인 API 구현 (#12)` | `feat: members PromotionService AGENT 승급 조건 검증 (#12)` |
   | `refactor: 주문 API 레거시 마이그레이션 (#20)` | `feat: bonuses 모듈 판권 보너스 계산 로직 (#20)` |
   | `feat: 결제 시스템 v2 전환 (#21)` | `feat: settlements 자동정산 체인 연동 (#21)` |
   | `쇼핑몰 PRD` | `케이아이온 통합관리시스템 PRD` |
   | `상품 검색부터 결제까지 전체 구매 흐름` | `회원 가입 → PV 누적 → 자동 승급 → 판매 → 6종 보너스 → 정산 흐름` |
   | `회원 가입/탈퇴 프로세스` | `회원 가입(temp_join) → 정식 회원(member) → AGENT 승급 → MANAGER+ 승급 프로세스` |
   | `주문/결제/배송 플로우` | `판매 → 인정매출 → 수당률 적용 → 보상플랜 → 보너스 산정 → 정산 플로우` |
   | `정산 로직 검증` | `6종 보너스 정산 로직 검증 (commission-prd §3 기준)` |

4. Update the team header count if the spec §<TEAM_SECTION> indicates an off-by-one (e.g., PM팀 13 → 14).

5. Update the collaboration matrix (PM팀 연계, 개발3팀 Skill 활용 등 표) at the bottom of the file: replace abstract references with actual Kaion file paths where possible.

6. <EXTRA_NOTES — task-specific instructions, e.g., 개발2팀 정체성 재정의 box>

## CONSTRAINTS

- Do NOT remove any existing v2 verification gate content (★ markers, "★ v2 추가" blocks, 검증 보고 형식, 완료 선언 금지 조건). These are critical and must be preserved verbatim.
- Do NOT change persona YAML cards (the ```yaml ... ``` blocks). Only ADD content after them.
- Do NOT modify any other files. Only edit <FILE_PATH>.
- Use the Edit tool (not Write). For multiple edits, use multiple Edit calls.
- Each persona must get an INDIVIDUAL block (not a shared team block) per spec §8.2.
- Do NOT commit. Just modify the file. Commit happens later in Task 14.

## OUTPUT (report back)

When finished, report a single message containing:
1. File modified
2. Number of persona cards processed (must match expected count)
3. Number of "🎯 Kaion 전문 영역" sections inserted
4. Number of wrong-example phrase replacements (0 if file had none)
5. Any deviation from spec or unresolvable ambiguity
```

---

### Task 2: pm팀.md (14명)

**Files:**
- Modify: `.claude/personas/pm팀.md`

**Subagent dispatch:**
- subagent_type: `general-purpose`
- description: `Inject Kaion knowledge into PM팀 (14 personas)`
- Use the common prompt above with:
  - FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/pm팀.md`
  - TEAM_SECTION = `4.1`
  - EXTRA_NOTES = "Update line 4 '총 13명 구성' → '총 14명 구성'. Verify all 14 personas (소통관 3 + 총괄 PM 4 + 일관성 PM 5 + Git/이슈 PM 2) get individual blocks."
- Expected output: 14 cards processed, 14 sections inserted, ~5 phrase replacements (estimate).

- [ ] **Step 2.1: Dispatch subagent (parallel with Tasks 3-11)**
- [ ] **Step 2.2: On return, verify report shows 14 cards processed**
- [ ] **Step 2.3: If discrepancy, dispatch corrective subagent for the missing personas**

---

### Task 3: 리서치팀.md (4명)

**Files:**
- Modify: `.claude/personas/리서치팀.md`

**Subagent dispatch:**
- subagent_type: `general-purpose`
- description: `Inject Kaion knowledge into 리서치팀 (4 personas)`
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/리서치팀.md`
- TEAM_SECTION = `4.2`
- EXTRA_NOTES = "이 파일에는 잘못된 예시가 없을 가능성 높음 (grep 결과 상 매치 없음). 4섹션 주입만 집중."
- Expected: 4 cards processed.

- [ ] **Step 3.1: Dispatch subagent**
- [ ] **Step 3.2: Verify 4 cards processed**

---

### Task 4: 기획설계팀.md (5명)

**Files:**
- Modify: `.claude/personas/기획설계팀.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/기획설계팀.md`
- TEAM_SECTION = `4.3`
- EXTRA_NOTES = "기획설계팀은 미니설계서 작성 책임이 있으므로, '🎯 Kaion 전문 영역'에 PRD/commission-prd 분석 책임을 명시. 정서현은 '5단계 승급 조건 + 6종 보너스 명세'를 책임."
- Expected: 5 cards processed.

- [ ] **Step 4.1: Dispatch**
- [ ] **Step 4.2: Verify 5 cards**

---

### Task 5: 디자인팀.md (3명)

**Files:**
- Modify: `.claude/personas/디자인팀.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/디자인팀.md`
- TEAM_SECTION = `4.4`
- EXTRA_NOTES = "**김서현(UI 리드)에는 #7CB342 연두색을 명시적으로 언급할 것.** 이준호는 react-d3-tree 계보 트리 인터랙션 담당."
- Expected: 3 cards processed, 1+ "#7CB342" 언급.

- [ ] **Step 5.1: Dispatch**
- [ ] **Step 5.2: Verify 3 cards + #7CB342 언급**

---

### Task 6: 개발1팀.md (10명)

**Files:**
- Modify: `.claude/personas/개발1팀.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/개발1팀.md`
- TEAM_SECTION = `4.5`
- EXTRA_NOTES = "개발1팀 정체성: 신규 사용자 기능 + members 모듈 핵심 + 인프라. **윤서연 카드의 주의사항에 'genealogy-raw-queries.ts raw SQL 리팩터 금지' 명시.** 신예진 카드의 누적 맥락에 'admin/users + BulkPasswordResetModal 작업 트리에 WIP 존재' 명시. 잘못된 예시(회원가입 폼/로그인 API)가 있으면 spec §6.2 매핑으로 치환."
- Expected: 10 cards, 2+ phrase replacements.

- [ ] **Step 6.1: Dispatch**
- [ ] **Step 6.2: Verify 10 cards + raw query 경고 + WIP 언급**

---

### Task 7: 개발2팀.md (12명) — **정체성 재정의**

**Files:**
- Modify: `.claude/personas/개발2팀.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/개발2팀.md`
- TEAM_SECTION = `4.6`
- EXTRA_NOTES = """
  **★★★ 정체성 재정의 (spec §1 결정 #3) ★★★**

  '팀 개요' 섹션 바로 아래에 다음 박스를 추가:

  ```markdown
  ---

  > **★ Kaion 정체성 재정의 (2026-04-15)**
  >
  > 기존 '레거시 마이그레이션 전문' 정의는 **Kaion 프로젝트에 적용되지 않습니다** (Kaion은 2025-12-24 initial commit 이후 모두 신규 개발, 레거시 코드 0건).
  >
  > **신규 정의**: 개발2팀은 **수당 체인 + 관리자 페이지 전체 + 배치 작업 전담 시니어팀**입니다.
  > - BE: bonuses, settlements, sales 체인, .bak 파일 검토, PromotionService 비즈니스 로직, 크론 작업
  > - FE: `app/admin/*` 20+ 페이지 전체, react-d3-tree 계보 트리, bonus-simulator 폼
  > - DB: 이중 트리 구조, Prisma migrations, integrity-check, backup
  >
  > 50대 시니어 인구학적 설정과 페르소나 카드는 그대로 유지하되, 책임 영역은 위로 재정의됨.

  ---
  ```

  그리고 잘못된 예시 ('주문 API 레거시 마이그레이션', '결제 시스템 v2 전환', '주문/결제/배송 플로우' 등)를 spec §6.2 매핑으로 모두 치환.

  '개발1팀 vs 개발2팀 역할 분담' 표가 있다면, '레거시 마이그레이션' / '신규 vs 레거시' 같은 표현을 다음으로 치환:
  - 신규 기능 → 사용자 기능 (members 핵심)
  - 레거시 마이그레이션 → 수당 체인 + 관리자 UI
  """
- Expected: 12 cards processed, 정체성 재정의 박스 1개, 4+ phrase replacements.

- [ ] **Step 7.1: Dispatch (가장 큰 변경 — subagent에 충분한 컨텍스트 전달)**
- [ ] **Step 7.2: Verify 12 cards + 재정의 박스 존재 + 잘못된 예시 0건**

---

### Task 8: 개발3팀.md (6명)

**Files:**
- Modify: `.claude/personas/개발3팀.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/개발3팀.md`
- TEAM_SECTION = `4.7`
- EXTRA_NOTES = "이정우(테스트 Skill)의 누적 맥락에 '`.bak`이 된 spec 파일 4개 부활 검토' 언급."
- Expected: 6 cards processed.

- [ ] **Step 8.1: Dispatch**
- [ ] **Step 8.2: Verify 6 cards**

---

### Task 9: qa.md (15명)

**Files:**
- Modify: `.claude/personas/qa.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/qa.md`
- TEAM_SECTION = `4.8`
- EXTRA_NOTES = "**김정훈(QA 리드)의 전문 영역에 '6종 보너스 테스트 매트릭스 + 5단계 승급 시나리오' 명시.** 한상우(통합 리드)는 'sales→recognized→commission→compensation→bonuses→settlements 전체 체인' 담당. 최서연(회귀)은 '.bak 파일 분석 후 회귀 케이스 작성' 명시. 가장 페르소나가 많으므로(15명) 빠짐없이 처리."
- Expected: 15 cards processed.

- [ ] **Step 9.1: Dispatch**
- [ ] **Step 9.2: Verify 15 cards**

---

### Task 10: monitoring.md (5명)

**Files:**
- Modify: `.claude/personas/monitoring.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/monitoring.md`
- TEAM_SECTION = `4.9`
- EXTRA_NOTES = "이정민(APM)에 'genealogy-raw-queries 트랜잭션 추적' 명시. 박도영(로그)에 '자동정산 실패 패턴' 명시."
- Expected: 5 cards processed.

- [ ] **Step 10.1: Dispatch**
- [ ] **Step 10.2: Verify 5 cards**

---

### Task 11: 시뮬레이션.md (5명)

**Files:**
- Modify: `.claude/personas/시뮬레이션.md`

**Subagent dispatch:**
- FILE_PATH = `/data/successbank/projects/kaion/.claude/personas/시뮬레이션.md`
- TEAM_SECTION = `4.10`
- EXTRA_NOTES = "정유라(비즈니스)는 '회원 가입→승급→정산' 시뮬을 책임. 잘못된 예시 ('회원 가입/탈퇴 프로세스', '주문/결제/배송 플로우') 치환 필요 — spec §6.2."
- Expected: 5 cards processed, 2+ phrase replacements.

- [ ] **Step 11.1: Dispatch**
- [ ] **Step 11.2: Verify 5 cards + 잘못된 예시 0건**

---

## Task 12: 통합 검증 (인수 기준)

10개 파일 모두 처리 완료 후 실행. 하나라도 실패하면 해당 파일에 corrective subagent dispatch.

- [ ] **Step 12.1: 각 파일의 🎯 섹션 카운트가 인원수와 일치하는지**

Run:
```bash
for f in pm팀 리서치팀 기획설계팀 디자인팀 개발1팀 개발2팀 개발3팀 qa monitoring 시뮬레이션; do
  count=$(grep -c "🎯 Kaion 전문 영역" ".claude/personas/${f}.md" 2>/dev/null || echo 0)
  echo "${f}.md: ${count}"
done
```

Expected:
```
pm팀.md: 14
리서치팀.md: 4
기획설계팀.md: 5
디자인팀.md: 3
개발1팀.md: 10
개발2팀.md: 12
개발3팀.md: 6
qa.md: 15
monitoring.md: 5
시뮬레이션.md: 5
```

총합: 79.

만약 어떤 파일이 부족하면 → Task 12.X로 corrective subagent dispatch.

- [ ] **Step 12.2: Kaion 키워드가 모든 파일에 등장하는지**

Run:
```bash
grep -l "members\|승급\|보너스\|계보\|PV\|AGENT" .claude/personas/*.md | wc -l
```
Expected: `10`

- [ ] **Step 12.3: 잘못된 예시 0건 확인**

Run:
```bash
grep -rn "주문 API\|결제 시스템\|쇼핑몰 PRD\|레거시 마이그레이션\|회원가입 폼\|로그인 API\|주문/결제/배송" .claude/personas/
```
Expected: 매치 0건 (출력 비어 있음)

만약 매치가 있으면 → 해당 파일에 corrective subagent dispatch.

- [ ] **Step 12.4: 브랜드 컬러 #7CB342 등장 확인**

Run:
```bash
grep -l "#7CB342\|7CB342" .claude/personas/*.md
```
Expected: 최소 `pm팀.md`와 `디자인팀.md` 포함.

- [ ] **Step 12.5: v2 검증 게이트 콘텐츠 보존 확인**

Run:
```bash
grep -c "★" .claude/personas/pm팀.md
```
Expected: 30 이상 (작업 전 카운트와 비슷하거나 더 많음 — 새 박스 추가로 증가 가능)

작업 전 카운트를 미리 측정해두는 것이 더 정확:
```bash
# Task 1 시작 전에 백업으로 한 번 측정
git stash # 작동 안 함 — untracked. 대신:
cp .claude/personas/pm팀.md /tmp/pm팀.before.md
# Task 12.5에서:
diff <(grep -c "★ v2 추가" /tmp/pm팀.before.md) <(grep -c "★ v2 추가" .claude/personas/pm팀.md)
# Expected: 동일하거나 신규가 더 많음
```

> 단순화: subagent에게 "★ v2 추가" 마커가 포함된 모든 줄을 절대 삭제하지 말 것을 강조했으므로 (constraint 명시), 이 검증은 정성적으로 spot-check만 수행해도 됨.

- [ ] **Step 12.6: 협업 매트릭스 갱신 확인 (정성)**

각 파일 끝의 'PM팀 연계' 표 / 협업 매트릭스를 spot-check:
- 개발1팀.md: 김태현 row에 `members/` 모듈 언급?
- 개발2팀.md: 이서영 row에 `app/admin/*` 언급?
- qa.md: 한상우 row에 수당 체인 언급?

3개 파일만 시각적으로 확인. 모두 갱신되어 있으면 OK.

---

## Task 13: 메모리 갱신

- [ ] **Step 13.1: project_persona_conflict.md 갱신**

Read: `/home/successbank/.claude/projects/-data-successbank-projects-kaion/memory/project_persona_conflict.md`

Edit:

old_string:
```
**상태 (2026-04-15 기준, 미해결)**:
```

new_string:
```
**상태 (2026-04-15 해결됨 — 깊은 주입 완료)**:
```

그리고 파일 끝에 다음을 append (Edit으로 마지막 줄 다음에 추가, 또는 Read 후 Write):

```markdown

## 해결 (2026-04-15)

옵션 C **깊은 주입**으로 해결:
- 79명(PM팀 13→14 off-by-one 정정 포함)을 그대로 유지
- 각 페르소나에 4섹션(전문 영역 / 담당 파일 / 누적 작업 맥락 / 주의사항 + Kaion 예시) 주입
- `.claude/CLAUDE.md` 상단에 Kaion 도메인 컨텍스트 섹션 추가
- 잘못된 예시(주문 API, 결제 시스템, 레거시 마이그레이션, 회원가입/로그인 API, 주문/결제/배송) phrase 단위로 일괄 치환
- 개발2팀 정체성 "레거시 마이그레이션" → "수당 체인 + 관리자 UI 전담"으로 재정의
- 10개 subagent 병렬 dispatch로 wall time ≈ 60분에 완료

설계서: `docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md` (commit `c491d94`)
실행 plan: `docs/superpowers/plans/2026-04-15-persona-deep-injection.md`

PRD 16명과의 충돌은 **해결되지 않음** (PRD 16명은 명목, 실제 작업은 79명 페르소나가 수행). PRD 측 정정은 별도 작업.
```

- [ ] **Step 13.2: MEMORY.md 인덱스 갱신**

Read: `/home/successbank/.claude/projects/-data-successbank-projects-kaion/memory/MEMORY.md`

Edit:

old_string:
```
- [Persona conflict: PRD vs .claude/CLAUDE.md](project_persona_conflict.md) — PRD는 16명, .claude는 78명. 동일 이름 다른 역할. 최적화 대기 중
```

new_string:
```
- [Persona conflict resolved](project_persona_conflict.md) — 2026-04-15 옵션 C 깊은 주입 완료. 79명(PM 13→14 정정)에 Kaion 도메인 주입, .claude/CLAUDE.md 상단 컨텍스트 섹션 추가
```

---

## Task 14: 최종 git commit (사용자 확인 필수)

> **⚠️ STOP**: 이 task 시작 전에 사용자에게 명시적으로 확인 받기.

`.claude/` 디렉토리는 현재 git에 untracked 상태. 첫 commit은 페르소나 시스템 전체를 baseline으로 등록하는 의미를 가짐.

- [ ] **Step 14.1: 사용자에게 commit 옵션 제시 + 응답 대기**

다음 메시지를 사용자에게 출력:

```
모든 깊은 주입 작업이 완료되었습니다. 이제 git commit을 진행하려고 합니다.
.claude/ 디렉토리는 현재 untracked 상태이므로, 첫 commit이 페르소나 시스템 baseline이 됩니다. 옵션:

A) `.claude/CLAUDE.md` + `.claude/personas/`만 commit (페르소나_보강_프롬프트_가이드.md는 untracked 유지)
B) `.claude/` 폴더 전체 commit (가이드 + README 포함)
C) commit 안 하고 untracked 유지 (사용자가 직접 commit)

A/B/C 어느 것?
```

사용자 응답 대기. 명시적 응답 없으면 그 다음 step 진행 금지.

- [ ] **Step 14.2 (응답 A): personas + CLAUDE.md만 commit**

Run:
```bash
git add .claude/CLAUDE.md .claude/personas/
git commit -m "$(cat <<'EOF'
페르소나 시스템 Kaion 도메인 깊은 주입

79명 페르소나에 4섹션(전문 영역 / 담당 파일 / 누적 맥락 / 주의사항 + Kaion 예시) 주입.
.claude/CLAUDE.md 상단에 Kaion 도메인 컨텍스트 섹션 추가.
PM팀 13→14명 off-by-one 정정.
개발2팀 정체성 "레거시 마이그레이션" → "수당 체인 + 관리자 UI 전담"으로 재정의.
잘못된 예시(주문 API/결제 시스템/레거시 마이그레이션 등) Kaion 예시로 일괄 치환.

설계서: docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md
실행 plan: docs/superpowers/plans/2026-04-15-persona-deep-injection.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)" && git status
```

- [ ] **Step 14.2 (응답 B): .claude/ 폴더 전체 commit**

Run:
```bash
git add .claude/
git commit -m "$(cat <<'EOF'
페르소나 시스템 Kaion 도메인 깊은 주입 (전체 .claude baseline)

79명 페르소나에 4섹션 주입 + .claude/ baseline 등록.
PM팀 13→14 정정, 개발2팀 정체성 재정의, 잘못된 예시 일괄 치환.

설계서: docs/superpowers/specs/2026-04-15-persona-deep-injection-design.md
실행 plan: docs/superpowers/plans/2026-04-15-persona-deep-injection.md

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)" && git status
```

- [ ] **Step 14.2 (응답 C): commit skip**

사용자에게 보고:
```
.claude/ 폴더는 untracked 상태로 유지됩니다. 모든 수정은 파일 시스템에 적용되었으며, 직접 git add + commit 하시면 됩니다.
git status로 변경 확인 가능.
```

- [ ] **Step 14.3: 메모리 commit 별도 진행 여부**

메모리 파일(`/home/successbank/.claude/projects/...`)은 프로젝트 git이 아니므로 별도 commit 불필요. 자동 저장됨.

---

## Acceptance Criteria (spec §8 기준)

- [ ] `.claude/CLAUDE.md` 1번 줄에 "Kaion 도메인 컨텍스트" 헤더 존재
- [ ] 10개 페르소나 파일 모두에 "🎯 Kaion 전문 영역" 섹션 존재
- [ ] 79명 전원 개별 매핑 (팀 공통이 아닌 개별 책임 명시)
- [ ] PM팀 헤더 13→14명 정정 (`pm팀.md` 4번 줄, `.claude/CLAUDE.md` PM팀 라인)
- [ ] `grep -rn "주문 API\|결제 시스템\|쇼핑몰 PRD\|레거시 마이그레이션\|회원가입 폼\|로그인 API\|주문/결제/배송" .claude/personas/` → **0건**
- [ ] `grep -l "members\|승급\|보너스\|계보\|PV\|AGENT" .claude/personas/*.md | wc -l` → **10**
- [ ] `grep -l "#7CB342\|7CB342" .claude/personas/*.md` → 최소 2건 (pm팀.md, 디자인팀.md)
- [ ] v2 검증 게이트 ★ 마커 보존 (각 파일 spot-check)
- [ ] 협업 매트릭스가 실제 Kaion 파일 경로를 포함
- [ ] 개발2팀.md에 정체성 재정의 박스 존재
- [ ] MEMORY.md 페르소나 충돌 항목이 "resolved"로 변경
- [ ] project_persona_conflict.md 본문에 "## 해결 (2026-04-15)" 섹션 추가

---

## 위험과 완화 (spec §9 참조)

| 위험 | 완화 |
|------|------|
| subagent가 spec을 충분히 안 읽고 작업 | 프롬프트 첫 줄에 "READ THESE FIRST" 명시 + 인수 기준 명시 |
| 병렬 subagent 간 race condition | 각자 다른 파일 — 충돌 영역 0 |
| v2 ★ 마커 누락 삭제 | constraint에 "절대 삭제 금지" 명시 + Step 12.5에서 spot-check |
| 개발2팀 정체성 재정의가 부분적으로만 적용 | Task 7 EXTRA_NOTES에 박스 형식 그대로 명시 |
| 잘못된 예시 누락 치환 | Step 12.3에서 grep 검증 → 0건 아니면 corrective dispatch |
| `.claude/` 첫 commit 결정 | Task 14에서 사용자 명시 확인 |

---

## 실행 순서 요약

```
Task 1 (단독, ~5분)
  ↓
[Task 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 PARALLEL DISPATCH] (~30~60분 wall time)
  ↓
Task 12 (검증, ~10분)
  ↓
[필요 시 Task 12.X corrective subagent]
  ↓
Task 13 (메모리, ~5분)
  ↓
Task 14 (사용자 확인 → commit, ~5분)
```

총 wall time 추정: **60~90분** (병렬 실행 덕분)
