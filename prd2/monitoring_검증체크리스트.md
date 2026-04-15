# 모니터링팀 검증 체크리스트 (Stage 4 작업)

> **목적**: Stage 1 분석(Critical 3건 + High 5건) + Stage 2 미완 항목을 Stage 4 사이클로 처리
> **합격 기준 (Stage 4)**: 자동 테스트 + 수동 스크린샷/로그 + 코드 diff **3가지 모두**
> **시도 횟수**: 각 항목 최대 3회 (3회 실패 시 강민호 에스컬레이션)
> **증거 위치**: `/data/successbank/projects/kaion/prd2/evidence/monitoring/{항목ID}/`
> **팀 정체성**: 인프라 / APM / 로그 / 알림 / 대시보드 (5명)
> **기준 분석 문서**: `prd/monitoring_파악된내용.md` §3 (Critical 3건 + High 5건 + Medium 4건)

---

## 우선순위 매트릭스

| 항목 ID | 분류 | 우선순위 | 영향도 | 난이도 | 의존 | 담당 페르소나 |
|---------|------|---------|--------|--------|------|------------|
| MON-001 | 오류 (LoggingInterceptor 미등록) | P0 Critical | High | Low | - | 박도영 (로그) + 정대훈 |
| MON-002 | 오류 (BackupTask 동작 불능) | P0 Critical | High | Medium | - | 김수현 (시스템) + 임동혁 |
| MON-003 | 미개발 (settlement 실패 알림) | P0 Critical | High | Medium | DEV2-002 | 박도영 |
| MON-004 | 오류 (Nginx /health 경로) | P1 High | Medium | Low | - | 김수현 |
| MON-005 | 오류 (Nginx access log 부재) | P1 High | Medium | Low | - | 김수현 |
| MON-006 | 오류 (컨테이너 healthcheck 5개) | P1 High | Medium | Low | - | 김수현 + 임동혁 |
| MON-007 | 오류 (Winston 파일 로거 유실) | P1 High | Medium | Low | - | 박도영 + 임동혁 |
| MON-008 | 미개발 (CronRunLog 테이블) | P1 High | Medium | Medium | - | 박도영 + 김성진 + 윤성호 |
| MON-009 | 미개발 (Slack 채널 분리) | P2 Medium | Medium | Medium | - | 장현우 + 최윤서 |
| MON-010 | 비정상 (구 등급 라벨) | P2 Medium | Low | Low | STAGE3-008 | 최윤서 |
| MON-011 | 오류 (ActivityLog 익명 누락) | P2 Medium | Medium | Low | - | 박도영 |
| MON-012 | 미개발 (admin/statistics 인프라 대시보드) | P2 Medium | Medium | High | MON-008 | 최윤서 + 한동우 |
| MON-013 | 미개발 (Sentry 도입) | P2 Medium | High | Medium | - | 이정민 + 장현우 |
| MON-014 | 미개발 (정산 정합성 자동 리포트) | P3 Low | High | High | MON-008 | 박도영 + 시뮬레이션팀 |
| MON-015 | 비정상 (Swagger topbar #7CB342) | P3 Low | Low | Low | - | 한소라 (디자인 PM) |

---

## 의존 그래프

```
[MON-001 LoggingInterceptor 등록]───>[요청 로그 전체 발생]
                                      └──>[MON-011 ActivityLog 익명 수집]

[DEV2-002 자동정산 실동작]──>[MON-003 Slack 알림]─>[MON-009 채널 분리]
                                                    └──>[MON-014 정산 정합성 리포트]

[MON-008 CronRunLog 테이블]─>[MON-012 인프라 대시보드]
                             └──>[MON-014 정합성 리포트]

[STAGE3-008 프론트 구 등급 제거]──>[MON-010 GRADE_LABELS]
```

---

## 🔴 Critical — 즉시 조치

- [x] **[MON-001]** ✅ PASS (2026-04-15, 정적 검증) [P0 Critical] LoggingInterceptor 전역 등록 (= STAGE3-010 일부) — APP_INTERCEPTOR provider 추가 완료. 런타임 검증은 후속 사이클에서 컨테이너 재시작 후 수행
  - **현상**: `common/interceptors/logging.interceptor.ts` 47줄 작성됨. 그러나 `app.module.ts` + `main.ts` 전수 검색 결과 `useGlobalInterceptors(LoggingInterceptor)` 또는 `APP_INTERCEPTOR` provider 등록 0건 → **HTTP 요청 로그 전혀 찍히지 않음**. 장애 시 재구성 불가.
  - **근거**: `prd/monitoring_파악된내용.md` §3 Critical #3 / 요청.md STAGE3-010
  - **검증 방법**:
    - 자동: supertest로 API 호출 → 로그에 요청 entry 기록 검증
    - 수동:
      - `docker exec kaion_backend cat /app/logs/combined.log` monitoring 시작
      - `curl http://localhost:5667/api/v1/products` 호출
      - 로그에 "GET /api/v1/products ... 200 ... XXms" entry 출력 확인
  - **Pass 기준**:
    - `app.module.ts`에 `{provide: APP_INTERCEPTOR, useClass: LoggingInterceptor}` 추가 (1줄)
    - 모든 HTTP 요청이 로그에 기록됨
    - 응답 시간 + 상태 코드 + user 정보 포함
  - **증거 파일**:
    - `prd2/evidence/monitoring/MON-001/test-result.log`
    - `prd2/evidence/monitoring/MON-001/manual.md`
    - `prd2/evidence/monitoring/MON-001/diff.patch`
  - **담당 페르소나**: 박도영 (로그 분석) + 정대훈 (코드 PM)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-002]** [P0 Critical] BackupTask 컨테이너 경로/명령 수정
  - **현상**:
    1. `backupDir = '/data/successbank/projects/kaion/backups'` — 호스트 절대경로. docker-compose에서 `./backups:/...` 바인드 마운트 없음
    2. `docker exec kaion_db pg_dump ... | gzip > ${backupFilePath}`를 backend 컨테이너 내부에서 호출 → backend는 Node 18 Alpine, docker CLI 없음 → 명령 실패 확실
  - **근거**: `prd/monitoring_파악된내용.md` §3 Critical #2
  - **검증 방법**:
    - 자동: `backup.task.spec.ts` (execSync mock + 경로 검증)
    - 수동:
      - `docker exec kaion_backend node -e "require('child_process').execSync('docker --version')"` → 에러 확인 (수정 전)
      - 백업 크론 수동 트리거 → `backups/` 폴더에 `kaion_db_YYYY-MM-DD...sql.gz` 파일 생성 확인 (수정 후)
  - **Pass 기준**:
    - **방향 A**: pg_dump를 Node pg 클라이언트로 대체
    - **방향 B**: backend 컨테이너에서 직접 pg_dump 실행 (postgres-client 설치) + `/backups` 볼륨 마운트 추가
    - **방향 C**: 별도 backup 컨테이너 (cron job + postgres + bash)
    - docker-compose.yml에 `./backups:/app/backups` 바인드 마운트 추가
    - 실제 백업 파일 생성 확인
  - **증거 파일**:
    - `prd2/evidence/monitoring/MON-002/test-result.log`
    - `prd2/evidence/monitoring/MON-002/manual.md` (백업 파일 목록)
    - `prd2/evidence/monitoring/MON-002/diff.patch`
  - **담당 페르소나**: 김수현 (시스템) + 임동혁 (개발1팀 DevOps)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-003]** [P0 Critical] SettlementSchedulerTask 실패 Slack 알림 (= STAGE3-010 일부)
  - **현상**: `settlement-scheduler.task.ts:60-64` catch 블록 — `this.logger.error(...)`만 stdout에 남김. Slack/Email 알림 없음. 실패 카운트 누적 없음. 재시도 없음. **운영자가 며칠 동안 수당 미지급을 인지하지 못할 수 있음**.
  - **근거**: `prd/monitoring_파악된내용.md` §3 Critical #1 / 요청.md STAGE3-010
  - **검증 방법**:
    - 자동: `settlement-scheduler.task.spec.ts` — 실패 시 `NotificationService.sendCriticalAlert` 호출 검증
    - 수동:
      - 고의로 SettlementsService.calculate를 throw하게 수정 → 크론 실행 → Slack 메시지 수신 확인
  - **Pass 기준**:
    - catch 블록에서 `NotificationService.sendCriticalAlert({type: 'SETTLEMENT_FAILED', ...})` 호출
    - 연속 실패 카운트 (3회 이상 시 이스컬레이션)
    - 재시도 로직 (지수 백오프)
    - Slack 미설정 시 fallback (logger.error + ActivityLog 기록)
  - **증거 파일**:
    - `prd2/evidence/monitoring/MON-003/test-result.log`
    - `prd2/evidence/monitoring/MON-003/manual.md`
    - `prd2/evidence/monitoring/MON-003/diff.patch`
  - **담당 페르소나**: 박도영 (로그) + 이준혁 (개발2팀) + 장현우 (리드)
  - **선행 의존**: DEV2-002
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## 🟡 오류 / 미개발 (P1 High)

