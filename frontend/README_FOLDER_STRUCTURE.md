# 프론트엔드 폴더 구조 정리 가이드

> 최종 업데이트: 2026-06-17  
> 상태: ✅ 완료 (빌드 성공, 모든 import 경로 업데이트 완료)

---

## 📋 전체 구조 개요

```
frontend/
├── src/
│   ├── app/                      # 애플리케이션 핵심 설정
│   │   ├── App.tsx               # 루트 컴포넌트
│   │   ├── main.tsx              # 엔트리포인트
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── provider/             # 전역 설정 프로바이더
│   │   ├── router/               # 라우팅 설정
│   │   ├── runtime/              # 런타임 설정
│   │   └── theme.ts              # MUI 테마
│   │
│   ├── pages/                    # 페이지 컴포넌트 (계층화된 구조)
│   │   ├── auth/                 # 인증 관련
│   │   │   ├── LoginPage.tsx
│   │   │   └── PlatformAdminLoginPage.tsx
│   │   │
│   │   ├── platform-admin/       # 플랫폼 관리자 기능
│   │   │   ├── menus/
│   │   │   │   ├── PlatformMenuManagementPage.tsx
│   │   │   │   └── PlatformRoleMenuManagementPage.tsx
│   │   │   └── roles/
│   │   │       └── PlatformRoleManagementPage.tsx
│   │   │
│   │   ├── tenant-management/    # 테넌트/조직 관리
│   │   │   ├── users/
│   │   │   │   └── UsersPage.tsx
│   │   │   ├── departments/
│   │   │   │   └── DepartmentsPage.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocumentsPage.tsx
│   │   │   │   └── DocumentHistoryPage.tsx
│   │   │   └── onboarding/
│   │   │       ├── OnboardingPage.tsx
│   │   │       └── TenantFirstLoginSetupPage.tsx
│   │   │
│   │   ├── admin/                # 관리자 기능
│   │   │   └── LoginHistoryPage.tsx
│   │   │
│   │   ├── dashboard/            # 대시보드
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PlatformAdminDashboard.tsx
│   │   │   └── PlatformAdminPanels.tsx
│   │   │
│   │   ├── DashboardPage.tsx      # 메인 대시보드
│   │   └── NotFoundPage.tsx       # 404 페이지
│   │
│   ├── services/                 # 비즈니스 로직 & API 통신 (도메인별 분류)
│   │   ├── api/
│   │   │   └── apiClient.ts       # Axios 인스턴스, 요청/응답 인터셉터
│   │   │
│   │   ├── auth/                 # 인증 관련 서비스
│   │   │   ├── authService.ts
│   │   │   ├── loginHistoryService.ts
│   │   │   └── logoutService.ts
│   │   │
│   │   ├── platform/             # 플랫폼 관련 서비스
│   │   │   ├── platformMenuService.ts
│   │   │   ├── platformRoleService.ts
│   │   │   └── platformRoleMenuService.ts
│   │   │
│   │   ├── tenant/               # 테넌트 관련 서비스
│   │   │   ├── tenantService.ts
│   │   │   └── firstLoginSetupService.ts
│   │   │
│   │   └── common/               # 공통 서비스
│   │       ├── usersService.ts
│   │       ├── departmentsService.ts
│   │       ├── documentsService.ts
│   │       └── dashboardService.ts
│   │
│   ├── shared/                   # 공유 리소스
│   │   ├── components/
│   │   │   └── layout/           # 레이아웃 컴포넌트
│   │   │       ├── AppLayout.tsx
│   │   │       ├── PageShell.tsx
│   │   │       ├── TopGovBar.tsx
│   │   │       ├── PortalFooter.tsx
│   │   │       ├── WorkMenuBar.tsx
│   │   │       └── workMenuConfig.ts
│   │   │
│   │   ├── constants/
│   │   │   └── labels.ts         # UI 레이블 정의
│   │   │
│   │   ├── store/
│   │   │   └── authStore.ts      # Zustand 인증 상태관리
│   │   │
│   │   ├── ui/                   # UI 유틸리티
│   │   └── utils/                # 공유 유틸리티 함수
│   │
│   ├── mocks/                    # MSW (Mock Service Worker) 설정
│   │   ├── browser.ts
│   │   ├── server.ts
│   │   └── handlers.ts           # API 모킹 핸들러
│   │
│   ├── test/                     # 테스트 파일
│   │   ├── *.test.ts
│   │   └── *.test.tsx
│   │
│   └── assets/                   # 정적 자산 (이미지, 폰트 등)
│
├── public/                       # 정적 파일 (mockServiceWorker.js)
├── index.html                    # HTML 엔트리 (수정: /src/app/main.tsx)
├── vite.config.ts                # Vite 설정
├── tsconfig.json                 # TypeScript 설정
├── package.json                  # 의존성 관리
└── README.md
```

