# K-AION 건강 1도씨존

㈜케이아이온의 건강 의료기기 및 건강기능식품 프랜차이즈 사업 공식 홈페이지

## 기술 스택

- **프론트엔드:** Next.js 14 + React 18 (Pages Router)
- **데이터베이스:** PostgreSQL 16
- **관리 도구:** Adminer
- **컨테이너:** Docker + Node.js 20 Alpine

---

## Docker 사용 가이드

### 사전 요구사항

- [Docker](https://docs.docker.com/get-docker/) (20.10 이상)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 이상)

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 설정합니다:

```bash
# 프로젝트 설정
PROJECT_NAME=k-aion

# 포트 설정
WEB_PORT=3001          # 웹 애플리케이션 포트
DB_PORT=5432           # PostgreSQL 포트
ADMINER_PORT=8081      # Adminer(DB 관리 도구) 포트

# 데이터베이스 설정
DB_NAME=k_aion_db
DB_USER=k_aion_user
DB_PASSWORD=your_secure_password
```

### 2. Docker 이미지 빌드 및 실행

#### 전체 서비스 시작 (권장)

```bash
# 이미지 빌드 및 모든 서비스 시작
docker-compose up --build

# 백그라운드 모드로 실행
docker-compose up -d --build
```

#### 개별 서비스 시작

```bash
# 데이터베이스만 시작
docker-compose up db

# 앱 서비스만 시작 (DB 의존성 자동 시작)
docker-compose up app
```

### 3. 서비스 접속

| 서비스 | URL | 설명 |
|--------|-----|------|
| 웹 애플리케이션 | http://localhost:3001 | Next.js 개발 서버 |
| Adminer | http://localhost:8081 | 데이터베이스 관리 UI |
| PostgreSQL | localhost:5432 | 데이터베이스 직접 연결 |

#### Adminer 로그인 정보
- **시스템:** PostgreSQL
- **서버:** db
- **사용자명:** `.env`의 `DB_USER` 값
- **비밀번호:** `.env`의 `DB_PASSWORD` 값
- **데이터베이스:** `.env`의 `DB_NAME` 값

### 4. 자주 사용하는 명령어

```bash
# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f          # 전체 로그
docker-compose logs -f app      # 앱 로그만
docker-compose logs -f db       # DB 로그만

# 서비스 중지
docker-compose stop

# 서비스 중지 및 컨테이너 삭제
docker-compose down

# 서비스 중지 + 볼륨(DB 데이터) 삭제 (주의: 데이터 손실)
docker-compose down -v

# 컨테이너 재시작
docker-compose restart

# 앱 컨테이너 쉘 접속
docker-compose exec app sh

# DB 컨테이너 접속
docker-compose exec db psql -U k_aion_user -d k_aion_db
```

### 5. 이미지 관리

```bash
# 이미지 다시 빌드 (캐시 무시)
docker-compose build --no-cache

# 사용하지 않는 이미지 정리
docker image prune

# 프로젝트 관련 이미지 확인
docker images | grep k-aion
```

---

## 로컬 개발 (Docker 없이)

```bash
# src 디렉토리로 이동
cd src

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start
```

---

## 디렉토리 구조

```
k-aion.co.kr/
├── src/                    # Next.js 애플리케이션
│   ├── pages/              # 페이지 컴포넌트
│   ├── components/         # 재사용 컴포넌트
│   └── package.json        # 앱 의존성
├── docker/                 # Docker 설정
│   └── Dockerfile          # Node.js 20 Alpine 이미지
├── docker-compose.yml      # 멀티 서비스 설정
├── backups/                # 데이터베이스 백업
├── logs/                   # 애플리케이션 로그
├── .env                    # 환경 변수 (git에서 제외)
└── README.md               # 이 파일
```

---

## 문제 해결

### 포트 충돌

다른 서비스가 포트를 사용 중인 경우 `.env` 파일에서 포트 번호를 변경합니다:

```bash
WEB_PORT=3002      # 3001 대신 3002 사용
DB_PORT=5433       # 5432 대신 5433 사용
```

### 권한 문제

```bash
# 볼륨 마운트 권한 문제 시
sudo chown -R $USER:$USER ./src
```

### DB 연결 실패

```bash
# DB 컨테이너가 완전히 시작될 때까지 대기
docker-compose up db -d
sleep 10
docker-compose up app
```

### 캐시 문제

```bash
# 전체 재빌드
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 프로덕션 배포

프로덕션 환경에서는 다음 사항을 확인하세요:

1. `.env` 파일의 비밀번호를 강력한 값으로 변경
2. `NODE_ENV=production` 설정
3. HTTPS 설정 (nginx 리버스 프록시 권장)
4. 정기적인 데이터베이스 백업 설정

---

## 라이선스

Copyright (c) 2024 ㈜케이아이온. All rights reserved.
