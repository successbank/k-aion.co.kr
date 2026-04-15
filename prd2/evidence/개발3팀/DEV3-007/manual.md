# DEV3-007 manual verification

**일자**: 2026-04-15
**담당**: 이정우 (테스트 Skill)

## 변경

`apps/backend/jest.config.js` 전체 재작성:
- `rootDir: 'src'` → `rootDir: '.'`
- 신규 `roots: ['<rootDir>/src', '<rootDir>/test']`
- 신규 `testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.bak$', '\\.legacy-old-system$', '\\.legacy$']`
- `coverageDirectory: '../coverage'` → `'./coverage'`
- `collectCoverageFrom: ['**/*.(t|j)s']` → `['src/**/*.(t|j)s']` (test/는 제외)

## 사유

이전 설정으로는 `test/app.e2e-spec.ts`가 jest에 수집되지 않음 → e2e 테스트 false-green. 이제 src/ + test/ 모두 수집되며, .bak / .legacy 파일은 명시적 exclude.

## 의존

- DEV3-006 (supertest devDep 추가) 선행 — 이미 PASS (batch 2)

## 후속 검증

```bash
docker exec kaion_backend pnpm install  # supertest 설치
docker exec kaion_backend pnpm test
# Expected: src/ 안의 .spec.ts (현재 0건) + test/app.e2e-spec.ts 수집 시도
# E2E test 자체는 별도 작업이지만, 적어도 jest가 파일을 인식해야 함

docker exec kaion_backend pnpm test test/app.e2e-spec.ts
# Expected: 파일 수집됨 (이전엔 "no tests found" 였음)
```

## 결과: PASS (정적 검증)
