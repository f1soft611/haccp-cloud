-- Attachment metadata/session/audit tables for document approval attachments.

BEGIN;

CREATE TABLE IF NOT EXISTS tb_document_attachment (
    attachment_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    approval_id BIGINT NOT NULL,
    object_key VARCHAR(512) NOT NULL UNIQUE,
    original_file_name VARCHAR(255) NOT NULL,
    file_ext VARCHAR(20) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64),
    storage_provider VARCHAR(20) NOT NULL DEFAULT 'MINIO',
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'haccp-attachments',
    upload_status VARCHAR(20) NOT NULL,
    previewable_yn CHAR(1) NOT NULL DEFAULT 'N',
    deleted_yn CHAR(1) NOT NULL DEFAULT 'N',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_attachment_tenant_approval
    ON tb_document_attachment (tenant_id, approval_id);

CREATE INDEX IF NOT EXISTS idx_document_attachment_status
    ON tb_document_attachment (upload_status, deleted_yn);

CREATE TABLE IF NOT EXISTS tb_document_attachment_upload_session (
    upload_session_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    approval_id BIGINT NOT NULL,
    attachment_id BIGINT REFERENCES tb_document_attachment (attachment_id) ON DELETE SET NULL,
    upload_token VARCHAR(120) NOT NULL UNIQUE,
    object_key VARCHAR(512) NOT NULL,
    expected_file_name VARCHAR(255),
    expected_content_type VARCHAR(100),
    expected_file_size BIGINT,
    session_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachment_upload_session_tenant_approval
    ON tb_document_attachment_upload_session (tenant_id, approval_id);

CREATE INDEX IF NOT EXISTS idx_attachment_upload_session_status_expires
    ON tb_document_attachment_upload_session (session_status, expires_at);

CREATE TABLE IF NOT EXISTS tb_document_attachment_audit_log (
    attachment_audit_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    attachment_id BIGINT REFERENCES tb_document_attachment (attachment_id) ON DELETE CASCADE,
    approval_id BIGINT NOT NULL,
    action_type VARCHAR(40) NOT NULL,
    actor_login_id BIGINT,
    actor_ip VARCHAR(64),
    actor_user_agent VARCHAR(512),
    detail_text VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachment_audit_log_tenant_approval
    ON tb_document_attachment_audit_log (tenant_id, approval_id);

CREATE INDEX IF NOT EXISTS idx_attachment_audit_log_attachment
    ON tb_document_attachment_audit_log (attachment_id, created_at DESC);

INSERT INTO tb_schedulerconfig (
    scheduler_nm,
    scheduler_desc,
    is_running,
    cron_expression,
    created_at,
    updated_at
)
SELECT
    'AttachmentCleanup',
    '미완료 첨부 업로드 정리',
    'Y',
    '0 */10 * * * *',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM tb_schedulerconfig
    WHERE scheduler_nm = 'AttachmentCleanup'
);

COMMIT;