# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Dev server (port 5173)
npm run build        # Production build (vite + tsc)
npm run lint         # ESLint
npm run test         # Run tests (vitest)
npm run test:watch   # Watch mode
```

### Backend (`backend/`)
```bash
mvn spring-boot:run                     # Run locally
mvn clean install                       # Build WAR
```

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Architecture

**HACCP Cloud** — multi-tenant SaaS platform for food safety (HACCP) document management.

- **Frontend:** React 19 + Vite + TypeScript + MUI + Zustand + React Query + MSW
- **Backend:** Spring Boot + eGovFramework 4.3 + JPA + JWT + PostgreSQL + MinIO

### Frontend structure (`frontend/src/`)

| Dir | Purpose |
|-----|---------|
| `app/` | React entry, theme, routing, runtime config |
| `pages/` | Feature pages: `auth/`, `platform-admin/`, `tenant-management/`, `admin/`, `dashboard/` |
| `services/` | API layer grouped by domain: `auth/`, `platform/`, `tenant/`, `common/` |
| `shared/` | Zustand store, reusable components, constants, utils |
| `mocks/` | MSW handlers for dev without backend |
| `editor/` | Tiptap rich-text editor integration |

Mock mode is toggled via `VITE_ENABLE_MSW=true` or by omitting `VITE_API_BASE_URL`.

### Backend structure (`backend/src/main/java/egovframework/`)

| Package | Purpose |
|---------|---------|
| `com.jwt` | JWT auth filter, token util |
| `let.uat` | User authentication (login, session) |
| `let.platform_admin` | Multi-tenant mgmt: menus, tenants, access control, dashboard |
| `let.organization` | Users, departments, roles per tenant |
| `let.documents` | HACCP work docs, base docs, portal docs |
| `let.dashboard` | Platform/tenant analytics |
| `let.storage.minio` | File upload/download via MinIO |
| `let.scheduler` | Job scheduling |

### Database (PostgreSQL)

Schema file: `backend/DATABASE/create_postgresql_schema_active_tables.sql`

Key tables: `tb_tenant`, `tb_user`, `tb_login_account`, `tb_department`, `tb_role`, `tb_permission`, `tb_menu`, `tb_role_menu_permission`, `tb_login_history`

### Auth & RBAC

- JWT-based authentication
- Three role tiers: `PLATFORM_ADMIN` (manages all tenants) → tenant admin → tenant user
- Menu/permission access controlled via `tb_role_menu_permission`
- Initial platform admin: username `platform_admin`, password `Passw0rd!`

## Configuration

**Development:** `backend/src/main/resources/application.properties` (placeholders in repo)

**Production:**
1. Copy `backend/config/application-prod.properties.example` → `application-prod.properties` (outside repo)
2. Pass to app: `-Dspring.profiles.active=prod -Dspring.config.additional-location=file:/C:/haccp-cloud/config/`

Production secrets (DB credentials, JWT secret, crypto keys) are never committed to the repo.

## Key Docs

- `frontend/README_FOLDER_STRUCTURE.md` — detailed frontend layout and import conventions
- `인수인계/` — Korean handover docs: DB schema, tenant setup, MinIO, deployment config
