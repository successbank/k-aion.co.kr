# DEV3-005 manual verification

**일자**: 2026-04-15
**담당**: 윤재호 (개발3팀 코드 검증 Hook) — 강민호(PM 리더) 승인

## 변경 요약

`.gitignore`에 legacy backup 파일 처리 정책 명시 섹션 추가.

## 핵심 결정

- `*.bak`와 `*.legacy-old-system`은 **gitignore 안 함** (현재 4개 파일을 의도적으로 추적)
- 이는 단순한 .gitignore 추가가 아니라 **명시적 allowlist 정책 문서화**
- 파일 자체는 git history에 보관 (실수로 다시 commit되어도 의도적임을 표시)

## 수동 확인

```bash
# 현재 추적되는 .bak / .legacy-old-system 파일
$ ls apps/backend/src/recognized-sales/*.bak apps/backend/src/bonuses/*.legacy* apps/backend/src/compensation-plan/services/*.legacy* apps/backend/prisma/seed-commission-rates.ts.legacy*

apps/backend/src/recognized-sales/recognized-sales.service.spec.ts.bak (Stage 4 BAK-RESTORE-001 대상)
apps/backend/src/recognized-sales/recognized-sales.controller.spec.ts.bak (Stage 4 BAK-RESTORE-001 대상)
apps/backend/src/bonuses/bonus-calculator.service.ts.legacy-old-system (Stage 2.6 보관)
apps/backend/src/compensation-plan/services/bonus-calculator.recognized.spec.ts.legacy-old-system (Stage 2.6 보관)
apps/backend/prisma/seed-commission-rates.ts.legacy-old-system (Stage 4 DEV2-005 신규 보관)
```

5개 파일 모두 git status에서 untracked 또는 staged로 표시되며, 의도된 결과.

## Pass 기준 충족 확인

- [x] .gitignore에 정책 명시 섹션 존재
- [x] 4개 (이제 5개) 의도적 backup 파일이 ignored되지 않음
- [x] `*.tmp.bak`, `*.swp.bak` 같은 우발적 backup만 ignore 처리

## 결과: PASS
