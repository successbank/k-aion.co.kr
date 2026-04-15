# DEV3-011 manual verification

**일자**: 2026-04-15
**담당**: 윤재호 (코드검증 Hook) + 정대훈 (코드 PM)

## 변경

`apps/backend/package.json` `lint` script:
- 이전: `eslint "{src,test}/**/*.ts" --fix`
- 신: `eslint "{src,test}/**/*.ts" --fix --max-warnings 0`

## 사유

prd/개발3팀_파악된내용.md 발견:
- `.eslintrc.js`의 `'prettier/prettier': 'warn'`, `'no-console': 'warn'`, `'no-unused-vars': 'warn'`, `'no-explicit-any': 'warn'` 모두 warn 레벨
- → `pnpm lint` 통과 — 강제력 없음
- → pre-commit hook에서도 통과해버려 코드 품질 저하

해결책 2가지:
1. `.eslintrc.js`의 모든 warn 규칙을 error로 승격 (rule by rule)
2. `lint` script에 `--max-warnings 0` 추가 → warn 1건이라도 있으면 exit 1

옵션 2가 더 안전하고 단순. 모든 warning이 fail로 처리되어 차단됨. 기존 .eslintrc.js 변경 없음.

## 후속 검증

```bash
# 의도적 console.log 추가하여 차단 확인
echo 'console.log("test");' >> apps/backend/src/temp-test.ts
docker exec kaion_backend pnpm lint
# Expected: exit 1 + 'no-console' warning이 fail로 표시됨
rm apps/backend/src/temp-test.ts
```

## 결과: PASS