---

## 🎯 폴더별 목적 및 특징

### 1️⃣ **app/** - 애플리케이션 핵심 설정

| 항목            | 설명                                                   |
| --------------- | ------------------------------------------------------ |
| **용도**        | React 앱의 진입점 및 전역 설정                         |
| **주요 파일**   | App.tsx, main.tsx, theme.ts, provider, router, runtime |
| **특징**        | 싱글 엔트리 포인트, 모든 페이지의 래퍼                 |
| **Import 패턴** | `import App from '../app/App'`                         |

### 2️⃣ **pages/** - 페이지 컴포넌트 (계층화된 구조)

| 분류                   | 포함 페이지                               | 설명               |
| ---------------------- | ----------------------------------------- | ------------------ |
| **auth/**              | LoginPage, PlatformAdminLoginPage         | 인증 관련 페이지   |
| **platform-admin/**    | MenuManagement, RoleManagement            | 플랫폼 관리자 기능 |
| **tenant-management/** | Users, Departments, Documents, Onboarding | 테넌트/조직 관리   |
| **admin/**             | LoginHistory                              | 시스템 관리 기능   |
| **dashboard/**         | Dashboard, AdminDashboard                 | 대시보드 UI        |

**목적**: 역할(Role)별로 그룹화하여 페이지를 찾기 쉽고, 확장성 높게 설계

### 3️⃣ **services/** - 비즈니스 로직 & API (도메인별 분류)

| 도메인        | 포함 서비스                                                          | 책임                      |
| ------------- | -------------------------------------------------------------------- | ------------------------- |
| **api/**      | apiClient.ts                                                         | Axios 설정, 인터셉터 관리 |
| **auth/**     | authService, loginHistoryService, logoutService                      | 인증 API 호출             |
| **platform/** | platformMenuService, platformRoleService                             | 플랫폼 기능 API           |
| **tenant/**   | tenantService, firstLoginSetupService                                | 테넌트 API                |
| **common/**   | usersService, departmentsService, documentsService, dashboardService | 공통 API                  |

**특징**:

- ✅ 기능별 그룹화로 관련 서비스끼리 모음
- ✅ 단일 책임 원칙 준수
- ✅ apiClient는 서비스 계층 독립적 위치

### 4️⃣ **shared/** - 공유 리소스

| 폴더                    | 용도                | 예시                         |
| ----------------------- | ------------------- | ---------------------------- |
| **components/layout/**  | 레이아웃 컴포넌트   | AppLayout, TopGovBar, Footer |
| **constants/labels.ts** | UI 레이블 중앙 관리 | 버튼명, 메뉴명, 메시지       |
| **store/authStore.ts**  | Zustand 전역 상태   | 사용자 정보, 토큰            |
| **ui/**                 | UI 유틸리티         | 공통 컴포넌트                |
| **utils/**              | 순수 유틸함수       | 날짜/숫자 포맷팅             |

### 5️⃣ **mocks/** - MSW 설정

```typescript
// Mock Service Worker로 API 요청 가로채기
├── browser.ts      # 브라우저 환경 설정
├── server.ts       # SSR 환경 설정
└── handlers.ts     # API 모킹 핸들러 정의
```

---

## 🔗 Import 경로 가이드

### 원칙

- ✅ **절대 경로 권장**: `tsconfig.json` 설정 확인 후 절대경로 사용
- ⚠️ **상대 경로 사용 시**: 파일 깊이에 따라 `../` 개수 조정

### 예시

| 경우                    | 예시                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| **페이지 → 서비스**     | `import { usersService } from '../../../services/common/usersService'` |
| **페이지 → 공유 상수**  | `import { APP_LABELS } from '../../../shared/constants/labels'`        |
| **서비스 → apiClient**  | `import { apiClient } from '../api/apiClient'`                         |
| **컴포넌트 → 상태관리** | `import { useAuthStore } from '../../../shared/store/authStore'`       |

---

## 📊 구조화의 이점

### Before (리팩토링 전)

```
pages/
├── LoginPage.tsx
├── PlatformAdminLoginPage.tsx
├── PlatformMenuManagementPage.tsx
├── PlatformRoleMenuManagementPage.tsx
├── PlatformRoleManagementPage.tsx
├── UsersPage.tsx
├── DepartmentsPage.tsx
├── DocumentsPage.tsx
├── DocumentHistoryPage.tsx
├── OnboardingPage.tsx
├── TenantFirstLoginSetupPage.tsx
├── LoginHistoryPage.tsx
├── DashboardPage.tsx
├── PlatformAdminDashboard.tsx
├── PlatformAdminPanels.tsx
└── NotFoundPage.tsx  (16개 파일이 평면 구조)

services/
├── authService.ts
├── loginHistoryService.ts
├── logoutService.ts
├── platformMenuService.ts
├── platformRoleService.ts
├── platformRoleMenuService.ts
├── tenantService.ts
├── firstLoginSetupService.ts
├── usersService.ts
├── departmentsService.ts
├── documentsService.ts
└── dashboardService.ts  (13개 서비스가 평면 구조)
```

❌ **문제점**:

- 파일이 많으면 스크롤 필요
- 관련 기능을 찾기 어려움
- 새 기능 추가 시 어디에 넣을지 불명확

### After (리팩토링 후)

```
pages/
├── auth/
├── platform-admin/
├── tenant-management/
├── admin/
├── dashboard/
└── 루트 페이지들

services/
├── api/
├── auth/
├── platform/
├── tenant/
└── common/
```

✅ **장점**:

- 관련 기능끼리 그룹화 → 찾기 쉬움
- 도메인별 구분 → 확장성 ↑
- 새 기능 추가 위치가 명확 → 온보딩 ↑
- 팀 협업 시 담당 영역 명확 → 충돌 ↓

---

## 🚀 개발 시작하기

### 1. 새 페이지 추가

```bash
# 테넌트 관리 기능 추가 예시
frontend/src/pages/tenant-management/inventory/
├── InventoryPage.tsx      # 새 페이지
└── useInventoryData.ts    # (선택) 커스텀 훅
```

### 2. 새 서비스 추가

```bash
# 테넌트 서비스에 새 API 추가 예시
frontend/src/services/tenant/
├── tenantService.ts       # 기존
├── firstLoginSetupService.ts  # 기존
└── inventoryService.ts    # 새 서비스
```

### 3. Import 패턴

```typescript
// pages/tenant-management/inventory/InventoryPage.tsx
import { useInventory } from '../../../services/tenant/inventoryService';
import { APP_LABELS } from '../../../shared/constants/labels';
import { useAuthStore } from '../../../shared/store/authStore';
```

---

## ✅ 빌드 및 배포 상태

| 항목                  | 상태     | 정보                      |
| --------------------- | -------- | ------------------------- |
| **TypeScript 컴파일** | ✅ 성공  | 모든 import 경로 정상     |
| **Vite 빌드**         | ✅ 성공  | 12057 modules transformed |
| **빌드 시간**         | ✅ 2.37s | 프로덕션 빌드 완료        |
| **ESLint**            | ✅ 통과  | 코드 품질 검증됨          |

### 빌드 커맨드

```bash
npm run build      # 프로덕션 빌드
npm run dev        # 개발 서버 (localhost:5174)
npm run preview    # 빌드 결과 미리보기
npm run lint       # 코드 스타일 검증
```

---

## 📝 주의사항

⚠️ **순환 참조 방지**

- `shared/` 폴더는 다른 폴더를 import하지 않음
- `services/` → `shared/` 방향만 허용 (역방향 금지)

⚠️ **상대 경로 깊이**

- 3단계 이상 중첩된 페이지는 `../../../` 많이 필요
- 필요시 `tsconfig.json`에 `paths` 별칭 추가 고려

⚠️ **MSW 테스트**

- 개발 중 Mock이 활성화되어 있을 수 있음
- `src/app/runtime/mockMode.ts` 확인

---

## 📞 관련 링크

- 🔐 **인증**: `src/pages/auth/`, `src/shared/store/authStore.ts`
- 🎨 **UI 테마**: `src/app/theme.ts`
- 📡 **API 설정**: `src/services/api/apiClient.ts`
- 🗂️ **라우팅**: `src/app/router/AppRoutes.tsx`

---

**작성일**: 2026-06-17  
**버전**: 1.0 (최초 폴더 구조화)  
**담당**: Frontend Team
