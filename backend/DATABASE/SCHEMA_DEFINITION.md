# HACCP Cloud Database Schema (Role-Only Authorization)

Last updated: 2026-06-24
Status: Active
DB: PostgreSQL 12+

## Overview

This schema uses a single authorization model:

- Role (`tb_role`) is the only authority master.
- User access is resolved by account-role mapping + role-menu-permission mapping.
- `tb_authority` is removed.

## Active Tables (12)

- `tb_tenant`: tenant master
- `tb_tenant_domain`: tenant-email-domain mapping
- `tb_department`: tenant department tree
- `tb_login_account`: login account
- `tb_user`: user profile
- `tb_role`: role master (integrated authority)
- `tb_login_account_role`: account-role mapping
- `tb_menu`: menu tree
- `tb_permission`: action permission (read/write)
- `tb_role_menu_permission`: role-menu-permission mapping
- `tb_login_history`: login audit history
- `tb_schedulerconfig`: scheduler settings

## Authorization Model

1. `tb_login_account_role` binds account to role.
2. `tb_role_menu_permission` binds role to menu + permission.
3. Runtime authorization checks role code from login token (`roleCode`).

## Key Constraints

- `tb_tenant_domain`: `UNIQUE (email_domain)`
- `tb_role`: `UNIQUE (tenant_id, role_code)`
- `tb_permission`: `UNIQUE (tenant_id, permission_code)`
- `tb_login_account_role`: `UNIQUE (login_id, role_id)`
- `tb_role_menu_permission`: `UNIQUE (role_id, menu_id, permission_id)`

## Login History Notes

- `tb_login_history` stores:
  - `role_id` (FK to `tb_role`)
  - `role_code` (denormalized code for audit readability)
- API/domain compatibility can expose `authorityCode` by aliasing from `role_code`.

## Relationship Summary

- `tb_tenant` -> `tb_tenant_domain`, `tb_department`, `tb_login_account`, `tb_user`, `tb_role`, `tb_menu`, `tb_permission`, `tb_login_history`
- `tb_login_account` -> `tb_login_account_role`

## Login Account Image Columns

- `tb_login_account.profile_image`: profile image data URL or stored image reference
- `tb_login_account.stamp_image`: approval stamp image data URL or stored image reference
- Login response aliases `stamp_image` to both `signatureImage` and `stampImage` for frontend compatibility
- `tb_role` -> `tb_login_account_role`, `tb_role_menu_permission`, `tb_login_history`
- `tb_menu` -> `tb_role_menu_permission`
- `tb_permission` -> `tb_role_menu_permission`

## Operational Seed Baseline

`seed_postgresql_minimal_platform_admin.sql` creates:

- tenant: `PLATFORM`
- tenant domain: `f1soft.co.kr`
- roles: `PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`
- permissions: `PERM_READ`, `PERM_WRITE`
- platform management menus (5)
- account: `socra710`
- mappings:
  - account -> `PLATFORM_ADMIN`
  - `PLATFORM_ADMIN` -> menus x permissions
