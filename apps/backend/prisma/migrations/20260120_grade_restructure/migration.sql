-- Kaion MLM 시스템 대규모 구조 변경 마이그레이션
-- MemberGrade: 7등급 → 4등급 + ADMIN
-- BonusType: 6종류 → 2종류
-- 신규: ProductCommissionRate, SystemConfig 테이블

-- ============================================================
-- Step 1: 기존 데이터 정리 (ADMIN만 유지)
-- ============================================================

-- 외래 키 제약조건 비활성화
SET session_replication_role = 'replica';

-- 보너스 데이터 삭제
DELETE FROM bonuses;

-- 판매 데이터 삭제
DELETE FROM sales;

-- 정산 데이터 삭제
DELETE FROM settlements;

-- 육성 기록 삭제
DELETE FROM cultivation_records;

-- 인정매출 삭제
DELETE FROM recognized_sales;

-- 세미나 삭제
DELETE FROM seminars;

-- 주문 관련 삭제
DELETE FROM order_items;
DELETE FROM orders;

-- 수당률 관련 삭제
DELETE FROM commission_qualifications;
DELETE FROM commission_rate_tiers;
DELETE FROM commission_rates;

-- 임시 회원 삭제
DELETE FROM temp_members;

-- 활동 로그 삭제
DELETE FROM activity_logs;

-- 백업 로그 삭제
DELETE FROM backup_logs;

-- ADMIN을 제외한 모든 회원 삭제 (외래 키 순서 고려)
-- 먼저 ADMIN이 아닌 회원들의 추천인/후원인 관계 해제
UPDATE members SET recommender_id = NULL, sponsor_id = NULL WHERE grade != 'ADMIN';
-- 그 다음 삭제
DELETE FROM members WHERE grade != 'ADMIN';

-- 외래 키 제약조건 재활성화
SET session_replication_role = 'origin';

-- ============================================================
-- Step 2: MemberGrade enum 변경
-- ============================================================

-- 새로운 enum 타입 생성
CREATE TYPE "MemberGrade_new" AS ENUM ('SALESPERSON', 'TEAM_LEADER', 'BRANCH_MANAGER', 'CENTER', 'ADMIN');

-- members 테이블 변경
ALTER TABLE members
  ALTER COLUMN grade DROP DEFAULT,
  ALTER COLUMN grade TYPE "MemberGrade_new" USING (
    CASE grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
    END
  ),
  ALTER COLUMN grade SET DEFAULT 'SALESPERSON'::"MemberGrade_new";

-- cultivation_records 테이블 변경
ALTER TABLE cultivation_records
  ALTER COLUMN achieved_grade TYPE "MemberGrade_new" USING (
    CASE achieved_grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
    END
  );

-- sales 테이블 변경 (recognized_grade)
ALTER TABLE sales
  ALTER COLUMN recognized_grade TYPE "MemberGrade_new" USING (
    CASE recognized_grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
      ELSE NULL
    END
  );

-- recognized_sales 테이블 변경
ALTER TABLE recognized_sales
  ALTER COLUMN recognized_grade TYPE "MemberGrade_new" USING (
    CASE recognized_grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
    END
  );

-- commission_rate_tiers 테이블 변경
ALTER TABLE commission_rate_tiers
  ALTER COLUMN applicable_grade TYPE "MemberGrade_new" USING (
    CASE applicable_grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
    END
  );

-- commission_qualifications 테이블 변경
ALTER TABLE commission_qualifications
  ALTER COLUMN required_grade TYPE "MemberGrade_new" USING (
    CASE required_grade::text
      WHEN 'MEMBER' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'AGENT' THEN 'SALESPERSON'::"MemberGrade_new"
      WHEN 'MANAGER' THEN 'TEAM_LEADER'::"MemberGrade_new"
      WHEN 'BRANCH_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'DIVISION_CHIEF' THEN 'BRANCH_MANAGER'::"MemberGrade_new"
      WHEN 'CENTER' THEN 'CENTER'::"MemberGrade_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"MemberGrade_new"
      ELSE NULL
    END
  );

