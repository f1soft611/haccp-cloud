-- Repair migrated platform plan menu codes against the canonical tb_menu catalog.
-- Scope: plan P, currently subscribed by the PLATFORM tenant only.

BEGIN;

DELETE FROM public.tb_plan_menu pm
USING public.tb_plan p
WHERE pm.plan_id = p.plan_id
  AND p.plan_code = 'P';

INSERT INTO public.tb_plan_menu (
    plan_id,
    menu_code,
    use_at,
    created_at,
    updated_at
)
SELECT
    p.plan_id,
    m.menu_code,
    'Y',
    NOW(),
    NOW()
FROM public.tb_plan p
JOIN public.tb_menu m
  ON m.use_at = 'Y'
WHERE p.plan_code = 'P'
ON CONFLICT (plan_id, menu_code) DO UPDATE
SET use_at = 'Y',
    updated_at = NOW();

COMMIT;
