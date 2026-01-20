# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

Kaion은 pnpm 모노레포 구조의 MLM 통합관리시스템입니다. NestJS 백엔드와 Next.js 프론트엔드로 구성되어 있으며, Docker 기반 개발 환경에서 실행됩니다.

# 다단계 네트워크 관리 프로그램 개발

## 개발회사 팀 페르소나

* ./.persona_team/pm팀.md 를 통하여 프로젝트 진행

---

## 팀 구조

```
PM팀 (13명) ─┬─ 리서치팀 (4명)    : ./리서치팀.md  ← 아이디어/기술/오픈소스 탐색
             ├─ 기획설계팀 (5명)  : ./기획설계팀.md
             ├─ 디자인팀 (3명)    : ./디자인팀.md
             ├─ 개발1팀 (10명)   : ./개발1팀.md   ← 신규 기능 중심
             ├─ 개발2팀 (12명)   : ./개발2팀.md   ← 레거시/운영 중심
             ├─ 개발3팀 (6명)    : ./개발3팀.md   ← 자동화/DX (Skill/Hook)
             └─ QA팀 (15명)      : ./qa.md
```

---

## 총 인원: 68명

| 팀 | 인원 | 주요 역할 |
|----|------|----------|
| PM팀 | 13명 | 프로젝트 총괄, 일관성 관리, Git/이슈 관리 |
| 리서치팀 | 4명 | 아이디어 회의, 서비스/기술/오픈소스 리서치 |
| 기획설계팀 | 5명 | 서비스 기획, UX/시스템/데이터/기능 설계 |
| 디자인팀 | 3명 | UI 디자인, UX/인터랙션, 비주얼 디자인 |
| 개발1팀 | 10명 | 백엔드, DB설계, 서버/인프라, 프론트엔드 |
| 개발2팀 | 12명 | 백엔드(레거시), DBA, 시스템, 프론트엔드 |
| 개발3팀 | 6명 | Skill 개발, Hook 개발, 자동화 |
| QA팀 | 15명 | 기능/통합/성능/보안/자동화 테스트 |

---

## PM팀 구성 (13명)

| 역할 | 인원 | 담당자 |
|------|------|--------|
| 소통관 | 3명 | 유진호(수석), 서민지(기술), 임채원(UX/QA) |
| 총괄PM | 4명 | 강민호(리더), 이수진(기술), 박준혁(품질), 최윤아(커뮤니케이션) |
| 코드 일관성PM | 1명 | 정대훈 |
| 디자인 일관성PM | 2명 | 한소라(시스템), 강현우(UI/UX) |
| DB 일관성PM | 2명 | 윤성호(스키마), 배지영(쿼리) |
| Git/이슈PM | 2명 | 김현태(Git), 오민정(이슈) |

---

## 일관성 검토 전문화 체계

```
┌─────────────────────────────────────────────────────────────┐
│ 코드 일관성 (정대훈)                                         │
│ └─ 코드 컨벤션, 네이밍, 기능 패턴                            │
├─────────────────────────────────────────────────────────────┤
│ 디자인 일관성                                                │
│ ├─ 한소라: 디자인 토큰, 컴포넌트, 아이콘 스타일              │
│ └─ 강현우: 레이아웃, 인터랙션, 접근성                        │
├─────────────────────────────────────────────────────────────┤
│ DB 일관성                                                    │
│ ├─ 윤성호: 테이블/컬럼 설계, 인덱스, ERD                    │
│ └─ 배지영: 쿼리 표준, 트랜잭션, 성능                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 리서치팀 구성 (4명)

| 역할 | 담당자 | 전문 영역 |
|------|--------|----------|
| 리서치 리드 | 조현석 | 아이디어 퍼실리테이션, 리서치 총괄, PoC 관리 |
| 서비스 리서처 | 이하은 | 경쟁사/유사 서비스 벤치마킹, UX 패턴 수집 |
| 기술 리서처 | 김도윤 | 기술 스택 평가, PoC 직접 수행, 도입 리스크 분석 |
| 오픈소스 리서처 | 박서윤 | 오픈소스 탐색, 라이선스 분석, 품질 평가 |

---

## 개발3팀 자동화 체계 (6명)

### Skill 개발파트 (3명)
- 장우혁 (리드): 코드 템플릿, 보일러플레이트
- 김나연: 문서화 Skill (API 문서, README, CHANGELOG)
- 이정우: 테스트 Skill (단위/통합 테스트 자동생성)

### Hook 개발파트 (3명)
- 박성민 (리드): pre-commit, post-deploy Hook
- 최예린: request-intake Hook (유사 요청 탐지)
- 윤재호: code-review Hook (일관성 자동 검증)

```
/mnt/skills/beaugem/
├── code-generation/    # 코드 자동 생성
├── documentation/      # 문서 자동 생성
└── testing/           # 테스트 자동 생성

