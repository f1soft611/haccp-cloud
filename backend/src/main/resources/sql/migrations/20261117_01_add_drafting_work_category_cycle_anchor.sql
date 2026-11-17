-- 업무(tb_drafting_work_category) 시작일과 주기 반복 기준 칼럼, 주기 계산 함수를 추가한다.
-- work_start_date: 업무 시작일(첫 주기 시작일이자 작성 하한). NULL 이면 기존 달력 기준 + 테넌트 업무개시일
-- cycle_anchor_type: DATE(매 주기 같은 날짜) / WEEKDAY(매 주기 같은 N째주 N요일), 시작일이 NULL 이면 NULL
-- cycle_anchor_week: 1~4째주, 9 = 마지막 주 (WEEKDAY 만)
-- cycle_anchor_weekday: 1(월)~7(일) (WEEKDAY 만)
-- 월내 주차는 ISO 8601 기준(월요일 시작, 목요일이 속한 달의 주)이라 tb_week 와 같다.
-- central, tenant DB 모두 실행한다. 여러 번 실행해도 결과가 같다.
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS work_start_date      date;
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS cycle_anchor_type    varchar(10);
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS cycle_anchor_week    int2;
ALTER TABLE public.tb_drafting_work_category ADD COLUMN IF NOT EXISTS cycle_anchor_weekday int2;

ALTER TABLE public.tb_drafting_work_category DROP CONSTRAINT IF EXISTS ck_drafting_work_category_cycle_anchor;
ALTER TABLE public.tb_drafting_work_category ADD CONSTRAINT ck_drafting_work_category_cycle_anchor CHECK (
    (work_start_date IS NULL AND cycle_anchor_type IS NULL AND cycle_anchor_week IS NULL AND cycle_anchor_weekday IS NULL)
 OR (work_start_date IS NOT NULL AND cycle_anchor_type = 'DATE' AND cycle_anchor_week IS NULL AND cycle_anchor_weekday IS NULL)
 OR (work_start_date IS NOT NULL AND cycle_anchor_type = 'WEEKDAY'
     AND cycle_anchor_week IN (1, 2, 3, 4, 9) AND cycle_anchor_weekday BETWEEN 1 AND 7)
);

COMMENT ON COLUMN public.tb_drafting_work_category.work_start_date IS '업무 시작일(첫 주기 시작일)';
COMMENT ON COLUMN public.tb_drafting_work_category.cycle_anchor_type IS '주기 반복 기준(DATE/WEEKDAY)';
COMMENT ON COLUMN public.tb_drafting_work_category.cycle_anchor_week IS '주차 기준 주차(1~4, 9=마지막 주)';
COMMENT ON COLUMN public.tb_drafting_work_category.cycle_anchor_weekday IS '주차 기준 요일(1=월~7=일)';

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

-- 업무 시작일 기준 n번째 주기 시작일 (p_code 는 fn_work_cycle_code 결과)
CREATE OR REPLACE FUNCTION public.fn_work_cycle_boundary(p_code varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_n int)
RETURNS date LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_months int := public.fn_work_cycle_months(p_code);
BEGIN
    IF p_code = 'WEEK' THEN
        RETURN p_start + 7 * p_n;
    END IF;
    IF v_months = 0 THEN
        RETURN p_start + p_n;
    END IF;
    IF p_type = 'WEEKDAY' THEN
        RETURN public.fn_month_week_date(
            CAST(public.fn_work_cycle_anchor_month(p_start) + make_interval(months => v_months * p_n) AS date),
            p_week, p_weekday);
    END IF;
    -- 매번 시작일에서 다시 더해야 31일 시작이 2월 말일 보정 후에도 28일로 밀리지 않는다
    RETURN CAST(p_start + make_interval(months => v_months * p_n) AS date);
END
$$;

-- p_target 이 속한 주기 번호(0부터). p_target 이 시작일 이전이면 NULL
CREATE OR REPLACE FUNCTION public.fn_work_cycle_index(p_code varchar, p_start date, p_type varchar, p_week int, p_weekday int, p_target date)
RETURNS int LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_months int := public.fn_work_cycle_months(p_code);
    v_base date;
    v_n int;
BEGIN
    IF p_start IS NULL OR p_target IS NULL OR p_target < p_start THEN
        RETURN NULL;
    END IF;
    IF p_code = 'WEEK' THEN
        RETURN (p_target - p_start) / 7;
    END IF;
    IF v_months = 0 THEN
        RETURN p_target - p_start;
    END IF;
    v_base := CASE WHEN p_type = 'WEEKDAY' THEN public.fn_work_cycle_anchor_month(p_start)
                   ELSE CAST(date_trunc('month', p_start) AS date) END;
    v_n := GREATEST(0, floor(((EXTRACT(YEAR FROM p_target) - EXTRACT(YEAR FROM v_base)) * 12
                              + EXTRACT(MONTH FROM p_target) - EXTRACT(MONTH FROM v_base)) / v_months)::int);
    -- 말일 보정, 주차 기준은 경계가 앞뒤 달로 넘어가므로 양쪽 모두 맞춘다
    WHILE v_n > 0 AND public.fn_work_cycle_boundary(p_code, p_start, p_type, p_week, p_weekday, v_n) > p_target LOOP
        v_n := v_n - 1;
    END LOOP;
    WHILE public.fn_work_cycle_boundary(p_code, p_start, p_type, p_week, p_weekday, v_n + 1) <= p_target LOOP
        v_n := v_n + 1;
    END LOOP;
    RETURN v_n;
END
$$;

-- p_target 이 속한 주기 시작일. 시작일이 NULL 이면 기존 달력 기준, p_target 이 시작일 이전이면 NULL
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
    IF p_target < p_start THEN
        RETURN NULL;
    END IF;
    IF v_code <> 'WEEK' AND public.fn_work_cycle_months(v_code) = 0 THEN
        RETURN p_target;
    END IF;
    RETURN public.fn_work_cycle_boundary(v_code, p_start, p_type, p_week, p_weekday,
        public.fn_work_cycle_index(v_code, p_start, p_type, p_week, p_weekday, p_target));
END
$$;

-- p_target 이 속한 주기의 다음 주기 시작일 (주기 끝 = 이 값 - 1일). p_target 이 시작일 이전이면 NULL
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
    IF p_target < p_start THEN
        RETURN NULL;
    END IF;
    IF v_code <> 'WEEK' AND v_months = 0 THEN
        RETURN p_target + 1;
    END IF;
    RETURN public.fn_work_cycle_boundary(v_code, p_start, p_type, p_week, p_weekday,
        public.fn_work_cycle_index(v_code, p_start, p_type, p_week, p_weekday, p_target) + 1);
END
$$;