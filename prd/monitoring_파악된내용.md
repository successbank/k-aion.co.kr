# 모니터링팀 파악된 내용

> **작성 주체**: 모니터링팀 (5명 — 장현우 리드, 김수현 시스템, 이정민 APM, 박도영 로그, 최윤서 대시보드)
> **작성 목적**: Stage 1 — Kaion 모니터링 영역 현재 상태 파악 및 향후 개발 참조 문서
> **전제 원칙**: READ-ONLY 분석, 코드 수정 없음
> **핵심 메시지**: **Kaion 모니터링 체계는 "NestJS Logger stdout + Docker json-file 로그 회전"이 전부**. APM 없음, 중앙 로그 수집 없음, 알림 체계 2건만 존재(둘 다 Slack webhook 1경로). **자동정산 크론이 실패해도 운영자는 눈치채지 못한다.**

---

## 1. 담당 영역 인벤토리

### 1.1 모니터링 대상 인프라 (Docker 6컨테이너)

| 컨테이너 | 역할 | 내부 포트 | 호스트 포트 | 헬스체크 | 로그 드라이버 |
|---------|------|---------|-----------|---------|-------------|
| `kaion_backend` | NestJS API | 3001 | (Nginx 경유) | ❌ 없음 | json-file 10m×3 |
| `kaion_frontend` | Next.js | 3000 | (Nginx 경유) | ❌ 없음 | json-file 10m×3 |
| `kaion_nginx` | 리버스 프록시 | 80 | `${WEB_PORT}` (5667) | ❌ 없음 | json-file 10m×3 |
| `kaion_db` | PostgreSQL 15 Alpine | 5432 | `${DB_PORT}` (5668) | ✅ `pg_isready` 10s/5s/5retry | json-file 10m×3 |
| `kaion_redis` | Redis 7 Alpine | 6379 | `${REDIS_PORT}` (5669) | ❌ 없음 | json-file 10m×3 |
| `kaion_adminer` | DB UI | 8080 | `${ADMINER_PORT}` (5670) | ❌ 없음 | json-file 10m×3 |

- **네트워크**: `app-network` (bridge, 프로젝트 local, `shared_*` 외부 네트워크 미사용)
- **볼륨 (상태 보존 대상)**: `postgres_data`, `redis_data`, `backend_node_modules`, `backend_app_node_modules`, `frontend_node_modules`, `frontend_app_node_modules`, `frontend_next`
- **로그 템플릿**: `x-logging: {driver: json-file, options: {max-size: 10m, max-file: 3}}` — 모든 서비스 상속
- **파일 경로**: `/data/successbank/projects/kaion/docker-compose.yml`

### 1.2 Nginx 라우팅 (단일 진입점 5667)

- **파일**: `/data/successbank/projects/kaion/docker/nginx/nginx.conf` (54줄, `events {worker_connections 1024}` + `http {...}`)
- **upstream 정의**: `frontend → frontend:3000`, `backend → backend:3001`
- **location 규칙**:
  - `/` → Frontend (Next.js dev HMR용 `proxy_buffering off`, `Upgrade/Connection` 헤더)
  - `/api/` → Backend (동일 WebSocket 헤더)
  - `/health` → Backend `/health` (직접 프록시)
- **미구현**: `access_log`, `error_log` 지시어 **부재** → Nginx가 기본 경로(`/var/log/nginx/access.log`, `error.log`)에 쓰지만 볼륨 마운트 없어서 컨테이너 재시작 시 **전량 유실**

### 1.3 NestJS 로깅 체계

- **Winston 로거 설정**: `apps/backend/src/main.ts` §9-37
  - Console transport (colorize + timestamp + custom printf)
  - File transport `logs/error.log` (level=error, JSON)
  - File transport `logs/combined.log` (all levels, JSON)
  - **상대경로 `logs/`** → 컨테이너 내부 `/app/logs/` 또는 `/app/apps/backend/logs/` 어딘가 (볼륨 마운트 없음 → **컨테이너 재시작 시 로그 유실**)
