CREATE TABLE IF NOT EXISTS tb_electronic_approval_history_like (
    tenant_id BIGINT NOT NULL,
    electronic_approval_history_id BIGINT NOT NULL,
    login_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tb_electronic_approval_history_like PRIMARY KEY (
        tenant_id,
        electronic_approval_history_id,
        login_id
    ),
    CONSTRAINT fk_tb_electronic_approval_history_like_tenant FOREIGN KEY (tenant_id)
        REFERENCES tb_tenant (tenant_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tb_electronic_approval_history_like_history FOREIGN KEY (electronic_approval_history_id)
        REFERENCES tb_electronic_approval_history_main (electronic_approval_history_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tb_electronic_approval_history_like_login FOREIGN KEY (login_id)
        REFERENCES tb_login_account (login_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tb_electronic_approval_history_like_history
    ON tb_electronic_approval_history_like (tenant_id, electronic_approval_history_id);

CREATE INDEX IF NOT EXISTS idx_tb_electronic_approval_history_like_login
    ON tb_electronic_approval_history_like (tenant_id, login_id);
