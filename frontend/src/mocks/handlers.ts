import { http, HttpResponse } from 'msw';
import type { UserRole } from '../shared/store/authStore';
import type { DepartmentItem } from '../services/departmentsService';
import type {
  DocumentHistoryItem,
  DocumentTemplate,
} from '../services/documentsService';
import type { UserItem } from '../services/usersService';

type TenantItem = {
  tenantCode: string;
  companyName: string;
  businessRegistrationNumber: string;
  createdAt: string;
};

type SampleTenantItem = {
  tenantCode: string;
  companyName: string;
  adminEmail: string;
  issuedAt: string;
};

type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

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
    createdAt: '2026-06-10T09:00:00.000Z',
  },
  {
    tenantCode: 'TENANT-B',
    companyName: '베타HACCP',
    businessRegistrationNumber: '234-56-78901',
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

let issuedTenantSequence = 101;

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

  http.post('/api/auth/login-jwt/admin', async ({ request }) => {
    const payload = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    if (!payload.userId || !payload.password) {
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

    if (role !== 'PLATFORM_ADMIN') {
      return HttpResponse.json(
        { message: '플랫폼 관리자 계정만 로그인할 수 있습니다.' },
        { status: 403 },
      );
    }

    const platformTenantCode = '000001';
    const userCount = tenantScoped(users, platformTenantCode).length;
    const departmentCount = tenantScoped(
      departments,
      platformTenantCode,
    ).length;
    const onboardingStatus = resolveOnboardingStatus(
      userCount,
      departmentCount,
    );

    return HttpResponse.json({
      tenantCode: platformTenantCode,
      userId: payload.userId,
      role,
      accessToken: `admin-token-${platformTenantCode}-${payload.userId}`,
      onboardingRequired: onboardingStatus !== 'COMPLETED',
      onboardingStatus,
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
      representativeName?: string;
      businessType?: string;
      address?: string;
      phoneNumber?: string;
      registrationDate?: string;
      adminName?: string;
      adminEmail?: string;
    };

    const companyName = payload.companyName?.trim() ?? '';
    const businessRegistrationNumber =
      payload.businessRegistrationNumber?.trim() ?? '';
    const adminName = payload.adminName?.trim() ?? '';
    const adminEmail = payload.adminEmail?.trim() ?? '';

    if (
      !companyName ||
      !businessRegistrationNumber ||
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

    const tenantCode = `TENANT-${issuedTenantSequence}`;
    issuedTenantSequence += 1;

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
        mailDispatchStatus: 'MOCK_SENT',
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
