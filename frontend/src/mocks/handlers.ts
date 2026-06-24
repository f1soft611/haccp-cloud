import { http, HttpResponse } from 'msw';
import type { AuthorityCode } from '../shared/auth/authorityCode';
import type { UserRole } from '../shared/store/authStore';
import type { DepartmentItem } from '../services/common/departmentsService';
import type {
  DocumentHistoryItem,
  DocumentTemplate,
} from '../services/common/documentsService';
import type { UserItem } from '../services/common/usersService';

type TenantItem = {
  tenantCode: string;
  companyName: string;
  businessRegistrationNumber: string;
  planCode?: string;
  createdAt: string;
};

type SampleTenantItem = {
  tenantCode: string;
  companyName: string;
  adminEmail: string;
  issuedAt: string;
};

type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type PlatformMenuItem = {
  menuId: string;
  menuCode?: string;
  menuNm: string;
  menuDc: string;
  parentMenuId: string | null;
  menuOrdr: number;
  menuUrl: string;
  iconNm: string;
  useAt: 'Y' | 'N';
  frstRegistPnttm: string;
  frstRegisterId: string;
  lastUpdtPnttm: string;
  lastUpdusrId: string;
  parentMenuNm?: string;
  hasChildren?: boolean;
};

type PlatformRoleItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  tenantCode?: string;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
};

const roleByUserId: Record<string, UserRole> = {
  platform_admin: 'PLATFORM_ADMIN',
  tenant_admin: 'TENANT_ADMIN',
  user_01: 'USER',
};

let tenants: TenantItem[] = [
  {
    tenantCode: 'TENANT-A',
    companyName: '알파푸드',
    businessRegistrationNumber: '123-45-67890',
    planCode: 'C',
    createdAt: '2026-06-10T09:00:00.000Z',
  },
  {
    tenantCode: 'TENANT-B',
    companyName: '베타HACCP',
    businessRegistrationNumber: '234-56-78901',
    planCode: 'B',
    createdAt: '2026-06-10T09:30:00.000Z',
  },
];

const sampleTenants: SampleTenantItem[] = [
  {
    tenantCode: 'TENANT-SAMPLE-01',
    companyName: '샘플푸드 1호',
    adminEmail: 'admin1@samplefood.com',
    issuedAt: '2026-06-10T09:00:00.000Z',
  },
  {
    tenantCode: 'TENANT-SAMPLE-02',
    companyName: '샘플푸드 2호',
    adminEmail: 'admin2@samplefood.com',
    issuedAt: '2026-06-10T09:30:00.000Z',
  },
];

const tenantByDomain: Record<
  string,
  { tenantId: number; tenantCode: string; tenantNm: string; logoImage?: string }
> = {
  'f1soft.co.kr': {
    tenantId: 1,
    tenantCode: 'TENANT-A',
    tenantNm: '에프원소프트',
  },
  'tenant-a.local': {
    tenantId: 1,
    tenantCode: 'TENANT-A',
    tenantNm: '알파푸드',
  },
};

let issuedTenantSequence = 101;

function buildMockIssuedTenantCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(issuedTenantSequence).padStart(4, '0');
  issuedTenantSequence += 1;
  return `TENANT_${yy}${mm}${dd}${seq}`;
}

let platformMenus: PlatformMenuItem[] = [
  {
    menuId: 'PM-1',
    menuNm: '종합 대시보드',
    menuDc: 'HACCP 통합 대시보드',
    parentMenuId: null,
    menuOrdr: 1,
    menuUrl: '/dashboard',
    iconNm: 'Dashboard',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:00:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:00:00.000Z',
    lastUpdusrId: 'platform_admin',
    hasChildren: false,
  },
  {
    menuId: 'PM-2',
    menuNm: '기준정보',
    menuDc: '기준 정보 관리',
    parentMenuId: null,
    menuOrdr: 2,
    menuUrl: '/base',
    iconNm: 'Settings',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:05:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:05:00.000Z',
    lastUpdusrId: 'platform_admin',
    hasChildren: true,
  },
  {
    menuId: 'PM-2-1',
    menuNm: '공통코드 관리',
    menuDc: '공통코드 관리 페이지',
    parentMenuId: 'PM-2',
    menuOrdr: 1,
    menuUrl: '/base/common-code',
    iconNm: 'Menu',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:06:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:06:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '기준정보',
  },
  {
    menuId: 'PM-2-2',
    menuNm: '품목 관리',
    menuDc: '품목 정보 관리',
    parentMenuId: 'PM-2',
    menuOrdr: 2,
    menuUrl: '/base/item',
    iconNm: 'Inventory',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:07:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:07:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '기준정보',
  },
  {
    menuId: 'PM-2-3',
    menuNm: '설비 관리',
    menuDc: '설비 정보 관리',
    parentMenuId: 'PM-2',
    menuOrdr: 3,
    menuUrl: '/base/equipment',
    iconNm: 'Build',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:08:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:08:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '기준정보',
  },
  {
    menuId: 'PM-3',
    menuNm: '생산기초관리',
    menuDc: '생산 기초 정보 관리',
    parentMenuId: null,
    menuOrdr: 3,
    menuUrl: '/prod',
    iconNm: 'Factory',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:09:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:09:00.000Z',
    lastUpdusrId: 'platform_admin',
    hasChildren: true,
  },
  {
    menuId: 'PM-3-1',
    menuNm: '공정 관리',
    menuDc: '공정 관리 페이지',
    parentMenuId: 'PM-3',
    menuOrdr: 1,
    menuUrl: '/base/process',
    iconNm: 'Category',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:10:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:10:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '생산기초관리',
  },
  {
    menuId: 'PM-4',
    menuNm: '생산관리',
    menuDc: '생산 공정 관리',
    parentMenuId: null,
    menuOrdr: 4,
    menuUrl: '/prod-mgmt',
    iconNm: 'Business',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:11:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:11:00.000Z',
    lastUpdusrId: 'platform_admin',
    hasChildren: false,
  },
  {
    menuId: 'PM-5',
    menuNm: '시스템 관리',
    menuDc: '시스템 관리 메뉴',
    parentMenuId: null,
    menuOrdr: 5,
    menuUrl: '/admin',
    iconNm: 'AdminPanelSettings',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:12:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:12:00.000Z',
    lastUpdusrId: 'platform_admin',
    hasChildren: true,
  },
  {
    menuId: 'PM-5-1',
    menuCode: 'MENU_MENU_MANAGEMENT',
    menuNm: '메뉴 관리',
    menuDc: '메뉴 관리 페이지',
    parentMenuId: 'PM-5',
    menuOrdr: 1,
    menuUrl: '/platform/menus',
    iconNm: 'Menu',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:13:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:13:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '시스템 관리',
  },
  {
    menuId: 'PM-5-2',
    menuCode: 'MENU_PLAN_MANAGEMENT',
    menuNm: '플랜 관리',
    menuDc: '플랜별 메뉴 매핑 관리',
    parentMenuId: 'PM-5',
    menuOrdr: 2,
    menuUrl: '/platform/plans',
    iconNm: 'Settings',
    useAt: 'Y',
    frstRegistPnttm: '2026-06-15T10:14:00.000Z',
    frstRegisterId: 'platform_admin',
    lastUpdtPnttm: '2026-06-15T10:14:00.000Z',
    lastUpdusrId: 'platform_admin',
    parentMenuNm: '시스템 관리',
  },
];

