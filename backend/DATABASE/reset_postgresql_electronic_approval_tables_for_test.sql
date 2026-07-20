-- =============================================================================
-- HACCP Cloud PostgreSQL - Electronic approval test reset script
-- =============================================================================
-- 목적:
--   결재 테스트를 위해 전자결재 관련 테이블 데이터를 초기화한다.
-- 기본 동작:
--   특정 테넌트만 초기화(권장)한다.
--
-- 사용 방법:
--   1) 아래 target_tenant_code 값을 테스트 대상 테넌트 코드로 변경
--   2) 스크립트 실행
--
-- 주의:
--   - 운영 환경에서 사용 금지
--   - 이 스크립트는 데이터만 삭제하며 스키마는 유지한다.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- [권장] 특정 테넌트만 초기화
-- -----------------------------------------------------------------------------
WITH target AS (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'TENANT-A'
)
DELETE FROM tb_electronic_approval_open_info
WHERE tenant_id IN (SELECT tenant_id FROM target);

WITH target AS (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'TENANT-A'
)
DELETE FROM tb_electronic_approval_history_main
WHERE tenant_id IN (SELECT tenant_id FROM target);

WITH target AS (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'TENANT-A'
)
DELETE FROM tb_electronic_approval_line_info
WHERE tenant_id IN (SELECT tenant_id FROM target);

WITH target AS (
    SELECT tenant_id
    FROM tb_tenant
    WHERE tenant_code = 'TENANT-A'
)
DELETE FROM tb_electronic_approval_main
WHERE tenant_id IN (SELECT tenant_id FROM target);

-- -----------------------------------------------------------------------------
-- 검증 쿼리
-- -----------------------------------------------------------------------------
SELECT 'tb_electronic_approval_main' AS table_name, COUNT(*) AS row_count
FROM tb_electronic_approval_main
WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT-A' LIMIT 1)
UNION ALL
SELECT 'tb_electronic_approval_line_info', COUNT(*)
FROM tb_electronic_approval_line_info
WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT-A' LIMIT 1)
UNION ALL
SELECT 'tb_electronic_approval_history_main', COUNT(*)
FROM tb_electronic_approval_history_main
WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT-A' LIMIT 1)
UNION ALL
SELECT 'tb_electronic_approval_open_info', COUNT(*)
FROM tb_electronic_approval_open_info
WHERE tenant_id = (SELECT tenant_id FROM tb_tenant WHERE tenant_code = 'TENANT-A' LIMIT 1);

COMMIT;

-- -----------------------------------------------------------------------------
-- [선택] 전체 테넌트 초기화가 필요할 때만 아래를 사용
-- -----------------------------------------------------------------------------
-- BEGIN;
-- TRUNCATE TABLE
--     tb_electronic_approval_open_info,
--     tb_electronic_approval_history_main,
--     tb_electronic_approval_line_info,
--     tb_electronic_approval_main
-- RESTART IDENTITY;
-- COMMIT;