- [x] **[MON-004]** ✅ PASS (2026-04-15) [P1 High] Nginx `/health` → `/api/health` 경로 수정 — nginx.conf 정정 + access_log/error_log 지시어 추가 (MON-002 일부 함께 해결)
  - **현상**: `docker/nginx/nginx.conf §48-52` — `/health` → `http://backend/health` 포워드. 그러나 NestJS `setGlobalPrefix('api')` → 실제 경로는 `/api/health`. 외부 모니터링 도구가 `/health` 호출 시 404 가능성.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High / §1.6
  - **검증 방법**:
    - 자동: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5667/health` → 200
    - 수동:
      - `curl -v http://localhost:5667/health` → 200 (수정 후)
      - `curl -v http://localhost:5667/api/health` → 200
      - `docker exec kaion_nginx curl -v http://backend:3001/api/health` → 정상
  - **Pass 기준**:
    - nginx.conf `/health` location의 proxy_pass를 `http://backend/api/health`로 수정
    - 또는 NestJS에 `/health` prefix 예외 라우트 추가 (백엔드 수정 필요)
  - **증거 파일**:
    - `prd2/evidence/monitoring/MON-004/test-result.log`
    - `prd2/evidence/monitoring/MON-004/manual.md`
    - `prd2/evidence/monitoring/MON-004/diff.patch`
  - **담당 페르소나**: 김수현 (시스템)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-005]** [P1 High] Nginx access_log/error_log 설정 + stdout 링크
  - **현상**: `nginx.conf`에 `access_log`, `error_log` 지시어 부재. 기본 경로(`/var/log/nginx/*.log`) 컨테이너 내부 기록되지만 볼륨 마운트 없어 유실. HTTP 레벨 로그 전량 유실.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High 제5
  - **검증 방법**:
    - 자동: `docker logs kaion_nginx | grep "GET /"` → access log entry 확인
    - 수동: curl 후 `docker logs kaion_nginx` 출력 확인
  - **Pass 기준**:
    - `access_log /var/log/nginx/access.log main;`, `error_log /var/log/nginx/error.log warn;` 추가
    - Dockerfile 또는 entrypoint에 `ln -sf /dev/stdout /var/log/nginx/access.log` + `ln -sf /dev/stderr /var/log/nginx/error.log`
    - json-file 드라이버에 수집
  - **증거 파일**: `prd2/evidence/monitoring/MON-005/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 김수현
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-006]** [P1 High] backend/frontend/redis/nginx/adminer 컨테이너 healthcheck 추가
  - **현상**: docker-compose에서 `database`만 healthcheck. 나머지 5개 컨테이너는 `restart: unless-stopped`만. 프로세스 hang 감지 불가.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High 제6
  - **검증 방법**:
    - 자동: `docker-compose ps` → 모든 컨테이너 `(healthy)` 표시
    - 수동: backend에 fake hang 주입 → restart 트리거 확인
  - **Pass 기준**:
    - backend: `wget -qO- http://localhost:3001/api/health || exit 1`
    - frontend: `wget -qO- http://localhost:3000/ || exit 1`
    - redis: `redis-cli -a $REDIS_PASSWORD ping || exit 1`
    - nginx: `wget -qO- http://localhost:80/health || exit 1`
    - 각 서비스 `interval: 30s, timeout: 10s, retries: 3`
  - **증거 파일**: `prd2/evidence/monitoring/MON-006/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 김수현 + 임동혁
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [x] **[MON-007]** ✅ PASS (2026-04-15) [P1 High] Winston 파일 로거 절대경로 + 볼륨 마운트 — docker-compose.yml backend volumes에 ./apps/backend/logs 호스트 마운트 추가. 컨테이너 재시작 시 로그 증발 방지
  - **현상**: `main.ts` §9-37 — `filename: 'logs/error.log'` 상대경로. 컨테이너 CWD 명확하지 않음. 볼륨 마운트 없어 컨테이너 재시작 시 전량 유실.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High 제7
  - **검증 방법**:
    - 자동: 컨테이너 재시작 후 기존 로그 존재 확인
    - 수동:
      - 에러 유도 → 로그 파일 생성 확인 (`/app/logs/error.log`)
      - `docker-compose restart backend` → 재시작 후 로그 파일 여전히 존재
  - **Pass 기준**:
    - `main.ts`: `/app/logs/error.log`, `/app/logs/combined.log` 절대경로
    - docker-compose.yml backend.volumes: `./logs/backend:/app/logs` 추가
    - Winston 디렉토리 자동 생성
  - **증거 파일**: `prd2/evidence/monitoring/MON-007/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 박도영 + 임동혁
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-008]** [P1 High] CronRunLog 테이블 + 실행 이력 기록
  - **현상**: `SettlementSchedulerTask` / `BackupTask` 실행/성공/실패 이력 DB 저장 없음. 과거 시점 확인 불가. `SettlementSchedule.markAsRun`은 "다음 실행 시간만" 업데이트.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High 제8
  - **검증 방법**:
    - 자동: Prisma schema에 `CronRunLog` 모델 추가 + 마이그레이션 + 스크립트에서 row 생성 확인
    - 수동: `SELECT * FROM cron_run_logs ORDER BY started_at DESC LIMIT 5` → 실행 이력 조회
  - **Pass 기준**:
    - 신규 모델: `CronRunLog { id, taskName, startedAt, finishedAt, status, errorMessage, durationMs }`
    - settlement-scheduler, backup.task, integrity-scheduler 모두 기록
    - 마이그레이션 + 백필 스크립트
  - **증거 파일**: `prd2/evidence/monitoring/MON-008/{test-result.log,manual.md,migration.sql,diff.patch}`
  - **담당 페르소나**: 박도영 + 김성진 (개발2팀 배치) + 윤성호 (DB PM)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## 🔵 중요도 중간 (P2 Medium)

