-- =============================================================================
-- HACCP Cloud PostgreSQL - Add drafting work category tables
-- =============================================================================
-- Purpose:
--   1) Add tenant-scoped work category group table
--   2) Add tenant-scoped drafting work category table
--   3) Connect both tables to tb_tenant(tenant_id)
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_group (
    drafting_work_category_group_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    cata_code VARCHAR(50) NOT NULL, -- 변경 -> WF_TYPE 코드(HCP-CALIB 등)를 담도록 VARCHAR(50)
    cata_name VARCHAR(20) NOT NULL,
    view_seq INTEGER NOT NULL DEFAULT 0,
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) NOT NULL DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_group_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_group_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_group_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_drafting_work_category_group_tenant_code
        UNIQUE (tenant_id, cata_code)
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category (
    drafting_work_category_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    drafting_work_category_group_id BIGINT,
    cata_type_code VARCHAR(3) NOT NULL,
    code_name VARCHAR(50),
    view_seq INTEGER DEFAULT 0,
    type_cnt TEXT,
    reviewer_id BIGINT,
    approver_id BIGINT,
    user_type VARCHAR(10) DEFAULT '0',
    haccp_cp_status VARCHAR(10),
    reg_term VARCHAR(50),
    drafting_work_template_json JSONB,
    drafting_work_template_html TEXT,
    duty_charge_code VARCHAR(10),
    cata_code VARCHAR(50),
    expiration_apply CHAR(1) NOT NULL DEFAULT 'N',
    approval_apply CHAR(1) NOT NULL DEFAULT 'Y',
    expiration_notice_status VARCHAR(10) NOT NULL DEFAULT 'NONE',
    expiration_notice_count INT4,
    work_start_date DATE,
    cycle_anchor_type VARCHAR(10),
    cycle_anchor_week INT2,
    cycle_anchor_weekday INT2,
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_group
        FOREIGN KEY (drafting_work_category_group_id)
        REFERENCES tb_drafting_work_category_group(drafting_work_category_group_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_approver
        FOREIGN KEY (approver_id)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT ck_drafting_work_category_expiration_apply CHECK (expiration_apply IN ('Y', 'N')),
    CONSTRAINT ck_drafting_work_category_approval_apply CHECK (approval_apply IN ('Y', 'N')),
    CONSTRAINT ck_drafting_work_category_expiration_notice_status CHECK (expiration_notice_status IN ('NONE', 'DAY', 'MONTH', 'YEAR')),
    CONSTRAINT ck_drafting_work_category_expiration_notice_count CHECK (expiration_notice_count IS NULL OR expiration_notice_count > 0),
    CONSTRAINT ck_drafting_work_category_cycle_anchor CHECK (
        (work_start_date IS NULL AND cycle_anchor_type IS NULL AND cycle_anchor_week IS NULL AND cycle_anchor_weekday IS NULL)
     OR (work_start_date IS NOT NULL AND cycle_anchor_type = 'DATE' AND cycle_anchor_week IS NULL AND cycle_anchor_weekday IS NULL)
     OR (work_start_date IS NOT NULL AND cycle_anchor_type = 'WEEKDAY'
         AND cycle_anchor_week IN (1, 2, 3, 4, 9) AND cycle_anchor_weekday BETWEEN 1 AND 7)
    )
);

CREATE TABLE IF NOT EXISTS tb_drafting_work_category_authority (
    drafting_work_category_authority_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    drafting_work_category_id BIGINT NOT NULL,
    cata_type_code VARCHAR(3) NOT NULL,
    employee_no VARCHAR(10) NOT NULL,
    use_at CHAR(1) NOT NULL DEFAULT 'Y',
    delete_status VARCHAR(10) NOT NULL DEFAULT 'N',
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drafting_work_category_authority_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant(tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_authority_work_category
        FOREIGN KEY (drafting_work_category_id)
        REFERENCES tb_drafting_work_category(drafting_work_category_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_drafting_work_category_authority_created_by
        FOREIGN KEY (created_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_drafting_work_category_authority_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES tb_login_account(login_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_drafting_work_category_authority_mapping
        UNIQUE (tenant_id, drafting_work_category_id, employee_no)
);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_tenant
    ON tb_drafting_work_category_group(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_use_at
    ON tb_drafting_work_category_group(use_at);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_tenant
    ON tb_drafting_work_category(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_group_id
    ON tb_drafting_work_category(drafting_work_category_group_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_reviewer_id
    ON tb_drafting_work_category(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_approver_id
    ON tb_drafting_work_category(approver_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_cata_type
    ON tb_drafting_work_category(cata_type_code);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_use_at
    ON tb_drafting_work_category(use_at);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_tenant
    ON tb_drafting_work_category_authority(tenant_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_work_category
    ON tb_drafting_work_category_authority(drafting_work_category_id);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_employee_no
    ON tb_drafting_work_category_authority(employee_no);

CREATE INDEX IF NOT EXISTS idx_drafting_work_category_authority_use_at
    ON tb_drafting_work_category_authority(use_at);

-- 업무 주기 계산 함수 추가. 본문은 마이그레이션 최종본과 같아야 한다 (WorkCycleFunctionSqlTest 가 검사).
-- fn_work_cycle_code, fn_work_cycle_months, fn_work_cycle_anchor_month, fn_month_week_date: sql/migrations/20261117_01
-- fn_work_cycle_boundary, fn_work_cycle_first, fn_work_cycle_index, fn_work_cycle_start, fn_work_cycle_next: sql/migrations/20261117_02

-- 업무 주기 코드(reg_term 별칭 포함)를 DAY/WEEK/MONTH/QUARTER/HALF/YEAR/ANYTIME 으로 정규화
CREATE OR REPLACE FUNCTION public.fn_work_cycle_code(p_reg_term varchar)
RETURNS varchar LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN COALESCE(TRIM(p_reg_term), '') IN ('월', '매월', 'month', 'MONTH', 'monthly', 'MONTHLY') THEN 'MONTH'
        WHEN COALESCE(TRIM(p_reg_term), '') IN ('주', '매주', 'week', 'WEEK', 'weekly', 'WEEKLY') THEN 'WEEK'
        WHEN COALESCE(TRIM(p_reg_term), '') IN ('QUARTER', 'HALF', 'YEAR') THEN TRIM(p_reg_term)
        WHEN COALESCE(TRIM(p_reg_term), '') IN ('수시', 'ANYTIME', 'anytime') THEN 'ANYTIME'
        ELSE 'DAY'
    END
$$;

-- 주기 개월 수 (MONTH 1, QUARTER 3, HALF 6, YEAR 12, 그 외 0)
CREATE OR REPLACE FUNCTION public.fn_work_cycle_months(p_code varchar)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE p_code WHEN 'MONTH' THEN 1 WHEN 'QUARTER' THEN 3 WHEN 'HALF' THEN 6 WHEN 'YEAR' THEN 12 ELSE 0 END
$$;

-- 날짜가 속한 주(월~일)의 목요일이 있는 달의 1일 (주차 기준의 기준 달)
CREATE OR REPLACE FUNCTION public.fn_work_cycle_anchor_month(p_date date)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
    SELECT CAST(date_trunc('month', p_date - (EXTRACT(ISODOW FROM p_date)::int - 1) + 3) AS date)
$$;

-- p_month 가 있는 달의 p_week째주(9 = 마지막 주) p_weekday 요일(1=월~7=일). 주는 목요일이 속한 달로 센다
CREATE OR REPLACE FUNCTION public.fn_month_week_date(p_month date, p_week int, p_weekday int)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_first date := CAST(date_trunc('month', p_month) AS date);
    v_last date := CAST(date_trunc('month', p_month) + INTERVAL '1 month' - INTERVAL '1 day' AS date);
    v_thursday date;
BEGIN
    IF p_week = 9 THEN
        v_thursday := v_last - ((EXTRACT(ISODOW FROM v_last)::int - 4 + 7) % 7);
    ELSE
        v_thursday := v_first + ((4 - EXTRACT(ISODOW FROM v_first)::int + 7) % 7) + 7 * (p_week - 1);
    END IF;
    RETURN v_thursday - 3 + (p_weekday - 1);
END
$$;

-- 업무 기준일 기준 n번째 주기 시작일 = n-1번째 마감일 다음 날 (p_code 는 fn_work_cycle_code 결과)
CREATE OR REPLACE FUNCTION public.fn_work_cycle_boundary(p_code varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_n int)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_months int := public.fn_work_cycle_months(p_code);
BEGIN
    IF p_code = 'WEEK' THEN
        RETURN p_start + 7 * (p_n - 1) + 1;
    END IF;
    IF v_months = 0 THEN
        RETURN p_start + p_n;
    END IF;
    IF p_type = 'WEEKDAY' THEN
        RETURN public.fn_month_week_date(
            CAST(public.fn_work_cycle_anchor_month(p_start) + make_interval(months => v_months * (p_n - 1)) AS date),
            p_week, p_weekday) + 1;
    END IF;
    -- 매번 기준일에서 다시 더해야 31일 기준이 2월 말일 보정 후에도 28일로 밀리지 않는다
    RETURN CAST(p_start + make_interval(months => v_months * (p_n - 1)) AS date) + 1;
END
$$;

-- 첫 주기 시작일(작성 하한). 기준일에서 거꾸로 한 주기, 주기 칸이 없는 일, 수시는 기준일 그대로. 기준일이 없으면 NULL
CREATE OR REPLACE FUNCTION public.fn_work_cycle_first(p_reg_term varchar, p_start date, p_type varchar, p_week int, p_weekday int)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_code varchar := public.fn_work_cycle_code(p_reg_term);
BEGIN
    IF p_start IS NULL THEN
        RETURN NULL;
    END IF;
    IF v_code <> 'WEEK' AND public.fn_work_cycle_months(v_code) = 0 THEN
        RETURN p_start;
    END IF;
    RETURN public.fn_work_cycle_boundary(v_code, p_start, p_type, p_week, p_weekday, 0);
END
$$;

-- p_target 이 속한 주기 번호(0부터). p_target 이 첫 주기 이전이면 NULL
CREATE OR REPLACE FUNCTION public.fn_work_cycle_index(p_code varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_target date)
RETURNS int LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_months int := public.fn_work_cycle_months(p_code);
    v_first date := public.fn_work_cycle_first(p_code, p_start, p_type, p_week, p_weekday);
    v_base date;
    v_n int;
BEGIN
    IF p_start IS NULL OR p_target IS NULL OR p_target < v_first THEN
        RETURN NULL;
    END IF;
    IF p_code = 'WEEK' THEN
        RETURN (p_target - v_first) / 7;
    END IF;
    IF v_months = 0 THEN
        RETURN p_target - p_start;
    END IF;
    v_base := CASE WHEN p_type = 'WEEKDAY' THEN public.fn_work_cycle_anchor_month(p_start)
                   ELSE CAST(date_trunc('month', p_start) AS date) END;
    v_n := GREATEST(0, floor(((EXTRACT(YEAR FROM p_target) - EXTRACT(YEAR FROM v_base)) * 12
                              + EXTRACT(MONTH FROM p_target) - EXTRACT(MONTH FROM v_base)) / v_months)::int);
    -- 추정값에서 앞뒤로 맞춘다 (말일 보정, 주차 기준 경계가 앞뒤 달로 넘어감)
    WHILE v_n > 0 AND public.fn_work_cycle_boundary(p_code, p_start, p_type, p_week, p_weekday, v_n) > p_target LOOP
        v_n := v_n - 1;
    END LOOP;
    WHILE public.fn_work_cycle_boundary(p_code, p_start, p_type, p_week, p_weekday, v_n + 1) <= p_target LOOP
        v_n := v_n + 1;
    END LOOP;
    RETURN v_n;
END
$$;

-- p_target 이 속한 주기 시작일. 기준일이 NULL 이면 기존 달력 기준, p_target 이 첫 주기 이전이면 NULL
CREATE OR REPLACE FUNCTION public.fn_work_cycle_start(p_reg_term varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_target date)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_code varchar := public.fn_work_cycle_code(p_reg_term);
BEGIN
    IF p_target IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_start IS NULL THEN
        RETURN CASE v_code
            WHEN 'WEEK' THEN CAST(date_trunc('week', p_target) AS date)
            WHEN 'MONTH' THEN CAST(date_trunc('month', p_target) AS date)
            WHEN 'QUARTER' THEN CAST(date_trunc('quarter', p_target) AS date)
            WHEN 'HALF' THEN CAST(date_trunc('year', p_target)
                + CASE WHEN EXTRACT(MONTH FROM p_target) >= 7 THEN INTERVAL '6 months' ELSE INTERVAL '0 months' END AS date)
            WHEN 'YEAR' THEN CAST(date_trunc('year', p_target) AS date)
            ELSE p_target
        END;
    END IF;
    IF p_target < public.fn_work_cycle_first(p_reg_term, p_start, p_type, p_week, p_weekday) THEN
        RETURN NULL;
    END IF;
    IF v_code <> 'WEEK' AND public.fn_work_cycle_months(v_code) = 0 THEN
        RETURN p_target;
    END IF;
    RETURN public.fn_work_cycle_boundary(v_code, p_start, p_type, p_week, p_weekday,
        public.fn_work_cycle_index(v_code, p_start, p_type, p_week, p_weekday, p_target));
END
$$;

-- p_target 이 속한 주기의 다음 주기 시작일 (주기 끝 = 마감일 = 이 값 - 1일). p_target 이 첫 주기 이전이면 NULL
CREATE OR REPLACE FUNCTION public.fn_work_cycle_next(p_reg_term varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_target date)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_code varchar := public.fn_work_cycle_code(p_reg_term);
    v_months int := public.fn_work_cycle_months(v_code);
    v_start date;
BEGIN
    IF p_target IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_start IS NULL THEN
        v_start := public.fn_work_cycle_start(p_reg_term, NULL, NULL, NULL, NULL, p_target);
        RETURN CASE WHEN v_code = 'WEEK' THEN v_start + 7
                    WHEN v_months > 0 THEN CAST(v_start + make_interval(months => v_months) AS date)
                    ELSE v_start + 1 END;
    END IF;
    IF p_target < public.fn_work_cycle_first(p_reg_term, p_start, p_type, p_week, p_weekday) THEN
        RETURN NULL;
    END IF;
    IF v_code <> 'WEEK' AND v_months = 0 THEN
        RETURN p_target + 1;
    END IF;
    RETURN public.fn_work_cycle_boundary(v_code, p_start, p_type, p_week, p_weekday,
        public.fn_work_cycle_index(v_code, p_start, p_type, p_week, p_weekday, p_target) + 1);
END
$$;

-- 공통코드 WF_TYPE 을 업무 분류로 등록한다. 테넌트 생성 시 copyCommonCodes 다음에 실행된다.
-- 기존 -> 플랜과 관계없이 등록
-- 변경 -> Basic(A) 플랜은 등록하지 않는다. plan_code 는 프로비저닝 시 바인딩된다.
INSERT INTO tb_drafting_work_category_group (tenant_id, cata_code, cata_name, view_seq, use_at)
SELECT i.tenant_id, i.item_code, LEFT(i.item_nm, 20), i.sort_order, 'Y'
FROM tb_common_code_item i
    JOIN tb_common_code_group g ON g.common_code_group_id = i.group_id
    JOIN tb_tenant t ON t.tenant_id = i.tenant_id
WHERE g.group_code = 'WF_TYPE'
  AND i.use_at = 'Y'
  AND :'plan_code' <> 'A'
ON CONFLICT (tenant_id, cata_code) DO NOTHING;

COMMIT;