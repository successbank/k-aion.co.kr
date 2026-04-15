# DEV3-008 manual verification

**일자**: 2026-04-15 / **담당**: 윤재호 (코드검증 Hook) + 박성민 (Hook 리드)

## 변경

### 1. root package.json
- devDependencies에 `husky: ^9.1.6` 추가
- scripts에 `prepare: "husky install || true"` 추가 (`|| true`로 install 실패해도 부드럽게)

### 2. .husky/pre-commit (신규, 실행권한 chmod +x)
- husky shim 조건부 source (.husky/_/husky.sh가 있으면)
- backend lint 실행 (DEV3-011 `--max-warnings 0`과 함께 강제력)
- 실패 시 exit 1 → 커밋 차단

## 후속 검증

```bash
# 1. 의존성 설치 (husky 포함)
docker exec kaion_backend pnpm install

# 2. husky install 자동 실행 확인
ls -la .husky/_/husky.sh
# Expected: 파일 존재 (husky가 생성)

# 3. 의도적으로 lint 실패하는 변경 추가 후 commit 시도
echo 'console.log("test");' >> apps/backend/src/temp.ts
git add apps/backend/src/temp.ts
git commit -m "test commit" 
# Expected: pre-commit hook이 lint 실행 → no-console warn → exit 1 → 커밋 차단
rm apps/backend/src/temp.ts
```

## 통합 효과 (DEV3-006/007/011/008 시너지)

- DEV3-006: supertest devDep 추가 → e2e 인프라
- DEV3-007: jest config rootDir → 테스트 수집 정상화
- DEV3-011: lint --max-warnings 0 → warn 강제
- **DEV3-008**: pre-commit Hook → lint 자동 실행 (커밋 시점 차단)

이제 모든 commit이 lint clean을 강제하게 됨.

## Pass 기준

- [x] root package.json에 husky devDep + prepare script
- [x] .husky/pre-commit 작성 (실행권한)
- [x] backend lint를 트리거하는 hook 본문
- [x] husky shim 조건부 source (install 미실행 시에도 안전)
- [ ] `pnpm install` 후 활성화 + 차단 검증 (후속)

## 결과: PASS (정적 검증)
