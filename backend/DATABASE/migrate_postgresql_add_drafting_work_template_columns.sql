-- HACCP 업무 템플릿 저장 컬럼 추가
-- tb_drafting_work_category: drafting_work_template_json(jsonb), drafting_work_template_html(text)

ALTER TABLE tb_drafting_work_category
    ADD COLUMN IF NOT EXISTS drafting_work_template_json jsonb;

ALTER TABLE tb_drafting_work_category
    ADD COLUMN IF NOT EXISTS drafting_work_template_html text;