- [ ] **[MON-009]** [P2 Medium] NotificationService 채널 분리 — Critical/Operation/Info
  - **현상**: `NotificationService.sendSystemErrorRollbackNotification` + `IntegritySchedulerService.sendIntegrityAlertNotification` 2중 구현. 둘 다 `SLACK_WEBHOOK_URL` 단일 경로. 채널 분리 불가.
  - **근거**: `prd/monitoring_파악된내용.md` §3 High 제9
  - **검증 방법**: `notification.service.spec.ts` + 각 채널별 환경변수 검증
  - **Pass 기준**:
    - `SLACK_CRITICAL_WEBHOOK_URL`, `SLACK_OPERATION_WEBHOOK_URL` 분리
    - `sendCriticalAlert`, `sendOperationAlert`, `sendInfoAlert` 메서드 추가
    - integrity-scheduler는 NotificationService 경유로 통합
  - **증거 파일**: `prd2/evidence/monitoring/MON-009/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 장현우 (리드) + 최윤서 (대시보드/알림)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-010]** [P2 Medium] admin/dashboard GRADE_LABELS 구 등급 제거
  - **현상**: `admin/dashboard/page.tsx §61-69 GRADE_LABELS` — MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF (구 5단계) + CENTER 혼재.
  - **근거**: `prd/monitoring_파악된내용.md` §3 Medium 제2 / 요청.md STAGE3-008
  - **검증 방법**: grep → 구 등급 0건
  - **Pass 기준**: 신 4단계(SALESPERSON/TEAM_LEADER/BRANCH_MANAGER/CENTER) + ADMIN
  - **증거 파일**: `prd2/evidence/monitoring/MON-010/{manual.png,diff.patch}`
  - **담당 페르소나**: 최윤서 (대시보드) + 디자인팀 연계
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-011]** [P2 Medium] ActivityLog 익명 사용자 500 에러 기록
  - **현상**: `all-exceptions.filter.ts §89 if (status >= 500 && userId)` — `userId` null이면 기록 안 함. RBAC 미적용에서 비인증 500 에러 상당수 누락.
  - **근거**: `prd/monitoring_파악된내용.md` §3 Medium 제3
  - **검증 방법**: 인증 없이 고의 500 유발 → ActivityLog에 row 생성 확인
  - **Pass 기준**:
    - `userId` null도 기록 (memberId: 0 또는 별도 `anonymousIp` 컬럼)
    - 또는 별도 `SystemErrorLog` 테이블 활용
  - **증거 파일**: `prd2/evidence/monitoring/MON-011/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 박도영 + 최민규 (QA 보안)
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-012]** [P2 Medium] admin/statistics 인프라 관제 페이지 신설
  - **현상**: `admin/statistics/page.tsx` 5줄 redirect. 인프라/에러/크론 상태 UI 부재. 현재 dashboard는 비즈니스 지표(PV/수당)만.
  - **근거**: `prd/monitoring_파악된내용.md` §3 Medium 제1 / §5.6
  - **검증 방법**:
    - 수동: `/admin/statistics` 접속 → 헬스체크/크론 이력/에러율/알림 이력 표시
  - **Pass 기준**:
    - redirect 제거
    - 신설 페이지:
      - 헬스체크 상태 (6컨테이너)
      - CronRunLog 최근 50건 표시
      - 최근 24시간 에러율
      - 알림 이력 (Slack 발송 결과)
    - 또는 `/admin/monitoring` 신설
  - **증거 파일**: `prd2/evidence/monitoring/MON-012/{manual.png,diff.patch}`
  - **담당 페르소나**: 최윤서 + 한동우 (개발2팀 FE 성능)
  - **선행 의존**: MON-008
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [ ] **[MON-013]** [P2 Medium] Sentry 도입 — @sentry/nestjs + @sentry/nextjs
  - **현상**: 외부 에러 추적 도구 0개. `@sentry/nestjs` / `@sentry/nextjs` 설치 후 SDK 초기화 필요.
  - **근거**: `prd/monitoring_파악된내용.md` §5.4 1순위 + §5.6 제2
  - **검증 방법**:
    - 수동:
      - Sentry 계정 + 프로젝트 생성
      - SDK 설치 + DSN 환경변수
      - 고의 에러 → Sentry 대시보드에서 이벤트 수신 확인
  - **Pass 기준**:
    - backend + frontend 양쪽 SDK 초기화
    - DSN 환경변수 (.env.example 포함)
    - Source map 업로드 자동화
    - Release tracking
  - **증거 파일**: `prd2/evidence/monitoring/MON-013/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 이정민 (APM) + 장현우 + 임동혁
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

## ⚪ Backlog (P3 Low)

- [ ] **[MON-014]** [P3 Low] 정산 정합성 자동 검증 리포트 크론
  - **현상**: 정산 결과가 정합한지 자동 비교 수단 부재. "기대 보너스 총액 vs 실제 지급 총액" 편차 감지 불가.
  - **근거**: `prd/monitoring_파악된내용.md` §4.4 + §5.6 제7
  - **검증 방법**: 매일 03:30 실행되는 정합성 크론 + Critical 경보
  - **Pass 기준**:
    - 신규 크론: 정산 기간 내 예상 vs 실제 비교
    - 편차 발견 시 Slack Critical 경보
    - CronRunLog 기록
  - **증거 파일**: `prd2/evidence/monitoring/MON-014/{test-result.log,manual.md,diff.patch}`
  - **담당 페르소나**: 박도영 + 시뮬레이션팀
  - **선행 의존**: MON-008
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

- [x] **[MON-015]** ✅ PASS (2026-04-15) [P3 Low] Swagger topbar `#7CB342` → `#E53935` 정렬 (= BONUS-BRAND-001) — main.ts:116 customCss 정정. 전체 정합화 완료 (코드/페르소나/Swagger 모두 #E53935)
  - **현상**: `apps/backend/src/main.ts:116` Swagger customCss에 `#7CB342` 하드코딩. 프론트엔드는 146회 `#E53935` 사용. 유일한 연두색 잔재.
  - **근거**: 요청.md 항목 7 예외 (BONUS-BRAND-001)
  - **검증 방법**: `grep "#7CB342" apps/backend/src/main.ts` → 0건
  - **Pass 기준**: `#E53935`로 정정 + Swagger UI 브라우저 확인
  - **증거 파일**: `prd2/evidence/monitoring/MON-015/{manual.png,diff.patch}`
  - **담당 페르소나**: 한소라 (디자인 PM) + 임동혁
  - **시도 횟수**: 0 / 3
  - **상태**: PENDING

