-- Expand varchar length for electronic approval status/type columns.
-- Root cause: status-like values such as 'pre_approved' exceed legacy VARCHAR(10).

DO $$
DECLARE
    target record;
BEGIN
    FOR target IN
        SELECT *
        FROM (
            VALUES
                ('tb_electronic_approval_main', 'status_type', 30),
                ('tb_electronic_approval_main', 'end_status', 30),
                ('tb_electronic_approval_main', 'weight_status', 30),
                ('tb_electronic_approval_main', 'ea_locked_status', 30),
                ('tb_electronic_approval_main', 'delete_status', 30),
                ('tb_electronic_approval_line_info', 'app_status', 30),
                ('tb_electronic_approval_line_info', 'arbdec_status', 30),
                ('tb_electronic_approval_line_info', 'repdec_status', 30),
                ('tb_electronic_approval_line_info', 'muldec_status', 30),
                ('tb_electronic_approval_line_info', 'approval_type', 30),
                ('tb_electronic_approval_line_info', 'last_owner_status', 30),
                ('tb_electronic_approval_line_info', 'last_cnfrmer_status', 30),
                ('tb_electronic_approval_line_info', 'ok_type', 30),
                ('tb_electronic_approval_line_info', 'decide_status', 30),
                ('tb_electronic_approval_line_info', 'referencer_view_status', 30),
                ('tb_electronic_approval_line_info', 'conn_official_status', 30),
                ('tb_electronic_approval_history_main', 'not_open_status', 30),
                ('tb_electronic_approval_history_main', 'main_view_status', 30),
                ('tb_electronic_approval_history_main', 'approval_type', 30),
                ('tb_electronic_approval_open_info', 'approval_type', 30)
        ) AS t(table_name, column_name, target_length)
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = target.table_name
              AND c.column_name = target.column_name
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.%I ALTER COLUMN %I TYPE VARCHAR(%s);',
                target.table_name,
                target.column_name,
                target.target_length
            );
        END IF;
    END LOOP;
END $$;
