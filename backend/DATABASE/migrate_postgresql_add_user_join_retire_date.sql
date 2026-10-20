-- =============================================================
-- 사원 입사일/퇴사일 컬럼 추가 마이그레이션
-- 대상 테이블: tb_user
-- 실행 조건: join_date / retire_date 컬럼이 없는 기존 DB에 적용
-- 값 형식: YYYY-MM-DD (VARCHAR(10)), NULL 허용
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tb_user'
          AND column_name = 'join_date'
    ) THEN
ALTER TABLE tb_user ADD COLUMN join_date VARCHAR(10);
RAISE NOTICE 'tb_user.join_date 컬럼 추가 완료';
ELSE
        RAISE NOTICE 'tb_user.join_date 컬럼이 이미 존재합니다. 건너뜁니다.';
END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tb_user'
          AND column_name = 'retire_date'
    ) THEN
ALTER TABLE tb_user ADD COLUMN retire_date VARCHAR(10);
RAISE NOTICE 'tb_user.retire_date 컬럼 추가 완료';
ELSE
        RAISE NOTICE 'tb_user.retire_date 컬럼이 이미 존재합니다. 건너뜁니다.';
END IF;
END $$;

COMMENT ON COLUMN tb_user.join_date IS '입사일 (YYYY-MM-DD)';
COMMENT ON COLUMN tb_user.retire_date IS '퇴사일 (YYYY-MM-DD)';

-- 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tb_user'
ORDER BY ordinal_position;