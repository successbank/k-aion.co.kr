# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

# 개발회사 팀 페르소나
.claude/CLAUDE.md 를 통하여 프로젝트 진행

## 프로젝트 개요

Kaion은 pnpm 모노레포 구조의 MLM 통합관리시스템입니다. NestJS 백엔드와 Next.js 프론트엔드로 구성되어 있으며, Docker 기반 개발 환경에서 실행됩니다.

# 다단계 네트워크 관리 프로그램 개발



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
