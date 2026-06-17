# 네비게이션 메뉴 & 페이지 헤더 디자인 개선

**날짜:** 2026-06-17  
**범위:** frontend/src/shared/components/layout/, frontend/src/pages/

---

## 1. 목표

1. **상단 네비게이션 메뉴(WorkMenuBar) 시각 품질 강화** — 탭 선택 인디케이터, 드롭다운 패널 품질, 아이콘 추가, 호버 트랜지션 개선
2. **페이지 헤더 경로 표시 강화** — 각 페이지 제목 영역에 수직 액센트 바 + 브레드크럼(그룹 > 항목) 표시

---

## 2. 변경 파일 목록

| 파일                                                            | 변경 유형 | 설명                                                |
| --------------------------------------------------------------- | --------- | --------------------------------------------------- |
| `shared/components/layout/workMenuConfig.ts`                    | 수정      | 각 `MenuItem`에 `icon?: string` 필드 추가           |
| `shared/components/layout/WorkMenuBar.tsx`                      | 수정      | 탭 스타일 개선, 드롭다운 스타일 개선, 아이콘 렌더링 |
| `shared/components/layout/PageHeader.tsx`                       | 신규 생성 | 수직 액센트 바 + 브레드크럼 헤더 컴포넌트           |
| `pages/platform-admin/menus/PlatformMenuManagementPage.tsx`     | 수정      | `<PageHeader>` 적용                                 |
| `pages/platform-admin/menus/PlatformRoleMenuManagementPage.tsx` | 수정      | `<PageHeader>` 적용                                 |
| `pages/platform-admin/roles/PlatformRoleManagementPage.tsx`     | 수정      | `<PageHeader>` 적용                                 |
| `pages/tenant-management/users/UsersPage.tsx`                   | 수정      | `<PageHeader>` 적용                                 |
| `pages/tenant-management/departments/DepartmentsPage.tsx`       | 수정      | `<PageHeader>` 적용                                 |
| `pages/tenant-management/documents/DocumentsPage.tsx`           | 수정      | `<PageHeader>` 적용                                 |
| `pages/tenant-management/documents/DocumentHistoryPage.tsx`     | 수정      | `<PageHeader>` 적용                                 |

---

## 3. 디자인 상세

### 3.1 WorkMenuBar — 탭 바

**현재:**

- 선택 탭: `bgcolor: '#D7E2EF'`, `color: primary.dark`
- 비선택 탭: `bgcolor: transparent`, `color: text.primary`
- `borderLeft/Right: 1px solid divider` (선택 시)

**변경 후:**

- 선택 탭: `bgcolor: 'common.white'`, `color: primary.main`, `fontWeight: 800`
  - 하단 `3px solid primary.main` 인디케이터 (`borderBottom`)
  - `boxShadow: 'inset 0 -3px 0 currentColor'` 방식으로 구현
- 비선택 탭: `bgcolor: transparent`, `color: text.secondary`, `fontWeight: 600`
  - 하단 `3px solid transparent` (공간 유지)
- 호버 시: `bgcolor: '#F0F7FF'`, 하단 `3px solid primary.light`
- 전체 탭 바 하단 `borderBottom: '1px solid divider'` 유지
- 좌우 `borderLeft/Right` 제거 (더 깔끔한 언더라인 패턴)
- 탭 `py: 1.5` → `py: 1.75` 로 살짝 높이 증가

### 3.2 WorkMenuBar — 드롭다운 패널

**현재:**

- 패널 상단 별도 강조 없음
- 아이템 카드에 아이콘 없음
- 호버 시 `bgcolor: '#EEF4FB'` 정도

**변경 후:**

- 패널 컨테이너 상단 `4px` 그라데이션 바: `background: 'linear-gradient(90deg, primary.dark, primary.main)'`
- 각 메뉴 아이템 왼쪽에 MUI 아이콘 추가 (`workMenuConfig`의 `icon` 필드 사용, `DynamicIcon` 렌더링)
- 아이템 호버: `transform: 'translateY(-2px)'`, `transition: 'all 200ms ease'`, `boxShadow: '0 4px 12px rgba(15,23,42,0.1)'`
- 활성(active) 아이템: `borderLeft: '3px solid primary.main'`, `bgcolor: '#EEF4FB'`, `color: primary.main`
- 비활성 아이템: `borderLeft: '3px solid transparent'` (공간 유지)