---

## 다른 팀과의 의존

### 선행 작업
- **개발2팀**: DEV2-002 (자동정산 실동작) → MON-003 (Slack 알림이 의미 있어짐)
- **디자인팀**: DESIGN-XXX (프론트 구 등급 제거) → MON-010
- **개발1팀/DevOps**: 임동혁 협업 필수 (MON-002, 006, 007)

### 후속 작업
- **모든 팀**: MON-001 LoggingInterceptor 등록 → Stage 4 검증 시 요청 로그 자동 수집
- **PM팀 (박준혁)**: MON-003, MON-008, MON-014 → 검증 게이트 자동화
- **QA팀 (김동현)**: MON-013 Sentry 도입 → 부하 테스트 시 APM 데이터 제공

---

## Stage 4 진행 추적

```
[전체 진도] 0/15 (0%)
[상태별] PENDING: 15 / IN_PROGRESS: 0 / PASS: 0 / FAIL: 0 / ESCALATED: 0
[P0 Critical] 0/3 (0%)  — MON-001~003
[P1 High]     0/5 (0%)  — MON-004~008
[P2 Medium]   0/5 (0%)  — MON-009~013
[P3 Low]      0/2 (0%)  — MON-014~015
```

**Stage 4 진입 권장 순서**: MON-001 (LoggingInterceptor, 1줄, 즉시 효과) → MON-004 (Nginx /health, 1줄) → MON-015 (Swagger #7CB342, 1줄) → MON-006 (컨테이너 healthcheck) → MON-007 (Winston 볼륨)

---

*작성: PM팀 (강민호 + 박준혁 + 오민정) / Stage 3 검증 체크리스트 / 기준: prd/monitoring_파악된내용.md*