-- 기존 enum 타입 삭제 및 이름 변경
DROP TYPE "MemberGrade";
ALTER TYPE "MemberGrade_new" RENAME TO "MemberGrade";

-- ============================================================
-- Step 3: BonusType enum 변경
-- ============================================================

-- 새로운 enum 타입 생성
CREATE TYPE "BonusType_new" AS ENUM ('SALES_COMMISSION', 'EDUCATION_MANAGEMENT');

-- bonuses 테이블은 이미 비어있으므로 직접 변환
ALTER TABLE bonuses
  ALTER COLUMN bonus_type TYPE "BonusType_new" USING (
    CASE bonus_type::text
      WHEN 'SALES' THEN 'SALES_COMMISSION'::"BonusType_new"
      WHEN 'SALES_MANAGEMENT' THEN 'SALES_COMMISSION'::"BonusType_new"
      WHEN 'LICENSE' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'LICENSE_MANAGEMENT' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'SHARING' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'BRANCH_OPERATION' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
    END
  );

-- commission_rates 테이블 변경
ALTER TABLE commission_rates
  ALTER COLUMN bonus_type TYPE "BonusType_new" USING (
    CASE bonus_type::text
      WHEN 'SALES' THEN 'SALES_COMMISSION'::"BonusType_new"
      WHEN 'SALES_MANAGEMENT' THEN 'SALES_COMMISSION'::"BonusType_new"
      WHEN 'LICENSE' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'LICENSE_MANAGEMENT' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'SHARING' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
      WHEN 'BRANCH_OPERATION' THEN 'EDUCATION_MANAGEMENT'::"BonusType_new"
    END
  );

-- 기존 enum 타입 삭제 및 이름 변경
DROP TYPE "BonusType";
ALTER TYPE "BonusType_new" RENAME TO "BonusType";

-- ============================================================
-- Step 4: 신규 테이블 생성
-- ============================================================

