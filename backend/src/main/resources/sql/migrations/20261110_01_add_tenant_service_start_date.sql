-- tb_tenant 에 HACCP 업무개시일(service_start_date) 컬럼을 추가한다.
-- 미작성 주기, 대시보드 달력 계산 기준이며 비어 있으면 created_at 을 쓴다.
-- central, tenant DB 모두 tb_tenant 가 있다. 여러 번 실행해도 결과가 같다.
ALTER TABLE IF EXISTS public.tb_tenant ADD COLUMN IF NOT EXISTS service_start_date DATE;