- **App 생성**: `NestFactory.create(AppModule, {logger})` — 전역 대체 로거 사용
- **Global Prefix**: `/api`
- **CORS origin**: `process.env.FRONTEND_URL || 'http://localhost:3000'` (Nginx 환경에서는 동일 출처라 문제 없음)
- **Swagger**: `/api` (문서 생성, 브랜드 컬러 #7CB342 topbar 커스텀)

### 1.4 요청 로깅 인터셉터

- **파일**: `apps/backend/src/common/interceptors/logging.interceptor.ts` (47줄)
- **기능**: method/url/body/user + 응답 시간/상태 로그
- **TODO 주석 존재**: "향후 AuditLog 모델을 추가하여 DB에 저장"
- **❌ 전역 등록 누락**: `app.module.ts`와 `main.ts` 전수 검색 결과 `useGlobalInterceptors(LoggingInterceptor)` 또는 `APP_INTERCEPTOR` provider 등록 **전혀 없음** → 작성은 되어 있으나 **런타임에서 실행되지 않는 죽은 코드**

### 1.5 전역 Exception Filter

- **파일**: `apps/backend/src/common/filters/all-exceptions.filter.ts` (178줄)
- **등록**: `app.module.ts` §26 import + §73 `APP_FILTER` provider (`useClass: AllExceptionsFilter`) — ✅ 전역 활성
- **기능**:
  - 모든 예외 Catch → HTTP 상태 결정
  - `Logger.error(...)` (500+ 스택 트레이스 포함) / `Logger.warn(...)` (400+)
  - **Activity Log 비동기 기록** — `status >= 500 && userId` 조건일 때만 `prisma.activityLog.create({action: 'ERROR_OCCURRED', targetType: 'SYSTEM', details: {...}})`. 실패는 무시(응답 영향 없음)
  - 일관된 JSON 에러 응답 (`statusCode`, `message[]`, `error`, `timestamp`, `path`)
- **TODO 주석 존재**:
  - `isCriticalError()` stub — "향후 Slack/Email 알림 연동 시 사용" (미구현, `_` 언더스코어 prefix로 lint 회피)

### 1.6 헬스체크 엔드포인트

- **파일**: `apps/backend/src/health/health.controller.ts` (63줄)
- **모듈**: `apps/backend/src/health/health.module.ts` (controller 등록만)
- **엔드포인트 3종** (`@Public()` 데코레이터로 인증 면제):
  - `GET /api/health` — DB `SELECT 1` 연결 테스트 + `uptime` + `memory.{heapUsed, heapTotal, external}` + `environment`
  - `GET /api/health/ready` — Kubernetes Readiness (DB 연결 확인 후 `{status: 'ready'}`, 실패 시 throw)
  - `GET /api/health/live` — Kubernetes Liveness (단순 `{status: 'alive'}`)
- **Nginx 경로**: `http://localhost:5667/health` → backend `/health`로 프록시 (⚠️ 그런데 NestJS는 `setGlobalPrefix('api')`이므로 실제 경로는 `/api/health`. **nginx.conf가 `/api` prefix 없이 `/health`로 포워딩하는데 backend에는 `/health` 라우트 없음 → 404 가능성** — Stage 2 검증 대상)

### 1.7 크론 작업 (@nestjs/schedule)

- **전역 등록**: `apps/backend/src/app.module.ts` §27 import + §59 `ScheduleModule.forRoot()` ✅
- **모듈**: `apps/backend/src/tasks/tasks.module.ts` — `BackupTask`, `IntegritySchedulerService`, `SettlementSchedulerTask` 3종 provider/export

| 크론 | 스케줄 | 기능 | 알림 경로 |
|-----|--------|------|----------|
| `SettlementSchedulerTask.handleScheduledSettlement` | `0 * * * * *` (매분 0초) | `SettlementSchedule` 테이블에서 `isActive && nextRunAt ≤ now` 찾아 `createAutoSettlement()` 호출 | ❌ 없음 (logger.error만) |
| `IntegritySchedulerService.runDailyIntegrityCheck` | `0 3 * * *` (매일 03:00) | `IntegrityCheckService.runFullIntegrityCheck(true)` (자동 수정) + `saveCheckHistory` | ✅ Slack (SLACK_WEBHOOK_URL) |
| `BackupTask.handleDailyBackup` | `CronExpression.EVERY_DAY_AT_2AM` (매일 02:00) | `docker exec kaion_db pg_dump ... \| gzip > /data/.../backups/kaion_db_*.sql.gz` + 30일 이상 삭제 | ❌ 없음 (logger.error만) |

### 1.8 알림 서비스

- **파일**: `apps/backend/src/notifications/notification.service.ts` (219줄)
- **클래스**: `NotificationService`
- **환경변수**: `process.env.SLACK_WEBHOOK_URL`, `process.env.ADMIN_BASE_URL`
- **제공 메서드**:
  - `sendSystemErrorRollbackNotification(data)` — 회원 롤백 발생 시 Slack Block Kit 메시지 발송 (현재 이 메서드만 존재)
- **기타**: `apps/backend/src/tasks/integrity-scheduler.service.ts`도 자체적으로 `fetch(slackWebhookUrl, {...blocks...})` 직접 호출 (NotificationService 경유 안 함) — **2중 구현** 상태
- **미구현 통로**: Email/SMS/PagerDuty/OpsGenie 등 전무

### 1.9 대시보드 (프론트엔드)

- **redirect stub**: `apps/frontend/src/app/admin/statistics/page.tsx` (6줄) — `redirect('/admin/dashboard')`만 함. 실질 대시보드 아님
- **실제 대시보드**: `apps/frontend/src/app/admin/dashboard/page.tsx` (80줄 이상)
  - Ant Design 5 (Row/Col/Card/Statistic/Table/Progress/Tag/List/Avatar)
  - Recharts (PieChart, LineChart, AreaChart)
  - 데이터 소스: `profileService` (`MyProfile`, `MyPerformance`, `MyOrganization`, `AdminStats`)
  - 표시 지표: 누적 PV, 이번달 매출/보너스, 팀원 수, 등급 진척도 — **모두 "비즈니스 KPI"**, 인프라/에러 지표 없음
  - ⚠️ `GRADE_LABELS`에 신/구 등급 혼재 — `MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF/CENTER/ADMIN` 모두 매핑 (Stage 2 대상)

### 1.10 APM / 중앙 로그 / 외부 도구 — **전무**

`grep -i "sentry\|datadog\|newrelic\|prometheus\|grafana"` 결과 의미 있는 매치 0건 (history 페이지와 taskmaster JSON에만 언급). **외부 APM/에러 추적 도구 0개 연동**.

---

## 2. 기능별 정상 작동 여부

| 기능 | 상태 | 근거 |
|------|------|------|
| Winston 파일 로거 (`logs/error.log`, `logs/combined.log`) | ⚠️ **부분** | 설정은 됨. 그러나 **상대경로 + 볼륨 마운트 부재** → 컨테이너 재시작 시 유실. 또한 쓰기 대상 디렉토리 자동 생성 코드 없음 (Winston이 디렉토리 자동 생성 여부 의존) |
| Docker json-file 로그 회전 (10m×3) | ✅ 정상 | 모든 서비스에 `x-logging` anchor 상속 적용됨 |
| Nginx access/error log | ❌ **미구현** | `nginx.conf`에 지시어 자체가 없음. 기본 경로 저장도 볼륨 미마운트 → 사실상 무감 |
| NestJS Logger (Winston 대체) | ✅ 정상 | `main.ts`에서 `NestFactory.create(AppModule, {logger})` 대체 적용 |
| `LoggingInterceptor` (HTTP 요청/응답 로그) | ❌ **죽은 코드** | 클래스 작성됨, **전역 등록 누락** (`useGlobalInterceptors` / `APP_INTERCEPTOR` 없음) → 런타임 비활성 |
| `AllExceptionsFilter` (전역 예외 처리) | ✅ 정상 | `app.module.ts` `APP_FILTER` 프로바이더 등록 확인 |
| ActivityLog 에러 기록 (500+) | ⚠️ **부분** | 코드 존재. 단 `userId` 없는 요청(비로그인)은 기록 안 됨. RBAC 미적용이라 실제로 인증 없이 들어오는 500이 많을 가능성 |
| `GET /api/health` (DB 연결 + 메모리) | ✅ 정상 | 로직 명확, `@Public()` 적용 |
| `GET /api/health/ready` | ✅ 정상 | DB 쿼리 실패 시 throw → 502 반환 |
| `GET /api/health/live` | ✅ 정상 | 무조건 200 |
| Nginx `/health` → backend `/health` 프록시 | ⚠️ **불일치 의심** | Nginx는 `/health`로 포워드하지만 NestJS는 `setGlobalPrefix('api')` → 실제 경로는 `/api/health`. **컨테이너에서 curl로 재확인 필요** (Stage 2) |
| `kaion_db` 헬스체크 (`pg_isready`) | ✅ 정상 | `backend.depends_on.database.condition: service_healthy` 사용 중 |
| `kaion_redis`/`kaion_nginx`/`kaion_backend` 컨테이너 헬스체크 | ❌ **미구현** | docker-compose에 healthcheck 섹션 없음 |
| `SettlementSchedulerTask` (매분 자동정산) | ✅ 정상 동작, ⚠️ **모니터링 부재** | `@Cron('0 * * * * *')` 등록. 실패 시 `this.logger.error(...)` **stdout만**. Slack/Email 알림 없음. 실패 연속 카운트 없음. 재시도 없음 |
| `IntegritySchedulerService` (매일 03시) | ✅ 정상 + **알림 동작** | `SLACK_WEBHOOK_URL` 환경변수 있으면 Slack Block Kit 발송. 없으면 `logger.warn` 후 silent |
| `BackupTask` (매일 02시 pg_dump) | ❌ **컨테이너 경로 문제** | `this.backupDir = '/data/successbank/projects/kaion/backups'` — **이 경로는 호스트 기준**. docker-compose의 `backend` volumes에 `./backups` 바인드 마운트 없음 → 컨테이너 내부에서 해당 경로 생성/쓰기 시도 → mkdir은 성공할 수 있지만 호스트 backups 폴더와 연결 안 됨. 또한 `docker exec kaion_db pg_dump ...` 명령을 **backend 컨테이너 안에서 실행** → backend 컨테이너에는 docker CLI 없음 → **명령 자체 실패 가능성 높음** |
| 관리자 대시보드 (`/admin/dashboard`) | ✅ 비즈니스 UI 동작 | 렌더링은 됨. 단 **모니터링 지표 전무** (에러율, 응답시간, 크론 상태, 헬스체크 결과 없음) |
| `/admin/statistics` | ⚠️ **stub 경로** | 단순 redirect. 실제 통계 페이지는 `/admin/dashboard` |
| 외부 APM (Sentry, Datadog 등) | ❌ **미도입** | 의존성/설정/SDK 전무 |
| 중앙 로그 수집 (Elastic/Loki/Fluentd) | ❌ **미도입** | 동일 |
| 메트릭 수집 (Prometheus exporter) | ❌ **미도입** | 동일 |

---

## 3. 발견된 이슈

### [Critical] 자동정산 크론 실패 추적 불가

- **현상**: `SettlementSchedulerTask.handleScheduledSettlement`가 실패하면 `this.logger.error(...)`를 컨테이너 stdout에 남길 뿐. Slack/Email 알림 없음. 실패 카운트 누적 없음. 운영자가 **며칠 동안 수당이 지급되지 않아도 알 길이 없음**.
- **영향**: 수당 체인의 최종 관문인 정산이 조용히 실패 → 회원 클레임이 접수될 때까지 운영자 미인지. MLM 신뢰 즉시 붕괴.
- **위치**: `apps/backend/src/tasks/settlement-scheduler.task.ts` §26-71, §60-64 catch 블록
- **연관**: 최근 `b6ca264 자동정산기능` 커밋으로 도입 — 초기 운영기 데이터 축적 전
- **담당**: 박도영(로그 분석) + 이정민(APM) — Stage 3/4에서 알림 경로 추가 요청

### [Critical] BackupTask 동작 불능 의심 (컨테이너 경로/명령 불일치)

- **현상**:
  1. `backupDir = '/data/successbank/projects/kaion/backups'` — 호스트 절대경로. docker-compose에서 `./backups:/...` 바인드 마운트 없음. 컨테이너 내부에서 해당 경로는 존재하지 않거나 mkdir로 만들어도 호스트 폴더와 분리됨.
  2. `docker exec kaion_db pg_dump ... | gzip > ${backupFilePath}`를 backend 컨테이너에서 실행 — backend는 Node 18 Alpine 베이스, **docker CLI 미포함** → `docker: command not found` 가능성 매우 높음.
- **영향**: 매일 02시 "자동 DB 백업" 크론은 선언만 되어 있고 **실제 백업 파일이 생성되지 않을 수 있음**. 장애 발생 시 롤백 수단 전무.
- **증거**:
  - `backups/` 호스트 디렉토리에 파일 존재: `backup_20260120_064410.sql`, `beaugem_db_20260120_042107.sql`, `pre-integration-20260120` — 모두 **수동 실행 흔적** (파일명 규약이 `kaion_db_${ISO}` 아님, 특히 `beaugem_db_` prefix는 다른 프로젝트 파일로 추정). 자동 크론 출력 `kaion_db_YYYY-MM-DDTHH-MM-SS.sql.gz` 패턴 파일 **0건**.
- **위치**: `apps/backend/src/tasks/backup.task.ts` §22, §71
- **담당**: 김수현(시스템) + 장현우(리드) → 개발1팀 임동혁(DevOps) 수정 요청

### [Critical] `LoggingInterceptor`가 전역 등록되지 않은 죽은 코드

- **현상**: `logging.interceptor.ts`는 작성 완료. 하지만 `app.module.ts`/`main.ts` 전수 검색에서 `useGlobalInterceptors` 또는 `APP_INTERCEPTOR` 프로바이더 등록 **없음**. 결과: **HTTP 요청 로그가 전혀 찍히지 않음**. 운영자가 어떤 API가 호출되는지 알 수 없음.
- **영향**:
  - 장애 시 "누가, 언제, 어떤 API를 호출했는지" 재구성 불가
  - 비정상 패턴 탐지 불가 (특히 Task #44.5 RBAC 미적용 상태에서 무인증 호출 탐지 필요)
  - 수당 체인의 단계별 트랜잭션 시작/종료 로그 없음 → 정산 실패 원인 분석이 오로지 Exception filter 에러 로그에 의존
- **위치**: `apps/backend/src/common/interceptors/logging.interceptor.ts`, `apps/backend/src/app.module.ts`
- **수정 방안**: `app.module.ts`에 `{provide: APP_INTERCEPTOR, useClass: LoggingInterceptor}` 추가 — 1줄
- **담당**: 박도영(로그) + 정대훈(PM 코드 일관성) → Stage 4 증거 수집

### [High] Nginx `/health` 라우팅 경로 불일치

- **현상**: `nginx.conf` §48-52에서 `/health` → `http://backend/health`로 포워드. 그런데 `main.ts`에서 `app.setGlobalPrefix('api')` 설정 → 실제 NestJS 엔드포인트는 `/api/health`. 결과: `http://localhost:5667/health` 호출 시 backend가 404 반환 가능성.
- **영향**: 외부 모니터링 도구(k8s probe, uptime robot 등)가 `/health`를 치면 실패 → 운영 가시성 하락
- **검증 방법** (Stage 2에서 실측):
  ```bash
  curl -v http://localhost:5667/health      # 예상: 404 또는 /api/health에 도달 실패
  curl -v http://localhost:5667/api/health  # 예상: 정상 JSON
  docker exec kaion_nginx curl -v http://backend:3001/health     # 예상: 404
  docker exec kaion_nginx curl -v http://backend:3001/api/health # 예상: 정상
  ```
- **위치**: `docker/nginx/nginx.conf` §48-52, `apps/backend/src/main.ts` §44
- **수정 방안**: nginx `/health` location의 `proxy_pass`를 `http://backend/api/health`로 변경 또는 NestJS에 prefix 예외 라우트 추가
- **담당**: 김수현(시스템)

### [High] Nginx access/error log 부재

- **현상**: `nginx.conf`에 `access_log`, `error_log` 지시어 없음. 기본 경로(`/var/log/nginx/*.log`)는 컨테이너 내부에 기록되지만 볼륨 미마운트 → 컨테이너 재시작 시 유실. 또한 Docker json-file 로그에도 기본적으론 stderr만 캡처 (access log는 기본적으로 `/var/log/nginx/access.log`).
- **영향**:
  - HTTP 요청 레벨 로그(IP, URL, 응답 코드, 응답 시간) 전량 유실
  - DDoS/봇 탐지 불가
  - 404/502 패턴 분석 불가
- **수정 방안**: `access_log /var/log/nginx/access.log main;`와 `error_log /var/log/nginx/error.log warn;` 추가 + Docker stdout 리다이렉트(`ln -sf /dev/stdout /var/log/nginx/access.log`)로 json-file 드라이버에 수집
- **담당**: 김수현(시스템)

### [High] 컨테이너 헬스체크 5개 누락

- **현상**: docker-compose에서 `database`만 `healthcheck` 블록 보유. `backend`, `frontend`, `nginx`, `redis`, `adminer`는 헬스체크 없음 → `restart: unless-stopped`만 의존 → 프로세스는 살아있지만 응답이 hang된 상태 감지 불가
- **영향**:
  - backend NestJS가 메모리 leak으로 응답 불능이어도 Docker가 재시작 안 함
  - Redis `requirepass` 잘못 설정으로 연결 실패해도 컨테이너는 "healthy" 표시
- **수정 방안**: 각 서비스에 `healthcheck.test` 추가. backend는 `wget -qO- http://localhost:3001/api/health || exit 1`, redis는 `redis-cli -a $REDIS_PASSWORD ping || exit 1` 등
- **담당**: 김수현(시스템) + 장현우(리드)

### [High] Winston 파일 로거 경로/유실 문제

- **현상**: `main.ts`에서 `filename: 'logs/error.log'`, `'logs/combined.log'` — 상대경로. 컨테이너 내부 CWD가 `/app` 또는 `/app/apps/backend`인지 명확하지 않음. 어느 경로든 볼륨 마운트 없음 → **컨테이너 재시작 시 전량 유실**. 또한 디렉토리 자동 생성 여부는 Winston 버전 의존.
- **영향**: 가장 중요한 에러 로그가 재시작마다 유실 → 사후 분석 불가능
- **수정 방안**:
  1. 절대경로 사용 (`/app/logs/...`)
  2. docker-compose `backend.volumes`에 `./logs/backend:/app/logs` 추가
  3. 또는 stdout 전용으로 변경 후 중앙 로그 수집 도구 도입
- **담당**: 박도영(로그) + 이정민(APM)

### [High] 크론 작업 실행 이력 DB 미기록 (integrity-check 제외)

- **현상**:
  - `IntegrityCheckService.saveCheckHistory(report)` — 이력 저장 ✅
  - `SettlementSchedulerTask` — 실행/성공/실패 이력 저장 **없음**. `SettlementSchedule.markAsRun`은 "다음 실행 시간만" 업데이트하는 것으로 보임. `SettlementExecutionLog` 같은 테이블 부재
  - `BackupTask` — 이력 테이블 없음, 파일 목록(`getBackupList`)만 파일시스템에서 조회
- **영향**: 과거 어느 시점에 자동정산/백업 크론이 실행됐는지 확인 불가. 실패 이력 추적 불가.
- **수정 방안**: `CronRunLog` 테이블 신설 (task_name, started_at, finished_at, status, error_message, duration_ms) — Stage 3 체크리스트 등록 권장
- **담당**: 박도영(로그) + 개발2팀 김성진(배치/ETL) 협업

### [High] Slack 알림이 `SLACK_WEBHOOK_URL` 단일 경로만 사용 + 2중 구현

- **현상**:
  1. `NotificationService.sendSystemErrorRollbackNotification` — 회원 롤백 전용
  2. `IntegritySchedulerService.sendIntegrityAlertNotification` — 무결성 검사 결과 전용 (NotificationService 경유 안 하고 `fetch` 직접 호출)
  - **2개 모두 같은 `process.env.SLACK_WEBHOOK_URL`을 사용** → 채널 분리 불가
  - `SLACK_WEBHOOK_URL` 미설정 시 둘 다 silent (`logger.warn`만)
  - `.env` 확인 필요: 현재 설정되어 있는지 Stage 2 실측 대상
- **영향**:
  - Critical 경보와 정보 수준 알림을 같은 채널에 섞어서 보냄 → 알림 피로도 증가 → 진짜 Critical 놓침
  - 2중 구현으로 인한 메시지 포맷 불일치 → 관제자 인지 부담
- **수정 방안**: `NotificationService`에 채널별 라우팅 메서드 추가 (`sendCriticalAlert`, `sendOperationAlert`), 환경변수 `SLACK_CRITICAL_WEBHOOK_URL` / `SLACK_OPERATION_WEBHOOK_URL` 분리. `integrity-scheduler`는 `NotificationService` 경유로 변경
- **담당**: 장현우(리드) + 최윤서(대시보드/알림)

### [Medium] `admin/statistics` 페이지 단순 redirect stub

- **현상**: 6줄짜리 `redirect('/admin/dashboard')`. 본래 관제 대시보드가 들어가야 할 위치
- **영향**: 현재 대시보드(`/admin/dashboard`)는 비즈니스 지표(PV, 수당, 팀원 수)만 표시 → 인프라/에러/크론 상태 UI 없음
- **수정 방안**: `/admin/statistics`를 **인프라 관제 대시보드**로 재구성 (헬스체크 상태, 크론 실행 이력, 최근 에러율, 자동정산 성공/실패 카운트 표시). 또는 별도 `/admin/monitoring` 페이지 신설
- **담당**: 최윤서(대시보드)

### [Medium] 관리자 대시보드의 등급 라벨 신/구 혼재

- **현상**: `admin/dashboard/page.tsx` §61-69 `GRADE_LABELS` 객체에 `MEMBER/AGENT/MANAGER/BRANCH_CHIEF/DIVISION_CHIEF`(구 5단계)와 `CENTER`(신 체계)가 혼재
- **영향**: 모니터링 관점에서 직접적이진 않지만, 대시보드의 정보가 구/신 체계 섞여 혼란. 향후 알림 메시지에서도 등급 라벨 일관성 문제
- **담당**: 최윤서(대시보드) → Stage 2 디자인팀 연계

### [Medium] ActivityLog 에러 기록의 익명 사용자 누락

- **현상**: `all-exceptions.filter.ts` §89 `if (status >= 500 && userId)` — `userId`가 null이면 기록 안 함. RBAC 미적용 상태에서 비인증 호출로 발생한 500 에러는 기록 안 됨
- **영향**: 실제로 발생하는 에러 상당수가 누락될 수 있음 (특히 로그인 전 흐름, 토큰 만료 후 호출 등)
- **수정 방안**: `userId`가 없어도 `memberId: 0` 또는 별도 컬럼(`anonymousIp`)으로 기록하거나, ActivityLog가 아닌 별도 `SystemErrorLog` 테이블 활용
- **담당**: 박도영(로그) + 최민규(QA 보안)

### [Medium] 알림 서비스가 Slack만 지원

- **현상**: `NotificationService`는 `fetch(slackWebhookUrl, ...)`만 구현. Email, SMS, PagerDuty, OpsGenie, Teams 등 전무
- **영향**: Slack 장애 시 또는 야간 운영자 부재 시 Critical 경보가 전달 안 됨. MTTD/MTTR 목표 달성 불가
- **담당**: 장현우 + 최윤서

### [Low] SettlementSchedulerTask 매분 실행 비용

- **현상**: `@Cron('0 * * * * *')`로 매분 쿼리 실행. 대부분 dueSchedules 없어 early return하지만 DB 한 번 찍음. 운영기 회원 수 100만 시 DB 부하 무시 못 함
- **수정 방안**: 스케줄 테이블에서 가장 빠른 `nextRunAt`를 조회해서 `setTimeout`으로 동적 대기 (BullMQ delayed job 전환 권장)
- **담당**: 이정민(APM) + 개발2팀

### [Low] Swagger 엔드포인트가 전역 접근 가능

- **현상**: `main.ts` §114 `SwaggerModule.setup('api', ...)` — 인증 보호 없음. 브라우저로 직접 `http://localhost:5667/api` 접근 가능
- **영향**: 개발/운영 구분 없이 API 스키마 전체 노출 → 공격면 확대
- **담당**: 최민규(QA 보안)

---

## 4. 보상플랜 관련 내용 — 모니터링 관점

모니터링팀은 보상플랜 매트릭스(5제품 × 4등급) 자체를 구현하지는 않지만, **정산 체인의 관측 가능성**을 보증하는 역할이다.

### 4.1 보상플랜 매트릭스 (이미지 기준, 감시 대상 금액)

| 제품 | 판매원 | 팀장 | 지사장 | 센터 | 판매가 |
|------|--------|------|--------|------|--------|
| 고주파(온체) | 50만 | 100만 / 지점 120만 | 20만 (소계 5만) | 5만 | 330만 |
| 펄스온 (저주파) | 40만 | 80만 | 15만 | 5만 | 249만 |
| 제트5 (초음파) | 25만 | 50만 | 5만 | 5만 | 150만 |
| 통증 패치 | (빈칸) | 2만 | 4,800 | 2,400 | 4만8천 |
| 전용젤 | (빈칸) | 1만5천 | 3,000 | 1,500 | 3만 |

→ 모니터링팀은 이 **금액 합계가 판매 1건당 발생한 Bonus 레코드 총합과 일치하는지**를 크론 실행 후 검증 (데이터 기반 운영 경보)해야 하지만, **현재 그 검증 자체가 없음**.

### 4.2 자동정산 크론의 감시 요구사항 (현재 부재)

`settlement-scheduler.task.ts`가 실행할 때마다 다음 지표를 기록해야 하지만 **현재 모두 미기록**:

- **실행 시작 시각 / 종료 시각** — DB에 `CronRunLog` 부재
- **생성된 Settlement 건수** — `createAutoSettlement()` 반환값만 stdout 로그
- **정산 대상 기간** (`weekCode`) — 로그에 포함되지만 DB 이력 없음
- **정산 총액** — 로그 없음
- **6종 보너스 → 신 2종 체계 매핑 검증** — PRD 정합화 이후 자동 검증 없음
- **회원별 보너스 지급 성공/실패 카운트** — 부분 실패 감지 불가
- **이전 정산과의 연속성** — 누락된 주차 감지 불가

### 4.3 정산 체인 단계별 APM 추적 요구사항 (현재 부재)

이정민(APM)의 관점: 정산 체인 `sales → recognized-sales → commission-rates → compensation-plan → bonuses → settlements`의 각 단계 응답시간을 P50/P95/P99로 집계해야 하지만, **현재 APM 도구 없음 + LoggingInterceptor 비활성**이라 트랜잭션 경계 추적 자체가 불가.

- **핫스팟**: `apps/backend/src/members/genealogy-raw-queries.ts` — 재귀 CTE raw SQL. 100만 회원 시 재귀 깊이/수평 팀 탐색이 `SettlementSchedulerTask` 트랜잭션 타임아웃 주범 가능성. **성능 지표 수집 필수** — 단, `리팩터 금지` 절대 원칙 유지

### 4.4 매트릭스 부재로 인한 운영 리스크

- **현상**: 모니터링팀이 "정산 실행 결과가 정합한지" 판단할 **기준값**이 없음. PRD 정합화(Stage 2) 이후에도 매월/매주 정산 결과를 자동 비교할 수단 부재
- **요구사항**: Stage 2 완료 후 **"기대 보너스 총액 vs 실제 지급 총액" 자동 리포트**를 크론으로 생성 + 편차 발생 시 Critical 경보 (모니터링팀 + 시뮬레이션팀 공동 설계)

### 4.5 미검증 nuance 3건의 모니터링 영향

1. **"100만 / 지점 120만"** — 지점 차등이 도입되면 알림 메시지에 `지점 소속 여부` 필드 추가 필요
2. **"20만 (소계 5만)"** — 센터 5만이 지사장 20만에 합산되는 구조라면 **이중 집계 방지 검증 로직**이 모니터링의 감시 대상
3. **통증패치/전용젤 판매원 column 빈칸** — 판매원 미지급이면 `ProductCommissionRate` 테이블 row 부재 확인이 정기 검증 항목이 되어야 함

---

## 5. 향후 개발 참조 사실

### 5.1 현재 Kaion 모니터링 체계 요약 (한 줄)

> **"NestJS Logger가 stdout에 쓰고 Docker json-file이 10MB×3으로 회전시키는 것이 전부"** — APM 0개, 중앙 로그 수집 0개, 알림 경로 Slack 1개(2중 구현), 외부 SaaS 0개, 메트릭 수집 0개.

### 5.2 핵심 운영 상수 (반드시 기억)

- **로그 회전**: Docker json-file 드라이버, `max-size: 10m`, `max-file: 3` → 총 30MB/컨테이너. 대용량 에러 발생 시 **30분 내 rotate로 증거 유실 위험**
- **크론 스케줄**:
  - 매분 0초: `SettlementSchedulerTask`
  - 매일 02:00: `BackupTask` (현재 동작 의심)
  - 매일 03:00: `IntegritySchedulerService` (유일하게 알림 붙어있음)
- **Slack 알림**: 환경변수 `SLACK_WEBHOOK_URL` 단일. `ADMIN_BASE_URL`은 알림 링크 생성용 (기본 `http://localhost:5659`)
- **헬스체크 DB 전용**: `pg_isready -U kaion_user -d kaion_db`, `interval 10s / timeout 5s / retries 5`
- **핫스팟**: `members/genealogy-raw-queries.ts` — **절대 리팩터 금지**, 응답시간 급증 시 윤서연(개발1팀 쿼리 최적화)에 먼저 상의

### 5.3 함정 (모니터링팀이 반드시 알아야 할 미스테리)

- **Dead code**: `LoggingInterceptor`는 존재하지만 등록 안 됨. "왜 요청 로그가 없지?"의 답
- **Backup task 경로 불일치**: `/data/successbank/projects/kaion/backups`는 **호스트 경로**. 컨테이너에 볼륨 마운트 없음. 그리고 backend 컨테이너 안에서 `docker exec` 명령 호출 → 거의 확실히 실패. **기존 `backups/` 폴더의 파일들은 전부 수동 실행 결과물**로 보임
- **Nginx /health 경로 의심**: setGlobalPrefix('api') 때문에 `/health`가 404일 가능성. curl로 실측 필요
- **Winston 파일 로거 유실**: 볼륨 마운트 없어서 컨테이너 재시작 시 증발
- **`.bak` 파일 4개 (강민호 결정 대기)**:
  - `apps/backend/src/bonuses/bonus-calculator.service.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak`
  - `apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak`
  - `apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.bak`
  - 이 파일들에서 에러 로그 패턴이 발견되면 **자발적 복원 금지**, 강민호 결정 대기
- **Task #44.5 RBAC 미적용**: members controller에 JWT Guard 미적용 상태 → 비인증 500 에러가 ActivityLog에 userId null로 누락됨

### 5.4 APM / 관측 도구 도입 후보 (Stage 3 체크리스트 권장 대상)

| 도구 | 용도 | 도입 난이도 | 추천 순위 |
|-----|------|-----------|---------|
| **Sentry** (`@sentry/nestjs`, `@sentry/nextjs`) | 에러 추적 + 트랜잭션 트레이싱 + Release 추적 + Source map | ★ 쉬움 (SDK 설치 + DSN) | **1순위** |
| **Prometheus + Grafana** (`prom-client`, `@willsoto/nestjs-prometheus`) | 메트릭 수집(응답시간/에러율/크론 실행 카운트) + 시각화 | ★★ 중간 (exporter endpoint + Grafana 컨테이너 추가) | **2순위** |
| **OpenTelemetry** (`@opentelemetry/auto-instrumentations-node`) | 분산 트레이싱 (정산 체인 6단계 추적의 정확한 해법) | ★★★ 어려움 (Collector + Jaeger/Tempo 필요) | 3순위 |
| **BullMQ + Bull Board** | `SettlementSchedulerTask`를 큐 기반으로 전환 + 실패 재시도 + 대시보드 | ★★ 중간 (@nestjs/bullmq + Redis 재사용) | **자동정산 근본 해결** 권장 |
| **Loki + Promtail** | 중앙 로그 수집 + LogQL 검색 | ★★ 중간 | Grafana 도입 시 번들 |
| **Uptime Kuma** | 외부 `/health` 모니터링 + 알림 통합 | ★ 쉬움 (별도 컨테이너) | 운영 간소화 |
| **Winston Daily Rotate File** (이미 winston 설치됨) | `logs/` 파일 유실 문제 단기 해결 | ★ 매우 쉬움 (1일) | 단기 임시 |

### 5.5 즉시 개선 가능한 Low-hanging fruits (1일 내)

1. **`LoggingInterceptor` 전역 등록** — `app.module.ts`에 `{provide: APP_INTERCEPTOR, useClass: LoggingInterceptor}` 1줄 추가
2. **Nginx `/health` → `/api/health` 수정** — `proxy_pass http://backend/api/health;`
3. **Nginx access_log/error_log 추가 + `/dev/stdout` 링크** — json-file 드라이버에 수집
4. **backend/redis/frontend 컨테이너 healthcheck 추가**
5. **Winston 파일 로거 경로를 절대경로로 + 볼륨 마운트 추가**
6. **`logs/backend:/app/logs` 바인드 마운트** (docker-compose 수정)

### 5.6 중장기 개선 (Stage 3/4 체크리스트 권장)

1. **`CronRunLog` 테이블 신설** — 모든 크론 작업 실행 이력 DB 저장
2. **Sentry 도입** — 에러 추적 자동화
3. **BullMQ 전환** — `SettlementSchedulerTask`를 큐 기반으로 재구성 (재시도/데드레터 큐 확보)
4. **`admin/statistics` 인프라 관제 페이지 신설** — 크론 상태/헬스체크/에러 카운트/알림 이력 표시
5. **`NotificationService` 채널 분리** — Critical/Warning/Info 레벨별 Slack 채널, Email fallback
6. **Prometheus exporter 추가** — `/api/metrics` endpoint 노출 + Grafana 대시보드 구성
7. **정산 정합성 자동 검증 리포트** — 매일 03:30 실행, 기대값 vs 실제값 비교, 편차 Critical 경보

### 5.7 KPI 현재 달성 가능성 분석

| 페르소나 카드 KPI | 목표 | 현재 달성 가능성 | 사유 |
|-----------------|------|--------------|-----|
| 장애 탐지 시간 (MTTD) | 5분 이내 | ❌ | 알림 경로 2개 뿐. SettlementSchedulerTask 실패는 탐지 자체 불가 |
| 장애 대응 시간 (MTTR) | 30분 이내 | ⚠️ | 탐지 후 Slack 알림이 오더라도, `LoggingInterceptor` 부재로 원인 파악 어려움 |
| 알림 정확도 | 95%+ | ❌ | 구현된 알림 자체가 2건 뿐이라 통계 의미 없음 |
| 거짓 양성률 | 5% 이하 | N/A | 알림 부재로 측정 불가 |
| 선제 탐지율 | 70%+ | ❌ | 메트릭 수집 없음 → 트렌드 분석 불가 |
| 개발 중 검증 지원율 | 100% | ⚠️ | 요청 받으면 log tail/ps/docker logs 정도 수동 대응 가능, 자동화 전무 |

---

## 6. 다른 팀과의 의존

### 6.1 모니터링팀이 의존하는 팀/모듈 (↓ 모니터링팀은 이들의 출력을 관측)

| 피의존 대상 | 의존 내용 | 담당 페르소나 |
|----------|---------|-------------|
| **개발1팀 (인프라/DevOps)** | `docker-compose.yml`, Nginx, Dockerfile, `.env` 포트 설정, 볼륨 마운트, 헬스체크, LoggingInterceptor 등록 등 **인프라 설정 전체** | 임동혁(DevOps), 배경민, 오지훈 |
| **개발2팀 (수당 체인)** | `sales/recognized-sales/commission-rates/compensation-plan/bonuses/settlements/tasks/*` 모든 로그 스트림 + 트랜잭션 경계 + 에러 throw 패턴 | 이준혁, 김성진(배치/ETL), 문정아(데이터 아키텍트) |
| **개발2팀 (members 성능 핫스팟)** | `genealogy-raw-queries.ts` raw SQL 응답시간 (리팩터 금지 원칙 유지) | 윤서연(쿼리 최적화, 개발1팀) |
| **개발2팀 (integrity-check)** | `members/integrity-check.service.ts` 실행 결과, Slack 알림 메시지 생성 | 문정아 |
| **개발3팀 (자동화/DX)** | 모니터링 Skill/Hook (향후 Stage 3에서 신설 후보) — 로그 tail 자동화, 경보 룰 관리 | 김나연(문서화) |
| **기획설계팀 (PRD)** | 보상플랜 매트릭스 기준값 — 자동 검증의 ground truth | Stage 2 PRD 재작성 결과물 |
| **DB 스키마 (윤성호/배지영 PM)** | `CronRunLog`, `SettlementExecutionLog` 등 신규 테이블 설계 승인 | 윤성호, 배지영 |

### 6.2 모니터링팀에 의존하는 팀/모듈 (↑ 이들이 모니터링 결과를 소비)

| 의존 주체 | 소비 내용 | 연결 PM |
|---------|---------|---------|
| **PM팀 (박준혁 품질)** | **★ 개발 중 검증 단계별 모니터링 데이터** (단위/통합 검증 시 에러율 0% 확인). 장애 에스컬레이션 1차 수신자 | 박준혁 |
| **PM팀 (강민호 리더)** | 자동정산/정산 Critical 경보 **직접** 수신. `.bak` 파일 관련 에러 패턴 발견 시 결정 요청 | 강민호 |
| **PM팀 (이수진 기술)** | 수당 체인 성능 이슈, raw SQL 응답시간 회귀 | 이수진 |
| **PM팀 (김현태 Git)** | 배포 전후 모니터링, develop→main 릴리즈 후 메트릭 비교 | 김현태 |
| **PM팀 (오민정 이슈)** | RBAC 미적용 관련 이상 패턴, 장애 이슈 등록 | 오민정 |
| **QA팀 (최민규 보안)** | 무인증 호출 로그 패턴, ActivityLog 누락 이슈 | 최민규 |
| **QA팀 (김동현 성능)** | 100만 회원 부하 테스트 시 APM 데이터 공유 | 김동현 |
| **시뮬레이션팀** | 정산 체인 단계별 트랜잭션 경계 추적 데이터 (시나리오 재현 근거) | 전체 |
| **개발3팀 (자동화)** | Post-mortem 템플릿, 경보 룰 관리 Skill 설계 근거 | 김나연 |
| **디자인팀** | `admin/statistics` 인프라 관제 페이지 신설 시 UI 토큰/색상 | 한소라, 강현우 |

### 6.3 순환 의존 주의

- **모니터링팀 ↔ 개발2팀**: 정산 체인 장애는 개발2팀이 수정해야 하지만, 모니터링팀이 에러 패턴을 제공해야 원인 분석 가능. 반대로 개발2팀이 `LoggingInterceptor` 활성화와 `CronRunLog` 신설을 완료해야 모니터링팀이 제대로 된 데이터를 얻을 수 있음. **Stage 3에서 두 팀의 체크리스트 항목은 선행/후행 관계로 묶여야 함**
- **모니터링팀 ↔ 개발1팀**: Nginx/헬스체크/로그 경로는 개발1팀 DevOps 영역. 모니터링팀은 "무엇을 수정해야 하는지" 명세만 제공하고, 실제 수정은 임동혁이 담당

### 6.4 Stage 3 체크리스트 예상 항목 (모니터링팀 제출)

| 우선순위 | 항목 | 담당 페르소나 | 선행 | 난이도 |
|--------|------|------------|------|-------|
| P0 | LoggingInterceptor 전역 등록 | 박도영 + 정대훈(코드 PM) | - | Low |
| P0 | BackupTask 컨테이너 경로/명령 수정 | 김수현 + 임동혁(개발1팀) | - | Medium |
| P0 | SettlementSchedulerTask 실패 Slack 알림 추가 | 박도영 + 이준혁(개발2팀) | LoggingInterceptor 등록 | Medium |
| P0 | Nginx `/health` → `/api/health` 경로 수정 | 김수현 + 임동혁 | - | Low |
| P1 | CronRunLog 테이블 + 실행 이력 기록 | 박도영 + 김성진(개발2팀) + 윤성호(DB PM) | - | Medium |
| P1 | backend/redis/frontend/nginx 컨테이너 healthcheck 추가 | 김수현 + 임동혁 | - | Low |
| P1 | Nginx access_log/error_log 설정 + stdout 링크 | 김수현 | - | Low |
| P1 | Winston 파일 로거 절대경로 + 볼륨 마운트 | 박도영 + 임동혁 | - | Low |
| P1 | NotificationService 채널 분리 (Critical/Operation) | 장현우 + 최윤서 | - | Medium |
| P2 | `admin/statistics` 인프라 관제 페이지 신설 | 최윤서 + 한동우(개발2팀 FE 성능) | CronRunLog 완료 | High |
| P2 | Sentry 도입 (@sentry/nestjs + @sentry/nextjs) | 이정민 + 장현우 + 임동혁 | - | Medium |
| P2 | 정산 정합성 자동 검증 리포트 크론 | 박도영 + 시뮬레이션팀 | Stage 2 PRD 완료 + CronRunLog 완료 | High |
| P3 | BullMQ 전환 (자동정산 재시도/데드레터) | 이정민 + 이준혁 | Stage 2 완료 | High |
| P3 | Prometheus exporter + Grafana 컨테이너 | 김수현 + 임동혁 | - | High |

---

**작성 완료일**: 2026-04-15
**다음 액션**: @PM팀(박준혁)에게 본 문서 제출 → Stage 2 PRD 갱신 시 "정산 정합성 자동 검증 리포트" 설계 반영 요청 → Stage 3 체크리스트 신설 시 P0 4건 우선 배치