let users: UserItem[] = [
  {
    id: 'U-1',
    tenantCode: 'TENANT-A',
    name: '관리자A',
    email: 'admin.a@alpha.com',
    department: '품질관리팀',
    role: 'TENANT_ADMIN',
    active: true,
  },
  {
    id: 'U-2',
    tenantCode: 'TENANT-A',
    name: '사용자A1',
    email: 'user.a1@alpha.com',
    department: '생산1팀',
    role: 'USER',
    active: true,
  },
  {
    id: 'U-3',
    tenantCode: 'TENANT-B',
    name: '관리자B',
    email: 'admin.b@beta.com',
    department: '품질관리팀',
    role: 'TENANT_ADMIN',
    active: true,
  },
];

const accessibleMenuPathsByAuthorityCode: Record<AuthorityCode, string[]> = {
  PLATFORM_ADMIN: [
    '/dashboard',
    '/platform/onboarding',
    '/platform/plans',
    '/platform/menus',
    '/platform/roles',
    '/platform/role-menus',
    '/platform/login-history',
  ],
  TENANT_ADMIN: ['/dashboard', '/users', '/documents'],
  TENANT_USER: ['/dashboard', '/documents'],
};

let platformRoles: PlatformRoleItem[] = [
  {
    id: 'PR-1',
    code: 'PLATFORM_ADMIN',
    name: '플랫폼 관리자',
    description: '플랫폼 설정 및 운영 관리 권한',
    tenantCode: 'PLATFORM',
    active: true,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-15T09:00:00.000Z',
  },
  {
    id: 'PR-2',
    code: 'TENANT_ADMIN',
    name: '업체 관리자',
    description: '업체 운영 및 사용자 관리 권한',
    tenantCode: 'TENANT-A',
    active: true,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-15T09:20:00.000Z',
  },
  {
    id: 'PR-3',
    code: 'TENANT_USER',
    name: '업체 사용자',
    description: '일반 업무 처리 권한',
    tenantCode: 'TENANT-A',
    active: true,
    updatedBy: 'platform_admin',
    updatedAt: '2026-06-15T09:30:00.000Z',
  },
];

const roleMenuMappings: Record<AuthorityCode, string[]> = {
  PLATFORM_ADMIN: [
    'PM-1',
    'PM-2',
    'PM-2-1',
    'PM-2-2',
    'PM-2-3',
    'PM-3',
    'PM-3-1',
    'PM-4',
    'PM-5',
    'PM-5-1',
    'PM-5-2',
  ],
  TENANT_ADMIN: ['PM-1', 'PM-2', 'PM-2-1', 'PM-2-2', 'PM-2-3', 'PM-3'],
  TENANT_USER: ['PM-1', 'PM-3'],
};

function normalizeAuthorityCode(authorityCode: string): AuthorityCode {
  const normalized = authorityCode.trim().toUpperCase();

  if (normalized === 'PLATFORM_ADMIN') {
    return 'PLATFORM_ADMIN';
  }

  if (normalized === 'TENANT_ADMIN') {
    return 'TENANT_ADMIN';
  }

  return 'TENANT_USER';
}

let departments: DepartmentItem[] = [
  { id: 'D-1', tenantCode: 'TENANT-A', name: '품질관리팀', active: true },
  { id: 'D-2', tenantCode: 'TENANT-A', name: '생산1팀', active: true },
  { id: 'D-3', tenantCode: 'TENANT-B', name: '품질관리팀', active: true },
];

