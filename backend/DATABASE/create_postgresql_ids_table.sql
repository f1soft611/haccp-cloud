-- PostgreSQL 전용 ID 시퀀스 테이블 생성 스크립트
-- 용도: eGov ID 생성기(EgovTableIdGnrServiceImpl)가 참조하는 IDS 테이블 준비
-- 대상 오류: relation "ids" does not exist

BEGIN;

CREATE TABLE IF NOT EXISTS ids (
    table_name VARCHAR(50) PRIMARY KEY,
    next_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 전자결재 실행번호(EA_EXE_ID)용 시드
INSERT INTO ids (table_name, next_id)
VALUES ('EA_EXE_ID', 1)
ON CONFLICT (table_name) DO NOTHING;

COMMIT;
