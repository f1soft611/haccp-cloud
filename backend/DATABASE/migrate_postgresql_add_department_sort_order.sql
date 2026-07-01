-- =============================================================
-- 부서 관리 sort_order 컬럼 추가 마이그레이션
-- 대상 테이블: tb_department
-- 실행 조건: sort_order 컬럼이 없는 기존 DB에 적용
-- =============================================================

-- sort_order 컬럼 추가 (없는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tb_department'
          AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE tb_department ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'tb_department.sort_order 컬럼 추가 완료';
    ELSE
        RAISE NOTICE 'tb_department.sort_order 컬럼이 이미 존재합니다. 건너뜁니다.';
    END IF;
END $$;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_department_sort_order ON tb_department(tenant_id, sort_order);

-- 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tb_department'
ORDER BY ordinal_position;