-- 제품별 수당율 테이블
CREATE TABLE product_commission_rates (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  recipient_grade "MemberGrade" NOT NULL,
  amount INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_commission_rates_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 고유 제약조건 (제품 + 등급)
CREATE UNIQUE INDEX product_commission_rates_product_id_recipient_grade_key
  ON product_commission_rates(product_id, recipient_grade);

-- 인덱스
CREATE INDEX product_commission_rates_product_id_idx ON product_commission_rates(product_id);
CREATE INDEX product_commission_rates_recipient_grade_idx ON product_commission_rates(recipient_grade);
CREATE INDEX product_commission_rates_is_active_idx ON product_commission_rates(is_active);

-- 시스템 설정 테이블
CREATE TABLE system_configs (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Step 5: 기본 시스템 설정 추가
-- ============================================================

-- 한시적 승급 조건 설정 (무기한 - 별도 공지 전까지 3명 조건)
INSERT INTO system_configs (key, value, description) VALUES
  ('PROMOTION_TEMPORARY_CONDITION_ACTIVE', 'true', '한시적 승급 조건 활성화 (3명)'),
  ('PROMOTION_TEMPORARY_END_DATE', '9999-12-31', '한시적 조건 종료일 (무기한)'),
  ('SALESPERSON_TO_TEAM_LEADER_COUNT', '3', '팀장 승급 필요 판매원 수 (한시적 3명, 정상 10명)'),
  ('TEAM_LEADER_TO_BRANCH_MANAGER_COUNT', '3', '지사장 승급 필요 팀장 수 (한시적 3명, 정상 10명)');

-- ============================================================
-- Step 6: 제품 카테고리 및 제품 초기화
-- ============================================================

-- 기존 제품/카테고리 삭제
DELETE FROM products;
DELETE FROM categories;

-- 의료기기 카테고리 생성
INSERT INTO categories (name, level, parent_id, display_order) VALUES
  ('의료기기', 1, NULL, 1);

-- 치료기기 서브카테고리
INSERT INTO categories (name, level, parent_id, display_order) VALUES
  ('치료기기', 2, (SELECT id FROM categories WHERE name = '의료기기'), 1);

-- 소모품 서브카테고리
INSERT INTO categories (name, level, parent_id, display_order) VALUES
  ('소모품', 2, (SELECT id FROM categories WHERE name = '의료기기'), 2);

-- 치료기기 제품 등록
INSERT INTO products (code, name, description, price, pv, stock, category_id, is_active) VALUES
  ('MED-001', '온체 (고주파)', '고주파 치료기기 - 심부 온열 치료', 2860000, 2574000, 100, (SELECT id FROM categories WHERE name = '치료기기'), true),
  ('MED-002', '펄스온 (저주파)', '저주파 치료기기 - 근육 자극 치료', 2490000, 2241000, 100, (SELECT id FROM categories WHERE name = '치료기기'), true),
  ('MED-003', '제트5 (초음파)', '초음파 치료기기 - 초음파 치료', 1500000, 1350000, 100, (SELECT id FROM categories WHERE name = '치료기기'), true);

-- 소모품 등록
INSERT INTO products (code, name, description, price, pv, stock, category_id, is_active) VALUES
  ('MED-ACC-001', '통증 패치', '통증 완화 패치', 48000, 43200, 500, (SELECT id FROM categories WHERE name = '소모품'), true),
  ('MED-ACC-002', '전용젤', '치료기기 전용 젤', 30000, 27000, 500, (SELECT id FROM categories WHERE name = '소모품'), true);

-- ============================================================
-- Step 7: 제품별 수당율 등록
-- ============================================================

-- 온체 (고주파) 수당율
INSERT INTO product_commission_rates (product_id, recipient_grade, amount) VALUES
  ((SELECT id FROM products WHERE code = 'MED-001'), 'SALESPERSON', 500000),
  ((SELECT id FROM products WHERE code = 'MED-001'), 'TEAM_LEADER', 1000000),
  ((SELECT id FROM products WHERE code = 'MED-001'), 'BRANCH_MANAGER', 200000),
  ((SELECT id FROM products WHERE code = 'MED-001'), 'CENTER', 50000);

-- 펄스온 (저주파) 수당율
INSERT INTO product_commission_rates (product_id, recipient_grade, amount) VALUES
  ((SELECT id FROM products WHERE code = 'MED-002'), 'SALESPERSON', 400000),
  ((SELECT id FROM products WHERE code = 'MED-002'), 'TEAM_LEADER', 800000),
  ((SELECT id FROM products WHERE code = 'MED-002'), 'BRANCH_MANAGER', 150000),
  ((SELECT id FROM products WHERE code = 'MED-002'), 'CENTER', 50000);

-- 제트5 (초음파) 수당율
INSERT INTO product_commission_rates (product_id, recipient_grade, amount) VALUES
  ((SELECT id FROM products WHERE code = 'MED-003'), 'SALESPERSON', 250000),
  ((SELECT id FROM products WHERE code = 'MED-003'), 'TEAM_LEADER', 500000),
  ((SELECT id FROM products WHERE code = 'MED-003'), 'BRANCH_MANAGER', 50000),
  ((SELECT id FROM products WHERE code = 'MED-003'), 'CENTER', 50000);

-- 통증 패치 수당율 (판매원 수당 없음)
INSERT INTO product_commission_rates (product_id, recipient_grade, amount) VALUES
  ((SELECT id FROM products WHERE code = 'MED-ACC-001'), 'SALESPERSON', 0),
  ((SELECT id FROM products WHERE code = 'MED-ACC-001'), 'TEAM_LEADER', 20000),
  ((SELECT id FROM products WHERE code = 'MED-ACC-001'), 'BRANCH_MANAGER', 4800),
  ((SELECT id FROM products WHERE code = 'MED-ACC-001'), 'CENTER', 2400);

-- 전용젤 수당율 (판매원 수당 없음)
INSERT INTO product_commission_rates (product_id, recipient_grade, amount) VALUES
  ((SELECT id FROM products WHERE code = 'MED-ACC-002'), 'SALESPERSON', 0),
  ((SELECT id FROM products WHERE code = 'MED-ACC-002'), 'TEAM_LEADER', 15000),
  ((SELECT id FROM products WHERE code = 'MED-ACC-002'), 'BRANCH_MANAGER', 3000),
  ((SELECT id FROM products WHERE code = 'MED-ACC-002'), 'CENTER', 1500);
