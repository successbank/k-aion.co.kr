# DEV2-005 manual verification

**일자**: 2026-04-15
**담당**: 양현수 (개발2팀 마이그레이션) + 강민호(PM 리더) 승인
**연관**: prd/리서치팀_파악된내용.md RSRCH-C02, prd/기획설계팀_파악된내용.md C-4-5, prd/시뮬레이션_파악된내용.md SIM-C3, STAGE3-003

## 변경 요약

`apps/backend/prisma/seed-commission-rates.ts` (281줄)을 `.legacy-old-system`으로 rename.

## 변경 사유

- 파일 전체가 구 enum 참조: `BonusType.SALES`, `LICENSE`, `LICENSE_MANAGEMENT`, `SHARING`, `BRANCH_OPERATION` + `MemberGrade.MEMBER`, `AGENT`, `MANAGER`, `BRANCH_CHIEF`, `DIVISION_CHIEF`
- 현재 schema에 해당 enum 값이 모두 제거됨 → **컴파일 단계부터 실패**
- ts-node 또는 prisma db seed 호출 시 즉시 TypeScript 에러
- 신 체계는 `ProductCommissionRate` 모델로 대체됨 (ProductCommissionRate seed는 별도 migration.sql에 INSERT)
- 이 파일을 유지하면 신규 개발자가 실행 시도 → 즉시 실패 → 시드 자동화 체인 fragile

## 처리 방식

`rm` 대신 `.legacy-old-system` rename으로 보관:
- git history에서 사라지지 않음
- 향후 새 시드 작성 시 패턴 참고 가능 (CommissionRate 테이블 INSERT 구조)
- 5개째 .legacy-old-system 파일 (이전 4개와 동일 정책)

## 수동 확인

```bash
$ ls -la apps/backend/prisma/seed-commission-rates*
-rw-rw-r-- 1 ... seed-commission-rates.ts.legacy-old-system  # rename 완료
```

원본 `seed-commission-rates.ts` 파일은 더 이상 존재하지 않음 (rename됨).

## 영향

- `pnpm prisma db seed`가 (만약 호출 시) 이 파일을 읽지 않게 됨
- TypeScript 컴파일 시 이 파일 무시됨 (`.ts` 확장자 아님)
- 개발자 혼란 제거

## 후속 (Stage 4 BACKLOG)

신 ProductCommissionRate seed가 별도로 필요한 경우, `migration.sql` 안의 INSERT 또는 새 `seed-product-commission-rates.ts` 작성. 현재는 `20260120_grade_restructure/migration.sql`이 ProductCommissionRate seed 역할을 수행 중 → 별도 작업 불필요.

## Pass 기준 충족 확인

- [x] 파일 rename 완료 (`.legacy-old-system`)
- [x] 원본 `.ts` 파일 부재
- [x] git status에 변경 반영
- [x] `.gitignore`에서 ignore되지 않음 (DEV3-005 정책)

## 결과: PASS
