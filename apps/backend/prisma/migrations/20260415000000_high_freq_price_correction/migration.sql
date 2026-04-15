-- Stage 4 DEV2-013 / BONUS-PRICE-001 (2026-04-15)
-- 고주파 (온체) 판매가 정정: 286만원 → 330만원
--
-- 출처: prd2/요청.md 항목 2 (자율 결정)
-- 우선순위 ① 첨부 보상플랜 이미지 = source of truth
--   이미지 하단: "1. 아이온체 판매가격: 330만원"
--   이미지 표: 고주파(온체) 판매가 = 330만
-- 우선순위 ② 코드 현실:
--   apps/backend/src/compensation-plan/controllers/compensation-plan.controller.ts:94
--   이미 Stage 2.9에서 2860000 → 3300000 정정 완료 (commit 9e4305f)
-- 본 마이그레이션: DB row를 동일하게 정정 (controller 하드코딩과 DB 일치 유지)
--
-- 영향:
-- - products.price: 2860000 → 3300000
-- - products.pv: 2574000 → 2970000 (90% 비율 유지)
--   (PV는 이미지에 명시 없음. 기존 ratio 90% 유지가 가장 보수적 결정)
--
-- 영향 없음:
-- - 다른 제품 (펄스온, 제트5, 통증패치, 전용젤): 이미지와 DB 일치 (Stage 1 검증)
-- - ProductCommissionRate 테이블: 변경 없음 (수당 매트릭스는 broadly 매치)

UPDATE "products"
SET "price" = 3300000,
    "pv" = 2970000,
    "updated_at" = NOW()
WHERE "code" = 'MED-001';

-- 검증 쿼리 (수동 확인용):
-- SELECT code, name, price, pv FROM products WHERE code = 'MED-001';
-- Expected: MED-001 | 온체 (고주파) | 3300000 | 2970000
