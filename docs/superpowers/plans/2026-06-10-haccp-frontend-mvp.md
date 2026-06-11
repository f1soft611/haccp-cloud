# HACCP Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 멀티테넌트 기반 HACCP 문서관리 프론트 MVP를 신규 프로젝트로 구축한다.

**Architecture:** Vite + React + TypeScript 기반으로 UI를 구성하고, React Router로 권한 라우팅을 적용한다. 서버 상태는 TanStack Query, 클라이언트 상태는 Zustand/Context로 분리한다. API는 MSW로 모킹해 스프링 API로 교체 가능한 서비스 레이어를 만든다.

**Tech Stack:** React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, MUI, Axios, MSW, Vitest, Testing Library

---

### Task 1: Project Skeleton

**Files:**

- Create: `haccp-cloud-mvp/문서/설계/README.md`
- Create: `haccp-cloud-mvp/frontend/*`
- Create: `haccp-cloud-mvp/backend/README.md`

- [ ] Step 1: 루트 폴더 및 하위 폴더 생성
- [ ] Step 2: frontend Vite React TS 초기화
- [ ] Step 3: backend placeholder 문서 생성

### Task 2: Frontend Foundation

**Files:**

- Modify: `haccp-cloud-mvp/frontend/src/main.tsx`
- Modify: `haccp-cloud-mvp/frontend/src/App.tsx`
- Create: `haccp-cloud-mvp/frontend/src/app/*`
- Create: `haccp-cloud-mvp/frontend/src/shared/*`

- [ ] Step 1: 라우팅/테마/QueryClient 부트스트랩
- [ ] Step 2: 인증 컨텍스트 및 권한 가드 구성
- [ ] Step 3: 공통 레이아웃 및 기본 메뉴 구성

### Task 3: MSW API Layer

**Files:**

- Create: `haccp-cloud-mvp/frontend/src/mocks/*`
- Create: `haccp-cloud-mvp/frontend/src/entities/*`
- Create: `haccp-cloud-mvp/frontend/src/services/*`

- [ ] Step 1: 도메인 타입/스키마 정의
- [ ] Step 2: MSW 핸들러 구현
- [ ] Step 3: 서비스 레이어 연결

### Task 4: MVP Screens

**Files:**

- Create: `haccp-cloud-mvp/frontend/src/pages/*`

- [ ] Step 1: 로그인/온보딩
- [ ] Step 2: 사용자/부서 관리
- [ ] Step 3: 문서 템플릿/이력
- [ ] Step 4: 대시보드

### Task 5: Verification

**Files:**

- Create: `haccp-cloud-mvp/frontend/src/test/*`
- Modify: `haccp-cloud-mvp/frontend/package.json`

- [ ] Step 1: 최소 단위 테스트 작성
- [ ] Step 2: 타입체크/린트/테스트 실행
- [ ] Step 3: 결과 기록
