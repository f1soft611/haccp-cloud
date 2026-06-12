BEGIN;

DROP VIEW IF EXISTS haccp_departments;
DROP VIEW IF EXISTS haccp_users;
DROP VIEW IF EXISTS haccp_login_history;
DROP VIEW IF EXISTS haccp_common_code;
DROP VIEW IF EXISTS haccp_organization;
DROP VIEW IF EXISTS scheduler_config;

DO $$
BEGIN
    IF to_regclass('public.tb_schedulerconfig') IS NOT NULL
       AND to_regclass('public.scheduler_config') IS NULL THEN
        ALTER TABLE tb_schedulerconfig RENAME TO scheduler_config;
    END IF;

    IF to_regclass('public.tb_organizationinfo') IS NOT NULL
       AND to_regclass('public.haccp_organization') IS NULL THEN
        ALTER TABLE tb_organizationinfo RENAME TO haccp_organization;
    END IF;

    IF to_regclass('public.tb_commoncode') IS NOT NULL
       AND to_regclass('public.haccp_common_code') IS NULL THEN
        ALTER TABLE tb_commoncode RENAME TO haccp_common_code;
    END IF;

    IF to_regclass('public.tb_loginhistory') IS NOT NULL
       AND to_regclass('public.haccp_login_history') IS NULL THEN
        ALTER TABLE tb_loginhistory RENAME TO haccp_login_history;
    END IF;

    IF to_regclass('public.tb_userinfo') IS NOT NULL
       AND to_regclass('public.haccp_users') IS NULL THEN
        ALTER TABLE tb_userinfo RENAME TO haccp_users;
    END IF;

    IF to_regclass('public.tb_departmentinfo') IS NOT NULL
       AND to_regclass('public.haccp_departments') IS NULL THEN
        ALTER TABLE tb_departmentinfo RENAME TO haccp_departments;
    END IF;

    IF to_regclass('public.tb_termsinfo') IS NOT NULL
       AND to_regclass('public.lettnstplatinfo') IS NULL THEN
        ALTER TABLE tb_termsinfo RENAME TO lettnstplatinfo;
    END IF;

    IF to_regclass('public.tb_scheduleinfo') IS NOT NULL
       AND to_regclass('public.lettnschdulinfo') IS NULL THEN
        ALTER TABLE tb_scheduleinfo RENAME TO lettnschdulinfo;
    END IF;

    IF to_regclass('public.tb_generalmember') IS NOT NULL
       AND to_regclass('public.lettngnrlmber') IS NULL THEN
        ALTER TABLE tb_generalmember RENAME TO lettngnrlmber;
    END IF;

    IF to_regclass('public.tb_filedetail') IS NOT NULL
       AND to_regclass('public.lettnfiledetail') IS NULL THEN
        ALTER TABLE tb_filedetail RENAME TO lettnfiledetail;
    END IF;

    IF to_regclass('public.tb_file') IS NOT NULL
       AND to_regclass('public.lettnfile') IS NULL THEN
        ALTER TABLE tb_file RENAME TO lettnfile;
    END IF;

    IF to_regclass('public.tb_enterprisemember') IS NOT NULL
       AND to_regclass('public.lettnentrprsmber') IS NULL THEN
        ALTER TABLE tb_enterprisemember RENAME TO lettnentrprsmber;
    END IF;

    IF to_regclass('public.tb_diaryinfo') IS NOT NULL
       AND to_regclass('public.lettndiaryinfo') IS NULL THEN
        ALTER TABLE tb_diaryinfo RENAME TO lettndiaryinfo;
    END IF;

    IF to_regclass('public.tb_communityuser') IS NOT NULL
       AND to_regclass('public.lettncmmntyuser') IS NULL THEN
        ALTER TABLE tb_communityuser RENAME TO lettncmmntyuser;
    END IF;

    IF to_regclass('public.tb_community') IS NOT NULL
       AND to_regclass('public.lettncmmnty') IS NULL THEN
        ALTER TABLE tb_community RENAME TO lettncmmnty;
    END IF;

    IF to_regclass('public.tb_clubuser') IS NOT NULL
       AND to_regclass('public.lettnclubuser') IS NULL THEN
        ALTER TABLE tb_clubuser RENAME TO lettnclubuser;
    END IF;

    IF to_regclass('public.tb_club') IS NOT NULL
       AND to_regclass('public.lettnclub') IS NULL THEN
        ALTER TABLE tb_club RENAME TO lettnclub;
    END IF;

    IF to_regclass('public.tb_bbsuse') IS NOT NULL
       AND to_regclass('public.lettnbbsuse') IS NULL THEN
        ALTER TABLE tb_bbsuse RENAME TO lettnbbsuse;
    END IF;

    IF to_regclass('public.tb_bbsmaster') IS NOT NULL
       AND to_regclass('public.lettnbbsmaster') IS NULL THEN
        ALTER TABLE tb_bbsmaster RENAME TO lettnbbsmaster;
    END IF;

    IF to_regclass('public.tb_bbs') IS NOT NULL
       AND to_regclass('public.lettnbbs') IS NULL THEN
        ALTER TABLE tb_bbs RENAME TO lettnbbs;
    END IF;

    IF to_regclass('public.tb_commoncodedetail') IS NOT NULL
       AND to_regclass('public.lettccmmndetailcode') IS NULL THEN
        ALTER TABLE tb_commoncodedetail RENAME TO lettccmmndetailcode;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.haccp_login_history') IS NOT NULL THEN
        EXECUTE 'CREATE OR REPLACE VIEW mes_login_history AS SELECT * FROM haccp_login_history';
    END IF;
END $$;

COMMIT;