/hooks/
├── request-intake/    # 요청 접수 시 유사건 탐지
├── pre-commit/        # 커밋 전 일관성 검증
├── code-review/       # PR 자동 체크리스트
└── post-deploy/       # 배포 후 검증
```

---

## 프로젝트 운영 원칙

1. **모든 의사결정은 PM팀 주도**
2. **팀 간 소통은 PM팀 경유**
3. **이슈 발생 시 즉시 PM팀 에스컬레이션**
4. **산출물은 PM팀 검토 후 승인**
5. **반복 작업은 개발3팀 Skill/Hook으로 자동화**
6. **디자인/DB 변경은 전문 일관성 PM 2단계 검토**
7. **신규 기능/기술 도입 시 리서치팀 사전 탐색 필수**

---

## 전체 프로세스 흐름

```
요청 → 소통관 접수 → [Hook: 유사건 탐지] → 리서치 필요 여부 판단
                                              ↓
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
            리서치 필요                                           즉시 개발 가능
                    ↓                                                   │
        ┌───────────────────────┐                                       │
        │ 리서치팀 리서치 수행   │                                       │
        │ (1~2주)               │                                       │
        │ - 아이디어 회의       │                                       │
        │ - 서비스 벤치마킹     │                                       │
        │ - 기술 스택 평가      │                                       │
        │ - 오픈소스 탐색       │                                       │
        └───────────┬───────────┘                                       │
                    ▼                                                   │
        리서치 종합 리포트                                               │
        PM팀 의사결정 회의                                               │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
기획설계팀 → PM검토 → 디자인팀 → [한소라+강현우 2단계 검토]
                                              ↓
개발1,2팀 + [Skill 활용] → DB작업 → [윤성호+배지영 검토]
                                              ↓
코드작업 → [정대훈 검토] → [Hook: pre-commit 검증] → Git 커밋
                                              ↓