let documents: DocumentTemplate[] = [
  {
    id: 'DOC-1',
    tenantCode: 'TENANT-A',
    title: 'CCP 온도점검표',
    category: 'CCP',
    content: '가열공정 온도 점검 기준',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '관리자A',
    updatedAt: '2026-06-10T10:00:00.000Z',
  },
  {
    id: 'DOC-2',
    tenantCode: 'TENANT-A',
    title: '세척 SOP',
    category: 'PRP',
    content: '설비 세척 절차서',
    status: 'DRAFT',
    version: 1,
    updatedBy: '사용자A1',
    updatedAt: '2026-06-10T11:00:00.000Z',
  },
  {
    id: 'DOC-3',
    tenantCode: 'TENANT-A',
    title: 'CCP-1B 생산공정 점검일지',
    category: 'CCP',
    content: '생산 라인 CCP 점검 항목',
    status: 'ACTIVE',
    version: 3,
    updatedBy: '노혜현',
    updatedAt: '2026-06-10T12:10:00.000Z',
  },
  {
    id: 'DOC-4',
    tenantCode: 'TENANT-A',
    title: '종합관리점검표(CCP-B)',
    category: 'CCP',
    content: 'CCP-B 종합점검 기준',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '금도연',
    updatedAt: '2026-06-10T12:35:00.000Z',
  },
  {
    id: 'DOC-5',
    tenantCode: 'TENANT-A',
    title: '육가공공정 위생점검표',
    category: 'HACCP',
    content: '육가공 라인 위생 관리 기준',
    status: 'ACTIVE',
    version: 4,
    updatedBy: '고다성',
    updatedAt: '2026-06-10T13:05:00.000Z',
  },
  {
    id: 'DOC-6',
    tenantCode: 'TENANT-A',
    title: '일일 세척 및 소독일지',
    category: 'PRP',
    content: '설비 및 작업장 세척 기록',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '노혜현',
    updatedAt: '2026-06-10T13:50:00.000Z',
  },
  {
    id: 'DOC-7',
    tenantCode: 'TENANT-A',
    title: '부적합품 관리대장',
    category: '품질',
    content: '부적합품 처리 및 재발방지 기록',
    status: 'ACTIVE',
    version: 5,
    updatedBy: '고다성',
    updatedAt: '2026-06-10T14:20:00.000Z',
  },
  {
    id: 'DOC-8',
    tenantCode: 'TENANT-A',
    title: '작업장 청소 점검표',
    category: 'HACCP',
    content: '작업장 구역별 청소 점검',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '노혜현',
    updatedAt: '2026-06-10T14:45:00.000Z',
  },
  {
    id: 'DOC-9',
    tenantCode: 'TENANT-A',
    title: '일일업무보고(품질관리)',
    category: '기안서',
    content: '품질관리팀 일일 업무보고 양식',
    status: 'ACTIVE',
    version: 1,
    updatedBy: '한충열',
    updatedAt: '2026-06-10T15:05:00.000Z',
  },
  {
    id: 'DOC-10',
    tenantCode: 'TENANT-A',
    title: '주간 점검결과 보고서',
    category: '기타문서',
    content: '주간 점검 결과 요약 및 조치',
    status: 'DRAFT',
    version: 1,
    updatedBy: '김영화',
    updatedAt: '2026-06-10T15:25:00.000Z',
  },
  {
    id: 'DOC-11',
    tenantCode: 'TENANT-A',
    title: '구매처 위생 평가서',
    category: 'HA',
    content: '원부자재 구매처 위생 평가표',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '송한진',
    updatedAt: '2026-06-10T15:50:00.000Z',
  },
  {
    id: 'DOC-12',
    tenantCode: 'TENANT-A',
    title: '월간 설비점검 계획서',
    category: '기타문서',
    content: '월간 설비 예방점검 계획',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '전남일',
    updatedAt: '2026-06-10T16:10:00.000Z',
  },
  {
    id: 'DOC-13',
    tenantCode: 'TENANT-A',
    title: '이물혼입 대응 절차서',
    category: 'HACCP',
    content: '이물혼입 발생 시 조치 절차',
    status: 'ACTIVE',
    version: 3,
    updatedBy: '고다성',
    updatedAt: '2026-06-10T16:35:00.000Z',
  },
  {
    id: 'DOC-14',
    tenantCode: 'TENANT-A',
    title: '세금계산서 양식',
    category: '기안서',
    content: '세금계산서 발행 요청 양식',
    status: 'DRAFT',
    version: 1,
    updatedBy: '윤선기',
    updatedAt: '2026-06-10T17:00:00.000Z',
  },
  {
    id: 'DOC-15',
    tenantCode: 'TENANT-B',
    title: '입고검수 체크리스트',
    category: 'HACCP',
    content: '원재료 입고검수 항목',
    status: 'ACTIVE',
    version: 1,
    updatedBy: '관리자B',
    updatedAt: '2026-06-10T10:45:00.000Z',
  },
  {
    id: 'DOC-16',
    tenantCode: 'TENANT-B',
    title: 'CCP 가열공정 점검표',
    category: 'CCP',
    content: '가열공정 CCP 관리 기준',
    status: 'ACTIVE',
    version: 2,
    updatedBy: '관리자B',
    updatedAt: '2026-06-10T12:40:00.000Z',
  },
];

let histories: DocumentHistoryItem[] = [
  {
    id: 'H-1',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-1',
    title: 'CCP 온도점검표',
    version: 1,
    changedBy: '관리자A',
    changedAt: '2026-06-09T10:00:00.000Z',
    summary: '초기 템플릿 등록',
  },
  {
    id: 'H-2',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-1',
    title: 'CCP 온도점검표',
    version: 2,
    changedBy: '관리자A',
    changedAt: '2026-06-10T10:00:00.000Z',
    summary: '온도 허용 범위 문구 수정',
  },
  {
    id: 'H-3',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-3',
    title: 'CCP-1B 생산공정 점검일지',
    version: 3,
    changedBy: '노혜현',
    changedAt: '2026-06-10T12:10:00.000Z',
    summary: '점검 항목 순서 및 라벨 정리',
  },
  {
    id: 'H-4',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-5',
    title: '육가공공정 위생점검표',
    version: 4,
    changedBy: '고다성',
    changedAt: '2026-06-10T13:05:00.000Z',
    summary: '현장 사진 첨부 규칙 추가',
  },
  {
    id: 'H-5',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-7',
    title: '부적합품 관리대장',
    version: 5,
    changedBy: '고다성',
    changedAt: '2026-06-10T14:20:00.000Z',
    summary: '재처리 항목 체크박스 추가',
  },
  {
    id: 'H-6',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-9',
    title: '일일업무보고(품질관리)',
    version: 1,
    changedBy: '한충열',
    changedAt: '2026-06-10T15:05:00.000Z',
    summary: '신규 보고서 양식 등록',
  },
  {
    id: 'H-7',
    tenantCode: 'TENANT-A',
    documentId: 'DOC-13',
    title: '이물혼입 대응 절차서',
    version: 3,
    changedBy: '고다성',
    changedAt: '2026-06-10T16:35:00.000Z',
    summary: '긴급 연락 체계 표 업데이트',
  },
  {
    id: 'H-8',
    tenantCode: 'TENANT-B',
    documentId: 'DOC-16',
    title: 'CCP 가열공정 점검표',
    version: 2,
    changedBy: '관리자B',
    changedAt: '2026-06-10T12:40:00.000Z',
    summary: '허용 기준 오탈자 수정',
  },
];

function getTenantCodeFromHeader(request: Request): string {
  return request.headers.get('x-tenant-code') || 'TENANT-A';
}

function getRequiredTenantCodeFromHeader(request: Request): string | null {
  const tenantCode = request.headers.get('x-tenant-code')?.trim();
  return tenantCode ? tenantCode : null;
}

function tenantScoped<T extends { tenantCode: string }>(
  list: T[],
  tenantCode: string,
): T[] {
  return list.filter((item) => item.tenantCode === tenantCode);
}