### 3.3 workMenuConfig — icon 필드 추가

`MenuItem` 타입 및 `workMenuConfig.ts`에 각 항목별 아이콘 매핑:

```
대시보드          → 'Dashboard'
메뉴 관리         → 'Menu'
권한 등록         → 'Shield'   (현재 'shield' → MUI는 'Security' 또는 'Shield')
권한별 메뉴 등록  → 'Link'
업체등록(온보딩)  → 'Business'
사용자            → 'People'
부서              → 'Category'
문서              → 'Assignment'
문서이력          → 'History'
로그인이력        → 'AccessTime'
```

MUI 아이콘 import는 동적으로 처리: `workMenuConfig`에 `icon: string` 저장 후 `WorkMenuBar`에서 MUI `@mui/icons-material`에서 동적 map으로 렌더링.

### 3.4 PageHeader 컴포넌트 (신규)

```tsx
// shared/components/layout/PageHeader.tsx

type PageHeaderProps = {
  title: string;
  groupLabel?: string; // 브레드크럼 그룹명 (예: '시스템 관리')
  description?: string; // 선택적 페이지 설명
};
```

**레이아웃:**

```
[그룹명 아이콘] 시스템 관리  ›  메뉴 관리   ← 브레드크럼 (caption 크기, text.secondary)
┃ 메뉴 관리                               ← h4 제목 (수직 바 왼쪽)
  시스템 메뉴를 등록하고 정렬 순서를 관리합니다.  ← description (선택, body2, text.secondary)
```

**스타일 상세:**

- 외부 `Box`: `pl: 2`, `borderLeft: '4px solid'`, `borderImage: 'linear-gradient(180deg, primary.dark, primary.main) 1'`
  - CSS `borderImage`는 MUI sx에서 직접 지원 안 되므로: `sx={{ borderLeft: '4px solid', borderColor: 'primary.main' }}`
  - 또는 `background: 'linear-gradient(180deg, primary.dark, primary.main)'` + `width: 4px` pseudo element
  - 구현상 단순화: `borderLeft: '4px solid'` + `borderColor: 'primary.dark'` (단색)
- 브레드크럼 줄: `Stack direction="row"`, `spacing: 0.5`, `alignItems: center`
  - `NavigateNextIcon` (또는 `›` 문자) 구분자
  - `Typography variant="caption"`, `color: text.secondary`
- 제목 줄: `Typography variant="h4"`, `fontWeight: 700`
- description 줄: `Typography variant="body2"`, `color: text.secondary`, `mt: 0.5`

**브레드크럼 데이터 자동 조회:**

- `useLocation()` + `workMenuConfig`(exported `getAllMenuGroups()`) → 현재 경로 매칭 → 그룹명/아이템명 반환하는 훅 `useCurrentMenuInfo()` 추가
- `PageHeader`에서 `useCurrentMenuInfo()` 내부 호출하거나, 각 페이지에서 직접 `groupLabel` prop 전달 방식 선택
- **선택: 각 페이지에서 직접 `groupLabel` prop 전달** — 훅 불필요, 단순하고 명확

---

## 4. 미적용 페이지

아래 페이지는 메뉴 네비게이션 외부(인증 플로우)에 있으므로 `PageHeader` 미적용:

- `LoginPage.tsx`
- `PlatformAdminLoginPage.tsx`
- `OnboardingPage.tsx`
- `TenantFirstLoginSetupPage.tsx`
- `DashboardPage.tsx` (대시보드는 특별 레이아웃이므로 제외)
- `NotFoundPage.tsx`

---

## 5. 제약 및 고려사항

- MUI `@mui/icons-material` 이미 사용 중이므로 추가 의존성 없음
- 기존 테스트(`work-menu-bar`, `platform-menu-management-page` test-id) 유지 — 스타일 변경만이므로 기능 테스트에 영향 없음
- `WorkMenuBar` 컴포넌트는 role 기반 렌더링 로직을 건드리지 않음
- `PageHeader`는 순수 표시 컴포넌트로 로직 없음
