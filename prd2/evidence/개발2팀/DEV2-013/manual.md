# DEV2-013 / BONUS-PRICE-001 manual verification

**일자**: 2026-04-15
**담당**: 양현수 (개발2팀 마이그레이션) + 박영호 (통합)
**연관**: prd2/요청.md 항목 2 + 항목 8

## 변경 요약

새 Prisma migration 디렉토리 + SQL 파일 생성:

- 디렉토리: `apps/backend/prisma/migrations/20260415000000_high_freq_price_correction/`
- 파일: `migration.sql` (33줄)

## SQL 내용

```sql
UPDATE "products"
SET "price" = 3300000,
    "pv" = 2970000,
    "updated_at" = NOW()
WHERE "code" = 'MED-001';
```

## 결정 사항 (autonomous)

1. **price 정정**: 286만원 → 330만원 (이미지 source of truth, 요청.md 항목 2)
2. **pv 정정**: 257만 4천 → 297만 (90% ratio 유지)
   - 기존 비율: 2,574,000 / 2,860,000 = 0.9 (90%)
   - 이미지에 PV 명시 없음 → 가장 보수적 결정 (기존 비율 유지)
   - 만약 PV가 다른 의미로 사용되면 (예: 정액 PV 단가) 별도 정정 필요 — Stage 4 후속

## 다른 제품 영향 없음 확인

```bash
$ grep "MED-002\|MED-003\|MED-ACC" 20260415000000_high_freq_price_correction/migration.sql
(0 matches — 다른 제품 unchanged)
```

펄스온/제트5/통증패치/전용젤은 이미 이미지와 일치 (Stage 1 검증 완료).

## 런타임 검증 (Stage 4 후속)

```bash
# 1. 마이그레이션 적용
docker exec kaion_backend pnpm prisma migrate deploy
# Expected: Applied migration 20260415000000_high_freq_price_correction

# 2. DB 직접 검증
docker exec -it kaion_db psql -U kaion_user -d kaion_db \
  -c "SELECT code, name, price, pv FROM products WHERE code = 'MED-001';"
# Expected: MED-001 | 온체 (고주파) | 3300000 | 2970000

# 3. API 검증 (compensation-plan controller hardcoded와 일치 확인)
curl http://localhost:5667/api/v1/compensation-plan/overview | jq '.products[] | select(.productName | contains("고주파"))'
# Expected: salePrice: 3300000
```

## 정합화 결과

- ✅ 이미지 (source of truth): 330만원
- ✅ compensation-plan.controller.ts:94 (Stage 2.9): 3300000
- ✅ 새 migration (Stage 4 DEV2-013): UPDATE to 3300000

3개 위치 모두 일치.

## Pass 기준 충족 확인

- [x] migration 디렉토리 생성
- [x] migration.sql 파일 작성 (UPDATE statement)
- [x] price + pv 함께 정정
- [x] 변경 이유 + 출처 주석 명시
- [x] 다른 제품 영향 없음
- [ ] 런타임 적용 (Stage 4 후속 — 컨테이너 명령 필요)

## 결과: PASS (정적 검증 기준)

후속 작업: docker exec backend `pnpm prisma migrate deploy` 실행 → DB UPDATE 적용. 이는 다음 검증 사이클의 일부.
