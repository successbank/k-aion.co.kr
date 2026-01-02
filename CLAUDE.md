# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

K-AION "건강 1도씨존" - ㈜케이아이온의 건강 의료기기(저주파, 초음파 치료기) 및 건강기능식품 프랜차이즈 사업 공식 홈페이지.

**타겟 사용자:**
- 예비 창업자 (40-60대, 소자본 창업 희망자)
- 건강 관심 소비자 (40-70대)
- 기존 가맹점주 및 지역 관리자

## 개발 명령어

모든 명령어는 `src/` 디렉토리에서 실행하거나 Docker를 통해 실행:

```bash
# 로컬 개발 (src/ 디렉토리에서)
cd src
npm run dev      # Next.js 개발 서버 시작 (포트 3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 시작

# Docker 개발 (루트 디렉토리에서)
docker-compose up        # 모든 서비스 시작 (app, MySQL, Adminer)
docker-compose up -d     # 백그라운드 모드로 시작
docker-compose down      # 모든 서비스 중지
```

## 개발팀 페르소나
- 개발팀_페르소나.md

## 아키텍처

### 디렉토리 구조
```
k-aion.co.kr/
├── src/                    # Next.js 애플리케이션
│   ├── pages/              # Next.js 페이지 (Pages Router)
│   └── package.json        # 앱 의존성
├── docker/                 # Docker 설정
│   └── Dockerfile          # Node.js 20 Alpine 이미지
├── docker-compose.yml      # 멀티 서비스 설정 (app, db, adminer)
├── backups/                # 데이터베이스 백업 저장소
├── logs/                   # 애플리케이션 로그
└── prd.md                  # 제품 요구사항 문서
```

### 기술 스택
- **프론트엔드:** Next.js 14 + React 18 (Pages Router)
- **데이터베이스:** PostgreSQL 16
- **관리 도구:** Adminer
- **컨테이너:** Docker + Node.js 20 Alpine


### 환경 변수 (docker-compose 참조)
- `WEB_PORT` - 웹 서버 포트 매핑
- `DB_PORT` - PostgreSQL 포트 매핑
- `ADMINER_PORT` - Adminer 포트 매핑
- `DB_USER`, `DB_PASSWORD`, `DB_NAME` - 데이터베이스 인증 정보
- `PROJECT_NAME` - 컨테이너 네이밍 접두사

## 디자인 가이드라인

PRD 기반 디자인 원칙:

- **Primary 컬러:** 레드 (#E53935) 또는 오렌지 (#FF6B35) - 따뜻함/건강
- **Secondary 컬러:** 블루 (#1976D2) - 신뢰/전문성
- **접근성:** 본문 최소 16px, 터치 영역 44px, WCAG AA 대비 충족
- **타겟 연령대:** 40-60대 - 큰 글씨와 직관적인 네비게이션 사용
- **모바일 우선:** 반응형 디자인 필수

## 주요 구현 페이지

PRD 기준 우선순위 페이지:
1. 메인 랜딩 페이지 (히어로 배너 + CTA)
2. 회사/브랜드 소개
3. 제품 소개 (저주파, 초음파 치료기, 통증패치, 프리미엄 젤)
4. **창업 안내 (핵심 페이지)** - 비용, 혜택, 절차
5. 매장 찾기 (카카오/네이버 지도 API 연동)
6. 고객센터 (FAQ, 1:1 문의)
7. 점주 전용 공간 (로그인 필요)
