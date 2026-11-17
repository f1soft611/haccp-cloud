-- 업무 기준일(work_start_date)을 첫 주기 시작일이 아니라 첫 주기 마감일로 해석한다.
-- 주기 n = [n-1번째 마감일 + 1일, n번째 마감일], 첫 주기는 기준일에서 거꾸로 한 주기. 주기 칸이 없는 일, 수시는 기준일이 하한.
-- 기존 데이터는 옮기지 않고 그대로 마감일로 재해석한다.
-- central, tenant DB 모두 실행한다. 여러 번 실행해도 결과가 같다.

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

COMMENT ON COLUMN public.tb_drafting_work_category.work_start_date IS '업무 기준일(첫 주기 마감일)';