function resolveOnboardingStatus(
  userCount: number,
  departmentCount: number,
): OnboardingStatus {
  if (userCount >= 1 && departmentCount >= 1) {
    return 'COMPLETED';
  }

  if (userCount === 0 && departmentCount === 0) {
    return 'NOT_STARTED';
  }

  return 'IN_PROGRESS';
}

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const payload = (await request.json()) as {
      tenantCode?: string;
      userId?: string;
      password?: string;
    };

    if (!payload.tenantCode || !payload.userId || !payload.password) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (payload.password !== 'Passw0rd!') {
      return HttpResponse.json(
        { message: '로그인 정보가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    const normalizedUserId = payload.userId.trim().toLowerCase();
    const role = roleByUserId[normalizedUserId] ?? 'USER';
    const userCount = tenantScoped(users, payload.tenantCode).length;
    const departmentCount = tenantScoped(
      departments,
      payload.tenantCode,
    ).length;
    const onboardingStatus = resolveOnboardingStatus(
      userCount,
      departmentCount,
    );

    return HttpResponse.json({
      tenantCode: payload.tenantCode,
      userId: payload.userId,
      role,
      accessToken: `token-${payload.tenantCode}-${payload.userId}`,
      onboardingRequired: onboardingStatus !== 'COMPLETED',
      onboardingStatus,
    });
  }),

  http.post('/api/auth/login-jwt', async ({ request }) => {
    const payload = (await request.json()) as {
      id?: string;
      password?: string;
      tenantCode?: string;
      factoryCode?: string;
    };

    if (!payload.id || !payload.password) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (payload.password !== 'Passw0rd!') {
      return HttpResponse.json(
        { message: '로그인 정보가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    const normalizedUserId = payload.id.trim().toLowerCase();
    const role = roleByUserId[normalizedUserId] ?? 'USER';
    const tenantCode = payload.tenantCode || payload.factoryCode || 'TENANT-A';
    const userCount = tenantScoped(users, tenantCode).length;
    const departmentCount = tenantScoped(departments, tenantCode).length;
    const onboardingStatus = resolveOnboardingStatus(
      userCount,
      departmentCount,
    );

    return HttpResponse.json({
      resultCode: '200',
      jToken: `token-000001-${payload.id}`,
      refreshToken: `refresh-000001-${payload.id}`,
      loginHistoryId: Date.now(),
      onboardingRequired: onboardingStatus !== 'COMPLETED',
      onboardingStatus,
      resultVO: {
        factoryCode: '000001',
        id: payload.id,
        name: normalizedUserId === 'platform_admin' ? '플랫폼관리자' : '홍길동',
        groupNm: role === 'PLATFORM_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER',
      },
    });
  }),

  http.post('/api/auth/login-jwt/admin', async ({ request }) => {
    const payload = (await request.json()) as {
      id?: string;
      password?: string;
    };

    if (!payload.id || !payload.password) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    if (payload.password !== 'Passw0rd!') {
      return HttpResponse.json(
        { message: '로그인 정보가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    const normalizedUserId = payload.id.trim().toLowerCase();
    const role = roleByUserId[normalizedUserId] ?? 'USER';

    if (role !== 'PLATFORM_ADMIN') {
      return HttpResponse.json(
        { message: '플랫폼 관리자 계정만 로그인할 수 있습니다.' },
        { status: 403 },
      );
    }

    return HttpResponse.json({
      resultCode: '200',
      jToken: `admin-token-000001-${payload.id}`,
      refreshToken: `admin-refresh-000001-${payload.id}`,
      loginHistoryId: Date.now(),
      resultVO: {
        factoryCode: '000001',
        id: payload.id,
        name: '플랫폼관리자',
        groupNm: 'ROLE_ADMIN',
      },
    });
  }),

  http.get('/api/tenants/:domain', ({ params }) => {
    const domain = String(params.domain ?? '')
      .trim()
      .toLowerCase();

    const tenant = tenantByDomain[domain];
    if (!tenant) {
      return HttpResponse.json(
        { resultCode: 404, resultMessage: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      resultCode: 200,
      resultMessage: '성공했습니다.',
      result: {
        tenantId: tenant.tenantId,
        tenantCode: tenant.tenantCode,
        tenantNm: tenant.tenantNm,
        logoImage: tenant.logoImage,
        onboardingStatus: 'COMPLETED',
        useAt: 'Y',
      },
    });
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const payload = (await request.json()) as {
      refreshToken?: string;
    };

    if (!payload.refreshToken) {
      return HttpResponse.json(
        { resultCode: '401', resultMessage: '리프레쉬 토큰이 없습니다.' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      resultCode: '200',
      jToken: `refreshed-${payload.refreshToken}`,
    });
  }),

  http.post('/api/auth/logout', async () => {
    return HttpResponse.json({
      resultCode: '200',
      resultMessage: '성공',
    });
  }),

  http.get('/api/platform-admin/login-history', ({ request }) => {
    const url = new URL(request.url);
    const pageIndex = Number(url.searchParams.get('pageIndex') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
    const factoryCode = url.searchParams.get('factoryCode') ?? '';
    const searchUserId =
      url.searchParams.get('searchUserId')?.toLowerCase() ?? '';
    const searchLoginResult = url.searchParams.get('searchLoginResult') ?? '';

    const base = [
      {
        loginHistoryId: 120,
        factoryCode: 'PLATFORM',
        userId: 'platform_admin',
        userName: '플랫폼관리자',
        loginDt: '2026-06-12 09:40:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT_ADMIN',
        loginResult: 'Y',
        logoutDt: '2026-06-12 10:15:00',
      },
      {
        loginHistoryId: 119,
        factoryCode: 'TENANT-A',
        userId: 'tenant_admin',
        userName: '업체관리자',
        loginDt: '2026-06-12 09:05:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT',
        loginResult: 'Y',
        logoutDt: '',
      },
      {
        loginHistoryId: 118,
        factoryCode: 'TENANT-A',
        userId: 'tenant_admin',
        userName: '업체관리자',
        loginDt: '2026-06-12 08:59:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT',
        loginResult: 'N',
        failReason: '아이디 또는 비밀번호가 일치하지 않습니다',
        logoutDt: '',
      },
    ];

    const filtered = base.filter((row) => {
      const factoryMatches = factoryCode
        ? row.factoryCode === factoryCode
        : true;
      const userMatches = searchUserId
        ? row.userId.toLowerCase().includes(searchUserId)
        : true;
      const resultMatches = searchLoginResult
        ? row.loginResult === searchLoginResult
        : true;

      return factoryMatches && userMatches && resultMatches;
    });

    const offset = Math.max(0, (pageIndex - 1) * pageSize);
    const loginHistoryList = filtered.slice(offset, offset + pageSize);

    return HttpResponse.json({
      resultCode: 0,
      resultMessage: 'OK',
      result: {
        loginHistoryList,
        totalCount: filtered.length,
      },
    });
  }),

  http.get('/api/platform-admin/login-history/list', ({ request }) => {
    const url = new URL(request.url);
    const pageIndex = Number(url.searchParams.get('pageIndex') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '10');
    const factoryCode = url.searchParams.get('factoryCode') ?? '';
    const searchUserId =
      url.searchParams.get('searchUserId')?.toLowerCase() ?? '';
    const searchLoginResult = url.searchParams.get('searchLoginResult') ?? '';

    const base = [
      {
        loginHistoryId: 120,
        factoryCode: 'PLATFORM',
        userId: 'platform_admin',
        userName: '플랫폼관리자',
        loginDt: '2026-06-12 09:40:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT_ADMIN',
        loginResult: 'Y',
        logoutDt: '2026-06-12 10:15:00',
      },
      {
        loginHistoryId: 119,
        factoryCode: 'TENANT-A',
        userId: 'tenant_admin',
        userName: '업체관리자',
        loginDt: '2026-06-12 09:05:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT',
        loginResult: 'Y',
        logoutDt: '',
      },
      {
        loginHistoryId: 118,
        factoryCode: 'TENANT-B',
        userId: 'tenant_admin',
        userName: '업체관리자',
        loginDt: '2026-06-12 08:59:00',
        loginIp: '127.0.0.1',
        loginType: 'JWT',
        loginResult: 'N',
        failReason: '아이디 또는 비밀번호가 일치하지 않습니다',
        logoutDt: '',
      },
    ];

    const filtered = base.filter((row) => {
      const factoryMatches = factoryCode
        ? row.factoryCode === factoryCode
        : true;
      const userMatches = searchUserId
        ? row.userId.toLowerCase().includes(searchUserId)
        : true;
      const resultMatches = searchLoginResult
        ? row.loginResult === searchLoginResult
        : true;

      return factoryMatches && userMatches && resultMatches;
    });

    const offset = Math.max(0, (pageIndex - 1) * pageSize);
    const loginHistoryList = filtered.slice(offset, offset + pageSize);

    return HttpResponse.json({
      resultCode: 0,
      resultMessage: 'OK',
      result: {
        loginHistoryList,
        totalCount: filtered.length,
      },
    });
  }),

  http.post('/api/tenants', async ({ request }) => {
    const payload = (await request.json()) as {
      tenantCode?: string;
      companyName?: string;
      adminName?: string;
      adminEmail?: string;
    };

    if (!payload.tenantCode || !payload.companyName) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const duplicated = tenants.some(
      (item) => item.tenantCode === payload.tenantCode,
    );
    if (duplicated) {
      return HttpResponse.json(
        { message: '중복된 업체 코드입니다.' },
        { status: 409 },
      );
    }

    const created = {
      tenantCode: payload.tenantCode,
      companyName: payload.companyName,
      businessRegistrationNumber: '',
      createdAt: new Date().toISOString(),
    };
    tenants = [created, ...tenants];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post('/api/tenants/issue-code', async ({ request }) => {
    const payload = (await request.json()) as {
      companyName?: string;
      businessRegistrationNumber?: string;
      corporateNumber?: string;
      representativeName?: string;
      businessType?: string;
      businessCategory?: string;
      address?: string;
      phoneNumber?: string;
      registrationDate?: string;
      adminName?: string;
      adminEmail?: string;
    };

    const companyName = payload.companyName?.trim() ?? '';
    const businessRegistrationNumber =
      payload.businessRegistrationNumber?.trim() ?? '';
    const corporateNumber = payload.corporateNumber?.trim() ?? '';
    const businessType = payload.businessType?.trim() ?? '';
    const businessCategory = payload.businessCategory?.trim() ?? '';
    const adminName = payload.adminName?.trim() ?? '';
    const adminEmail = payload.adminEmail?.trim() ?? '';

    if (
      !companyName ||
      !businessRegistrationNumber ||
      !corporateNumber ||
      !businessType ||
      !businessCategory ||
      !adminName ||
      !adminEmail
    ) {
      return HttpResponse.json(
        { message: '입력값이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const duplicated = tenants.some(
      (item) => item.businessRegistrationNumber === businessRegistrationNumber,
    );
    if (duplicated) {
      return HttpResponse.json(
        {
          code: 'DUPLICATE_BRN',
          message: '이미 등록된 사업자번호입니다.',
        },
        { status: 409 },
      );
    }

    const tenantCode = buildMockIssuedTenantCode();

    const created: TenantItem = {
      tenantCode,
      companyName,
      businessRegistrationNumber,
      createdAt: new Date().toISOString(),
    };

    tenants = [created, ...tenants];

    return HttpResponse.json(
      {
        ...created,
        adminEmail,
        mailDispatchStatus: 'QUEUED',
      },
      { status: 201 },
    );
  }),

  http.get('/api/tenants/samples', () => {
    return HttpResponse.json(sampleTenants);
  }),

  http.get('/api/first-login-setup/status', ({ request }) => {
    const tenantCode = getRequiredTenantCodeFromHeader(request);

    if (!tenantCode) {
      return HttpResponse.json(
        { message: 'x-tenant-code header is required.' },
        { status: 400 },
      );
    }

    const userCount = tenantScoped(users, tenantCode).length;
    const departmentCount = tenantScoped(departments, tenantCode).length;
    const onboardingStatus = resolveOnboardingStatus(
      userCount,
      departmentCount,
    );

    return HttpResponse.json({
      tenantCode,
      userCount,
      departmentCount,
      onboardingRequired: onboardingStatus !== 'COMPLETED',
      onboardingStatus,
    });
  }),

  http.post('/api/first-login-setup/complete', ({ request }) => {
    const tenantCode = getRequiredTenantCodeFromHeader(request);

    if (!tenantCode) {
      return HttpResponse.json(
        { message: 'x-tenant-code header is required.' },
        { status: 400 },
      );
    }

    const userCount = tenantScoped(users, tenantCode).length;
    const departmentCount = tenantScoped(departments, tenantCode).length;

    if (userCount < 1 || departmentCount < 1) {
      return HttpResponse.json(
        { message: '사용자 1명 이상, 부서 1개 이상이 필요합니다.' },
        { status: 422 },
      );
    }

    return HttpResponse.json({
      tenantCode,
      userCount,
      departmentCount,
      onboardingRequired: false,
      onboardingStatus: 'COMPLETED',
    });
  }),

  http.get('/api/users', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    return HttpResponse.json(tenantScoped(users, tenantCode));
  }),

  http.post('/api/users', async ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      department?: string;
      role?: UserRole;
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.department ||
      !payload.role
    ) {
      return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const created: UserItem = {
      id: `U-${users.length + 1}`,
      tenantCode,
      name: payload.name,
      email: payload.email,
      department: payload.department,
      role: payload.role,
      active: true,
    };

    users = [created, ...users];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('/api/users/:id', async ({ params, request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const payload = (await request.json()) as { active?: boolean };

    const target = users.find(
      (item) => item.id === params.id && item.tenantCode === tenantCode,
    );
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    target.active = payload.active ?? target.active;
    return HttpResponse.json(target);
  }),

  http.get('/api/departments', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    return HttpResponse.json(tenantScoped(departments, tenantCode));
  }),

  http.post('/api/departments', async ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const payload = (await request.json()) as { name?: string };

    if (!payload.name) {
      return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const created: DepartmentItem = {
      id: `D-${departments.length + 1}`,
      tenantCode,
      name: payload.name,
      active: true,
    };

    departments = [created, ...departments];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('/api/departments/:id', async ({ params, request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const payload = (await request.json()) as { active?: boolean };

    const target = departments.find(
      (item) => item.id === params.id && item.tenantCode === tenantCode,
    );

    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    target.active = payload.active ?? target.active;
    return HttpResponse.json(target);
  }),

  http.get('/api/documents', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    return HttpResponse.json(tenantScoped(documents, tenantCode));
  }),

  http.post('/api/documents', async ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const payload = (await request.json()) as {
      title?: string;
      category?: string;
      content?: string;
      status?: 'DRAFT' | 'ACTIVE';
      updatedBy?: string;
    };

    if (
      !payload.title ||
      !payload.category ||
      !payload.content ||
      !payload.status
    ) {
      return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const created: DocumentTemplate = {
      id: `DOC-${documents.length + 1}`,
      tenantCode,
      title: payload.title,
      category: payload.category,
      content: payload.content,
      status: payload.status,
      version: 1,
      updatedBy: payload.updatedBy || 'system',
      updatedAt: new Date().toISOString(),
    };

    documents = [created, ...documents];
    histories = [
      {
        id: `H-${histories.length + 1}`,
        tenantCode,
        documentId: created.id,
        title: created.title,
        version: created.version,
        changedBy: created.updatedBy,
        changedAt: created.updatedAt,
        summary: '템플릿 생성',
      },
      ...histories,
    ];

    return HttpResponse.json(created, { status: 201 });
  }),

  http.get('/api/document-history', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    return HttpResponse.json(tenantScoped(histories, tenantCode));
  }),

  http.get('/api/platform-admin/dashboard/kpis', () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const activeTenants = tenants.length;
    const newTenantsLast7Days = tenants.filter(
      (item) => new Date(item.createdAt) >= sevenDaysAgo,
    ).length;

    const ccpByTenant = tenants.map((tenant) => {
      const tenantDocs = documents.filter(
        (item) => item.tenantCode === tenant.tenantCode,
      );
      const generatedCount = tenantDocs.filter((item) =>
        item.category.toUpperCase().includes('CCP'),
      ).length;
      const requiredCount = 3;
      return {
        generatedCount,
        requiredCount,
      };
    });

    const completedTenants = ccpByTenant.filter(
      (item) => item.generatedCount >= item.requiredCount,
    ).length;

    const ccpDocCompletionRate =
      activeTenants === 0
        ? 0
        : Math.round((completedTenants / activeTenants) * 100);

    return HttpResponse.json({
      activeTenants,
      newTenantsLast7Days,
      ccpDocCompletionRate,
      tenantsWithoutCcpDocs: activeTenants - completedTenants,
    });
  }),

  http.get('/api/platform-admin/dashboard/tenant-code-issuance', () => {
    const recentIssues = [...tenants]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((tenant) => ({
        tenantCode: tenant.tenantCode,
        companyName: tenant.companyName,
        issuedAt: tenant.createdAt,
        status: 'ACTIVE' as const,
      }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    return HttpResponse.json({
      totalIssued: tenants.length,
      issuedThisMonth: tenants.filter(
        (item) => new Date(item.createdAt) >= monthStart,
      ).length,
      issuedThisWeek: tenants.filter(
        (item) => new Date(item.createdAt) >= weekStart,
      ).length,
      recentIssues,
    });
  }),

  http.get('/api/platform-admin/dashboard/tenants', () => {
    const items = tenants.map((tenant) => {
      const tenantAdmin = users.find(
        (user) =>
          user.tenantCode === tenant.tenantCode && user.role === 'TENANT_ADMIN',
      );

      return {
        tenantCode: tenant.tenantCode,
        companyName: tenant.companyName,
        adminName: tenantAdmin?.name ?? '-',
        adminEmail: tenantAdmin?.email ?? '-',
        status: 'ACTIVE' as const,
        onboardingStatus: 'ACTIVE' as const,
        planCode: tenant.planCode ?? 'C',
        createdAt: tenant.createdAt,
      };
    });

    return HttpResponse.json({
      summary: {
        total: items.length,
        active: items.length,
        inactive: 0,
      },
      items,
    });
  }),

  http.get('/api/platform-admin/dashboard/ccp-documents', () => {
    const items = tenants.map((tenant) => {
      const tenantDocs = documents.filter(
        (item) => item.tenantCode === tenant.tenantCode,
      );
      const ccpDocs = tenantDocs.filter((item) =>
        item.category.toUpperCase().includes('CCP'),
      );
      const generatedCount = ccpDocs.length;
      const requiredCount = 3;
      const completionRate = Math.min(
        100,
        Math.round((generatedCount / requiredCount) * 100),
      );
      const updatedAt = ccpDocs[0]?.updatedAt ?? tenant.createdAt;

      return {
        tenantCode: tenant.tenantCode,
        companyName: tenant.companyName,
        generatedCount,
        requiredCount,
        completionRate,
        updatedAt,
      };
    });

    const completedTenants = items.filter(
      (item) => item.completionRate >= 100,
    ).length;
    const totalTenants = items.length;
    const completionRate =
      totalTenants === 0
        ? 0
        : Math.round(
            items.reduce((sum, item) => sum + item.completionRate, 0) /
              totalTenants,
          );

    return HttpResponse.json({
      overall: {
        completionRate,
        completedTenants,
        totalTenants,
      },
      items,
    });
  }),

  http.get('/api/platform-admin/menus', () => {
    return HttpResponse.json(
      [...platformMenus].sort((a, b) => a.menuOrdr - b.menuOrdr),
    );
  }),

  http.post('/api/platform-admin/menus', async ({ request }) => {
    const payload = (await request.json()) as {
      menuCode?: string;
      menuNm?: string;
      menuDc?: string;
      menuUrl?: string;
      parentMenuId?: string | null;
      menuOrdr?: number;
      iconNm?: string;
      useAt?: 'Y' | 'N';
    };

    const isRootMenu = payload.parentMenuId == null;

    if (!payload.menuNm || (!isRootMenu && !payload.menuUrl)) {
      return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const normalizedMenuCode = (payload.menuCode ?? '').trim().toUpperCase();

    const created: PlatformMenuItem = {
      menuId: `PM-${Date.now()}`,
      menuCode: normalizedMenuCode || `MENU_${Date.now()}`,
      menuNm: payload.menuNm,
      menuDc: payload.menuDc ?? '',
      menuUrl: payload.menuUrl ?? '',
      parentMenuId: payload.parentMenuId ?? null,
      menuOrdr: payload.menuOrdr ?? 0,
      iconNm: payload.iconNm ?? 'Menu',
      useAt: payload.useAt ?? 'Y',
      frstRegistPnttm: new Date().toISOString(),
      frstRegisterId: 'platform_admin',
      lastUpdtPnttm: new Date().toISOString(),
      lastUpdusrId: 'platform_admin',
    };

    platformMenus = [created, ...platformMenus];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('/api/platform-admin/menus/:id', async ({ params, request }) => {
    const payload = (await request.json()) as {
      menuNm?: string;
      menuDc?: string;
      menuUrl?: string;
      parentMenuId?: string | null;
      menuOrdr?: number;
      iconNm?: string;
      useAt?: 'Y' | 'N';
    };

    const target = platformMenus.find((item) => item.menuId === params.id);
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    // Check if menu has children
    const hasChildren = platformMenus.some(
      (item) => item.parentMenuId === params.id,
    );
    if (hasChildren && payload.parentMenuId !== target.parentMenuId) {
      return HttpResponse.json(
        { message: 'Cannot change parent menu when menu has children' },
        { status: 400 },
      );
    }

    target.menuNm = payload.menuNm ?? target.menuNm;
    target.menuDc = payload.menuDc ?? target.menuDc;
    target.menuUrl = payload.menuUrl ?? target.menuUrl;
    if (Object.prototype.hasOwnProperty.call(payload, 'parentMenuId')) {
      target.parentMenuId = payload.parentMenuId ?? null;
    }
    target.menuOrdr = payload.menuOrdr ?? target.menuOrdr;
    target.iconNm = payload.iconNm ?? target.iconNm;
    target.useAt = payload.useAt ?? target.useAt;
    target.lastUpdtPnttm = new Date().toISOString();
    target.lastUpdusrId = 'platform_admin';

    return HttpResponse.json(target);
  }),

  http.delete('/api/platform-admin/menus/:id', async ({ params }) => {
    const target = platformMenus.find((item) => item.menuId === params.id);
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    // Check if menu has children
    const hasChildren = platformMenus.some(
      (item) => item.parentMenuId === params.id,
    );
    if (hasChildren) {
      return HttpResponse.json(
        { message: 'Cannot delete menu that has children' },
        { status: 400 },
      );
    }

    platformMenus = platformMenus.filter((item) => item.menuId !== params.id);
    return HttpResponse.json({ message: 'Deleted' });
  }),

  http.get('/api/platform-admin/roles', ({ request }) => {
    const requestUrl = new URL(request.url);
    const tenantCode = (requestUrl.searchParams.get('tenantCode') ?? '')
      .trim()
      .toUpperCase();
    const items = tenantCode
      ? platformRoles.filter(
          (item) => (item.tenantCode ?? 'PLATFORM') === tenantCode,
        )
      : platformRoles;
    return HttpResponse.json([...items]);
  }),

  http.post('/api/platform-admin/roles', async ({ request }) => {
    const payload = (await request.json()) as {
      code?: string;
      name?: string;
      description?: string;
      active?: boolean;
      tenantCode?: string;
    };

    if (!payload.code || !payload.name) {
      return HttpResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const isDuplicate = platformRoles.some(
      (item) => item.code.toUpperCase() === payload.code?.toUpperCase(),
    );
    if (isDuplicate) {
      return HttpResponse.json(
        { message: 'Duplicate role code' },
        { status: 409 },
      );
    }

    const created: PlatformRoleItem = {
      id: `PR-${platformRoles.length + 1}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description ?? '',
      tenantCode: (payload.tenantCode ?? 'PLATFORM').trim().toUpperCase(),
      active: payload.active ?? true,
      updatedBy: 'platform_admin',
      updatedAt: new Date().toISOString(),
    };

    platformRoles = [created, ...platformRoles];
    roleMenuMappings[normalizeAuthorityCode(created.code)] = [];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('/api/platform-admin/roles/:id', async ({ params, request }) => {
    const payload = (await request.json()) as { active?: boolean };

    const targetId = String(params.id ?? '');
    const normalizedTargetCode = normalizeAuthorityCode(targetId);
    const target = platformRoles.find(
      (item) =>
        item.id === targetId ||
        normalizeAuthorityCode(item.code) === normalizedTargetCode,
    );
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    target.active = payload.active ?? target.active;
    target.updatedAt = new Date().toISOString();
    return HttpResponse.json(target);
  }),

  http.put('/api/platform-admin/roles/:id', async ({ params, request }) => {
    const payload = (await request.json()) as {
      name?: string;
      description?: string;
      active?: boolean;
    };

    const targetId = String(params.id ?? '');
    const normalizedTargetCode = normalizeAuthorityCode(targetId);
    const target = platformRoles.find(
      (item) =>
        item.id === targetId ||
        normalizeAuthorityCode(item.code) === normalizedTargetCode,
    );
    if (!target) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    target.name = payload.name ?? target.name;
    target.description = payload.description ?? target.description;
    target.active = payload.active ?? target.active;
    target.updatedAt = new Date().toISOString();
    return HttpResponse.json(target);
  }),

  http.get('/api/platform-admin/role-menus', ({ request }) => {
    const requestUrl = new URL(request.url);
    const roleCode = normalizeAuthorityCode(
      requestUrl.searchParams.get('roleCode') ?? '',
    );
    if (!roleCode) {
      return HttpResponse.json(
        { message: 'roleCode required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      roleCode,
      menuIds: roleMenuMappings[roleCode] ?? [],
    });
  }),

  http.put(
    '/api/platform-admin/role-menus/:roleCode',
    async ({ params, request }) => {
      const payload = (await request.json()) as { menuIds?: string[] };
      const roleCode = normalizeAuthorityCode(String(params.roleCode));
      roleMenuMappings[roleCode] = payload.menuIds ?? [];

      return HttpResponse.json({
        roleCode,
        menuIds: roleMenuMappings[roleCode],
      });
    },
  ),

  http.get('/api/platform-admin/role-menu-candidates', ({ request }) => {
    const requestUrl = new URL(request.url);
    const tenantCode = (requestUrl.searchParams.get('tenantCode') ?? 'PLATFORM')
      .trim()
      .toUpperCase();
    const planCode =
      tenants.find((tenant) => tenant.tenantCode === tenantCode)?.planCode ??
      'C';

    const planMenuCodesByPlan: Record<string, string[]> = {
      A: ['PM-1', 'PM-5-1'],
      B: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2'],
      C: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2', 'PM-2-3', 'PM-3-1'],
      P: platformMenus.map((menu) => menu.menuId),
    };

    return HttpResponse.json({
      tenantCode,
      menuCodes: planMenuCodesByPlan[planCode] ?? planMenuCodesByPlan.C,
    });
  }),

  http.get('/api/platform-admin/user-menus/:authorityCode', ({ params }) => {
    const authorityCode = normalizeAuthorityCode(String(params.authorityCode));
    const menuList = accessibleMenuPathsByAuthorityCode[authorityCode].map(
      (menuUrl) => ({ menuUrl }),
    );

    return HttpResponse.json({ result: { menuList } });
  }),

  http.get('/api/platform-admin/plan-access/me', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);

    const features: Record<string, boolean> = {
      FEATURE_USER_MGMT: true,
      FEATURE_DOC_WORKFLOW: true,
      FEATURE_AUDIT_LOG: true,
      FEATURE_API_EXPORT: true,
    };

    return HttpResponse.json({
      tenantId: tenantCode === 'TENANT-B' ? 2 : 1,
      tenantCode,
      planCode:
        tenants.find((tenant) => tenant.tenantCode === tenantCode)?.planCode ??
        'C',
      features,
    });
  }),

  http.get('/api/platform-admin/plan-access/plans', () => {
    return HttpResponse.json([
      {
        planCode: 'A',
        planName: 'Basic',
        useAt: 'Y',
        featureCount: 2,
        menuCount: 2,
      },
      {
        planCode: 'B',
        planName: 'Standard',
        useAt: 'Y',
        featureCount: 3,
        menuCount: 4,
      },
      {
        planCode: 'C',
        planName: 'Pro',
        useAt: 'Y',
        featureCount: 4,
        menuCount: 6,
      },
      {
        planCode: 'P',
        planName: 'Platform',
        useAt: 'Y',
        featureCount: 6,
        menuCount: platformMenus.length,
      },
    ]);
  }),

  http.get(
    '/api/platform-admin/plan-access/plans/:planCode/features',
    ({ params }) => {
      const planCode = String(params.planCode ?? 'C')
        .trim()
        .toUpperCase();
      const featuresByPlan: Record<string, Record<string, boolean>> = {
        A: { FEATURE_USER_MGMT: true, FEATURE_DOC_WORKFLOW: false },
        B: {
          FEATURE_USER_MGMT: true,
          FEATURE_DOC_WORKFLOW: true,
          FEATURE_AUDIT_LOG: false,
        },
        C: {
          FEATURE_USER_MGMT: true,
          FEATURE_DOC_WORKFLOW: true,
          FEATURE_AUDIT_LOG: true,
          FEATURE_API_EXPORT: true,
        },
        P: {
          FEATURE_USER_MGMT: true,
          FEATURE_DOC_WORKFLOW: true,
          FEATURE_AUDIT_LOG: true,
          FEATURE_API_EXPORT: true,
        },
      };

      return HttpResponse.json({
        planCode,
        features: featuresByPlan[planCode] ?? featuresByPlan.C,
      });
    },
  ),

  http.get(
    '/api/platform-admin/plan-access/plans/:planCode/menus',
    ({ params }) => {
      const planCode = String(params.planCode ?? 'C')
        .trim()
        .toUpperCase();
      const planMenuCodesByPlan: Record<string, string[]> = {
        A: ['PM-1', 'PM-5-1'],
        B: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2'],
        C: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2', 'PM-2-3', 'PM-3-1'],
        P: platformMenus.map((menu) => menu.menuId),
      };

      return HttpResponse.json({
        planCode,
        menuCodes: planMenuCodesByPlan[planCode] ?? planMenuCodesByPlan.C,
      });
    },
  ),

  http.put(
    '/api/platform-admin/plan-access/plans/:planCode/menus',
    async ({ params, request }) => {
      const planCode = String(params.planCode ?? 'C')
        .trim()
        .toUpperCase();
      const payload = (await request.json()) as { menuCodes?: string[] };
      return HttpResponse.json({
        planCode,
        menuCodes: payload.menuCodes ?? [],
      });
    },
  ),

  http.get(
    '/api/platform-admin/plan-access/tenant-plan-menus',
    ({ request }) => {
      const requestUrl = new URL(request.url);
      const tenantCode = (
        requestUrl.searchParams.get('tenantCode') ?? 'PLATFORM'
      )
        .trim()
        .toUpperCase();
      const planCode =
        tenants.find((tenant) => tenant.tenantCode === tenantCode)?.planCode ??
        'C';
      const planMenuCodesByPlan: Record<string, string[]> = {
        A: ['PM-1', 'PM-5-1'],
        B: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2'],
        C: ['PM-1', 'PM-5-1', 'PM-2-1', 'PM-2-2', 'PM-2-3', 'PM-3-1'],
        P: platformMenus.map((menu) => menu.menuId),
      };

      return HttpResponse.json({
        tenantCode,
        menuCodes: planMenuCodesByPlan[planCode] ?? planMenuCodesByPlan.C,
      });
    },
  ),

  http.get('/api/dashboard', ({ request }) => {
    const tenantCode = getTenantCodeFromHeader(request);
    const tenantDocuments = tenantScoped(documents, tenantCode);
    const today = new Date().toISOString().slice(0, 10);
    const updatedToday = tenantDocuments.filter((item) =>
      item.updatedAt.startsWith(today),
    ).length;

    return HttpResponse.json({
      totalDocuments: tenantDocuments.length,
      draftTemplates: tenantDocuments.filter((item) => item.status === 'DRAFT')
        .length,
      updatedToday,
    });
  }),
];
