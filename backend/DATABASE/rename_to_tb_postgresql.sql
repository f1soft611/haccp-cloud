BEGIN;

DO $$
BEGIN
    IF to_regclass('public.haccp_departments') IS NOT NULL
       AND to_regclass('public.tb_departmentinfo') IS NULL THEN
        ALTER TABLE haccp_departments RENAME TO tb_departmentinfo;
    END IF;

    IF to_regclass('public.haccp_users') IS NOT NULL
       AND to_regclass('public.tb_userinfo') IS NULL THEN
        ALTER TABLE haccp_users RENAME TO tb_userinfo;
    END IF;

    IF to_regclass('public.haccp_login_history') IS NOT NULL
       AND to_regclass('public.tb_loginhistory') IS NULL THEN
        ALTER TABLE haccp_login_history RENAME TO tb_loginhistory;
    END IF;

    IF to_regclass('public.haccp_common_code') IS NOT NULL
       AND to_regclass('public.tb_commoncode') IS NULL THEN
        ALTER TABLE haccp_common_code RENAME TO tb_commoncode;
    END IF;

    IF to_regclass('public.haccp_organization') IS NOT NULL
       AND to_regclass('public.tb_organizationinfo') IS NULL THEN
        ALTER TABLE haccp_organization RENAME TO tb_organizationinfo;
    END IF;

    IF to_regclass('public.scheduler_config') IS NOT NULL
       AND to_regclass('public.tb_schedulerconfig') IS NULL THEN
        ALTER TABLE scheduler_config RENAME TO tb_schedulerconfig;
    END IF;

    IF to_regclass('public.lettccmmndetailcode') IS NOT NULL
       AND to_regclass('public.tb_commoncodedetail') IS NULL THEN
        ALTER TABLE lettccmmndetailcode RENAME TO tb_commoncodedetail;
    END IF;

    IF to_regclass('public.lettnbbs') IS NOT NULL
       AND to_regclass('public.tb_bbs') IS NULL THEN
        ALTER TABLE lettnbbs RENAME TO tb_bbs;
    END IF;

    IF to_regclass('public.lettnbbsmaster') IS NOT NULL
       AND to_regclass('public.tb_bbsmaster') IS NULL THEN
        ALTER TABLE lettnbbsmaster RENAME TO tb_bbsmaster;
    END IF;

    IF to_regclass('public.lettnbbsuse') IS NOT NULL
       AND to_regclass('public.tb_bbsuse') IS NULL THEN
        ALTER TABLE lettnbbsuse RENAME TO tb_bbsuse;
    END IF;

    IF to_regclass('public.lettnclub') IS NOT NULL
       AND to_regclass('public.tb_club') IS NULL THEN
        ALTER TABLE lettnclub RENAME TO tb_club;
    END IF;

    IF to_regclass('public.lettnclubuser') IS NOT NULL
       AND to_regclass('public.tb_clubuser') IS NULL THEN
        ALTER TABLE lettnclubuser RENAME TO tb_clubuser;
    END IF;

    IF to_regclass('public.lettncmmnty') IS NOT NULL
       AND to_regclass('public.tb_community') IS NULL THEN
        ALTER TABLE lettncmmnty RENAME TO tb_community;
    END IF;

    IF to_regclass('public.lettncmmntyuser') IS NOT NULL
       AND to_regclass('public.tb_communityuser') IS NULL THEN
        ALTER TABLE lettncmmntyuser RENAME TO tb_communityuser;
    END IF;

    IF to_regclass('public.lettndiaryinfo') IS NOT NULL
       AND to_regclass('public.tb_diaryinfo') IS NULL THEN
        ALTER TABLE lettndiaryinfo RENAME TO tb_diaryinfo;
    END IF;

    IF to_regclass('public.lettnemplyrinfo') IS NOT NULL
       AND to_regclass('public.tb_userinfo') IS NULL THEN
        ALTER TABLE lettnemplyrinfo RENAME TO tb_userinfo;
    END IF;

    IF to_regclass('public.lettnentrprsmber') IS NOT NULL
       AND to_regclass('public.tb_enterprisemember') IS NULL THEN
        ALTER TABLE lettnentrprsmber RENAME TO tb_enterprisemember;
    END IF;

    IF to_regclass('public.lettnfile') IS NOT NULL
       AND to_regclass('public.tb_file') IS NULL THEN
        ALTER TABLE lettnfile RENAME TO tb_file;
    END IF;

    IF to_regclass('public.lettnfiledetail') IS NOT NULL
       AND to_regclass('public.tb_filedetail') IS NULL THEN
        ALTER TABLE lettnfiledetail RENAME TO tb_filedetail;
    END IF;

    IF to_regclass('public.lettngnrlmber') IS NOT NULL
       AND to_regclass('public.tb_generalmember') IS NULL THEN
        ALTER TABLE lettngnrlmber RENAME TO tb_generalmember;
    END IF;

    IF to_regclass('public.lettnorgnztinfo') IS NOT NULL
       AND to_regclass('public.tb_organizationinfo') IS NULL THEN
        ALTER TABLE lettnorgnztinfo RENAME TO tb_organizationinfo;
    END IF;

    IF to_regclass('public.lettnschdulinfo') IS NOT NULL
       AND to_regclass('public.tb_scheduleinfo') IS NULL THEN
        ALTER TABLE lettnschdulinfo RENAME TO tb_scheduleinfo;
    END IF;

    IF to_regclass('public.lettnstplatinfo') IS NOT NULL
       AND to_regclass('public.tb_termsinfo') IS NULL THEN
        ALTER TABLE lettnstplatinfo RENAME TO tb_termsinfo;
    END IF;
END $$;

CREATE OR REPLACE VIEW mes_login_history AS
SELECT *
FROM tb_loginhistory;

DO $$
BEGIN
    IF to_regclass('public.tb_departmentinfo') IS NOT NULL THEN
        DROP VIEW IF EXISTS haccp_departments;
        EXECUTE 'CREATE OR REPLACE VIEW haccp_departments AS SELECT * FROM tb_departmentinfo';
    END IF;

    IF to_regclass('public.tb_userinfo') IS NOT NULL THEN
        DROP VIEW IF EXISTS haccp_users;
        EXECUTE 'CREATE OR REPLACE VIEW haccp_users AS SELECT * FROM tb_userinfo';
    END IF;

    IF to_regclass('public.tb_loginhistory') IS NOT NULL THEN
        DROP VIEW IF EXISTS haccp_login_history;
        EXECUTE 'CREATE OR REPLACE VIEW haccp_login_history AS SELECT * FROM tb_loginhistory';
    END IF;

    IF to_regclass('public.tb_commoncode') IS NOT NULL THEN
        DROP VIEW IF EXISTS haccp_common_code;
        EXECUTE 'CREATE OR REPLACE VIEW haccp_common_code AS SELECT * FROM tb_commoncode';
    END IF;

    IF to_regclass('public.tb_organizationinfo') IS NOT NULL THEN
        DROP VIEW IF EXISTS haccp_organization;
        EXECUTE 'CREATE OR REPLACE VIEW haccp_organization AS SELECT * FROM tb_organizationinfo';
    END IF;

    IF to_regclass('public.tb_schedulerconfig') IS NOT NULL THEN
        DROP VIEW IF EXISTS scheduler_config;
        EXECUTE 'CREATE OR REPLACE VIEW scheduler_config AS SELECT * FROM tb_schedulerconfig';
    END IF;
END $$;

COMMIT;
