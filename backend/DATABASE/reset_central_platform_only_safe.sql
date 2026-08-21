BEGIN;

INSERT INTO public.tb_tenant (
    tenant_code,
    tenant_nm,
    admin_email,
    onboarding_status,
    use_at,
    created_by,
    created_at,
    updated_at
)
SELECT
    'PLATFORM',
    'F1Soft',
    'socra710@f1soft.co.kr',
    'EMAIL_VERIFIED',
    'Y',
    NULL,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.tb_tenant WHERE tenant_code = 'PLATFORM'
);

INSERT INTO public.tb_tenant_domain (
    tenant_id,
    email_domain,
    is_primary,
    use_at,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'f1soft.co.kr',
    'Y',
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_tenant_domain td WHERE td.email_domain = 'f1soft.co.kr'
  );

INSERT INTO public.tb_role (
    tenant_id,
    role_code,
    role_nm,
    use_at,
    is_system_role,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'PLATFORM_ADMIN',
    'Platform Admin',
    'Y',
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_role r
      WHERE r.tenant_id = t.tenant_id AND r.role_code = 'PLATFORM_ADMIN'
  );

INSERT INTO public.tb_role (
    tenant_id,
    role_code,
    role_nm,
    use_at,
    is_system_role,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'TENANT_ADMIN',
    'Tenant Admin',
    'Y',
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_role r
      WHERE r.tenant_id = t.tenant_id AND r.role_code = 'TENANT_ADMIN'
  );

INSERT INTO public.tb_role (
    tenant_id,
    role_code,
    role_nm,
    use_at,
    is_system_role,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'TENANT_USER',
    'Tenant User',
    'Y',
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_role r
      WHERE r.tenant_id = t.tenant_id AND r.role_code = 'TENANT_USER'
  );

INSERT INTO public.tb_permission (
    tenant_id,
    permission_code,
    permission_nm,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    'PERM_READ',
    'Read',
    'Y',
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_permission p
      WHERE p.tenant_id = t.tenant_id AND p.permission_code = 'PERM_READ'
  );

INSERT INTO public.tb_permission (
    tenant_id,
    permission_code,
    permission_nm,
    use_at,
    created_at
)
SELECT
    t.tenant_id,
    'PERM_WRITE',
    'Write',
    'Y',
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_permission p
      WHERE p.tenant_id = t.tenant_id AND p.permission_code = 'PERM_WRITE'
  );

INSERT INTO public.tb_login_account (
    tenant_id,
    login_code,
    password_hash,
    login_attempt_count,
    locked_at,
    password_changed_at,
    use_at,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    'socra710',
    'tHaU6E4leMVISzSKoByGd9DG/6uEhXmmxp9yt9soRvQ=',
    0,
    NULL,
    NOW(),
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_login_account la
      WHERE la.tenant_id = t.tenant_id AND la.login_code = 'socra710'
  );

INSERT INTO public.tb_user (
    tenant_id,
    login_id,
    user_nm,
    email_addr,
    department_id,
    mobile_no,
    use_at,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    la.login_id,
    'Platform Admin',
    'socra710@f1soft.co.kr',
    NULL,
    NULL,
    'Y',
    NOW(),
    NOW()
FROM public.tb_tenant t
JOIN public.tb_login_account la
  ON la.tenant_id = t.tenant_id
 AND la.login_code = 'socra710'
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_user u
      WHERE u.tenant_id = t.tenant_id AND u.email_addr = 'socra710@f1soft.co.kr'
  );

INSERT INTO public.tb_login_account_role (
    login_id,
    role_id,
    created_at
)
SELECT
    la.login_id,
    r.role_id,
    NOW()
FROM public.tb_tenant t
JOIN public.tb_login_account la
  ON la.tenant_id = t.tenant_id
 AND la.login_code = 'socra710'
JOIN public.tb_role r
  ON r.tenant_id = t.tenant_id
 AND r.role_code = 'PLATFORM_ADMIN'
WHERE t.tenant_code = 'PLATFORM'
ON CONFLICT (login_id, role_id) DO NOTHING;

INSERT INTO public.tb_tenant_subscription (
    tenant_id,
    plan_id,
    subscription_status,
    starts_at,
    ends_at,
    auto_renew,
    created_by,
    created_at,
    updated_at
)
SELECT
    t.tenant_id,
    p.plan_id,
    'ACTIVE',
    NOW(),
    NULL,
    'Y',
    NULL,
    NOW(),
    NOW()
FROM public.tb_tenant t
JOIN public.tb_plan p
  ON p.plan_code = 'P'
WHERE t.tenant_code = 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM public.tb_tenant_subscription s
      WHERE s.tenant_id = t.tenant_id
  );

UPDATE public.tb_tenant_subscription s
SET plan_id = p.plan_id,
    subscription_status = 'ACTIVE',
    auto_renew = 'Y',
    updated_at = NOW()
FROM public.tb_tenant t
JOIN public.tb_plan p ON p.plan_code = 'P'
WHERE s.tenant_id = t.tenant_id
  AND t.tenant_code = 'PLATFORM';

DELETE FROM public.tb_role_menu_permission
WHERE role_id IN (
    SELECT r.role_id
    FROM public.tb_role r
    JOIN public.tb_tenant t ON t.tenant_id = r.tenant_id
    WHERE t.tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_login_account_role
WHERE login_id IN (
    SELECT la.login_id
    FROM public.tb_login_account la
    JOIN public.tb_tenant t ON t.tenant_id = la.tenant_id
    WHERE t.tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_login_history
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_user
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_department
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_login_account
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_tenant_database
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_tenant_domain
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_tenant_subscription
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_permission
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_role
WHERE tenant_id IN (
    SELECT tenant_id FROM public.tb_tenant WHERE tenant_code <> 'PLATFORM'
);

DELETE FROM public.tb_tenant
WHERE tenant_code <> 'PLATFORM';

COMMIT;
