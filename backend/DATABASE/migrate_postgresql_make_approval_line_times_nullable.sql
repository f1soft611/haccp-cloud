-- Allow nullable arrival/exe/open timestamps for staged approval routing.
-- Requirement:
-- 1) temp save: all approval lines keep arrival/exe/open empty
-- 2) submit: only drafter has all timestamps, next approver gets arrival only

ALTER TABLE IF EXISTS public.tb_electronic_approval_line_info
    ALTER COLUMN arrival_at DROP NOT NULL,
    ALTER COLUMN exe_at DROP NOT NULL,
    ALTER COLUMN open_at DROP NOT NULL;