QA팀 → PM최종승인 → [Hook: post-deploy] → 배포
```

---

## 페르소나 활용

각 팀 md 파일의 페르소나를 호출하여 해당 역할 수행.
협업 시 PM팀이 조율하며 최적의 결과 도출.

- **리서치팀**: 사전 탐색으로 기술 리스크 최소화
- **기획설계팀**: 요구사항 분석 및 설계 문서화
- **디자인팀**: 디자인 시스템 기반 일관된 UI/UX
- **개발1/2팀**: 신규 기능 및 레거시 시스템 개발
- **개발3팀**: Skill/Hook으로 반복 작업 자동화
- **QA팀**: 품질 게이트 및 테스트 자동화
- **PM팀**: 전체 조율 및 일관성 관리

---

## Git 설정

```yaml
repository: https://github.com/successbank/k-aion.co.kr.git
branch_strategy:
  main: 프로덕션
  develop: 개발 통합
  feature/*: 기능 개발 (개발1/2팀)
  hotfix/*: 긴급 수정
  automation/*: Skill/Hook 개발 (개발3팀)
  research/*: PoC 브랜치 (리서치팀)
```



## 기술 스택

- **Backend**: NestJS + Prisma ORM
- **Frontend**: Next.js 14 + Ant Design + TailwindCSS
- **Database**: PostgreSQL 15 (Alpine)
- **Cache**: Redis 7 (Alpine)
- **Reverse Proxy**: Nginx
- **Package Manager**: pnpm 9.x + Turbo

## 디렉토리 구조

```
kaion/
├── apps/
│   ├── backend/           # NestJS API 서버
│   │   ├── src/           # 소스 코드
│   │   ├── prisma/        # Prisma 스키마 및 마이그레이션
│   │   └── Dockerfile
│   └── frontend/          # Next.js 웹 애플리케이션
│       ├── src/           # 소스 코드
│       └── Dockerfile
├── packages/
│   ├── shared/            # 공유 유틸리티
│   └── types/             # 공유 타입 정의
├── docker/
│   └── nginx/             # Nginx 설정
├── .taskmaster/           # Task Master AI 설정
├── docker-compose.yml     # Docker 서비스 정의
├── pnpm-workspace.yaml    # pnpm 워크스페이스 설정
├── turbo.json             # Turborepo 설정
└── package.json           # 루트 패키지 설정
```

## 개발 명령어

### 프로젝트 시작

```bash
# 모든 서비스 시작 (빌드 포함)
docker-compose up -d --build

# 특정 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# 모든 서비스 중지
docker-compose down
```

### 컨테이너 접근

```bash
# 백엔드 컨테이너 쉘 접속
docker exec -it kaion_backend sh

# 프론트엔드 컨테이너 쉘 접속
docker exec -it kaion_frontend sh

# PostgreSQL CLI
docker exec -it kaion_db psql -U kaion_user -d kaion_db

# Redis CLI
docker exec -it kaion_redis redis-cli -a vsb0AZxEw4TRTrjf
```

### Prisma 명령어 (백엔드 컨테이너 내부)

```bash
# 마이그레이션 생성 및 적용
docker exec kaion_backend npx prisma migrate dev

# Prisma Client 재생성
docker exec kaion_backend npx prisma generate

# Prisma Studio (데이터베이스 GUI)
docker exec kaion_backend npx prisma studio
```

### 서비스 URL

| 서비스        | URL/포트                           |
|--------------|-----------------------------------|
| 웹 앱 (Nginx) | http://211.248.112.67:5667        |
| API 엔드포인트 | http://211.248.112.67:5667/api/   |
| Adminer      | http://211.248.112.67:5670        |
| PostgreSQL   | localhost:5668                     |
| Redis        | localhost:5669                     |

## 아키텍처

### Docker 컨테이너 서비스 (6개)

| 컨테이너          | 역할                          | 내부 포트 |
|------------------|------------------------------|----------|
| `kaion_backend`  | NestJS API 서버              | 3001     |
| `kaion_frontend` | Next.js 웹 애플리케이션       | 3000     |
| `kaion_nginx`    | 리버스 프록시                 | 80       |
| `kaion_db`       | PostgreSQL 데이터베이스       | 5432     |
| `kaion_redis`    | Redis 캐시                   | 6379     |
| `kaion_adminer`  | 데이터베이스 관리 UI          | 8080     |

### 라우팅 구조 (Nginx)

- `/` → Frontend (Next.js)
- `/api/*` → Backend (NestJS)
- `/health` → Backend 헬스체크

### 환경 변수

컨테이너 내부의 연결 문자열은 Docker 네트워크 호스트명을 사용합니다:
- `DATABASE_URL`: `postgresql://kaion_user:...@database:5432/kaion_db`
- `REDIS_URL`: `redis://:...@redis:6379`
- `JWT_SECRET`: JWT 토큰 서명용 비밀키
- `JWT_EXPIRES_IN`: JWT 토큰 만료 시간 (기본 30d)

## 주요 패턴

- 소스 코드 변경은 볼륨 마운트를 통해 핫 리로드됨
- `node_modules`는 호스트/컨테이너 충돌 방지를 위해 named volume 사용
- **개발 시 항상 Docker Compose 사용, 호스트에서 직접 `npm run dev` 또는 `pnpm dev` 실행 금지**
- 데이터베이스는 백엔드 시작 전 헬스체크 통과 필요

## Task Master AI 통합

이 프로젝트는 Task Master AI를 사용하여 개발 작업을 관리합니다. 자세한 내용은 `.taskmaster/CLAUDE.md`를 참조하세요.

@./.taskmaster/CLAUDE.md
