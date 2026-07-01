import type { DocumentStatus } from '../../services/documents/documentsService';
import type { UserRole } from '../store/authStore';

export type DocumentStatusCode = DocumentStatus;

export const APP_LABELS = {
  appTitle: 'HACCP 관리시스템',
  appSubtitle: '문서 포털',
  header: {
    govNotice: '이 서비스는 HACCP 클라우드 시스템 입니다.',
    searchPlaceholder: '문서, 담당자, 작업을 검색하세요',
    searchAction: '통합검색',
    fontSizeAction: '화면크기',
    fontSizeResetAction: '초기화',
  },
  menu: {
    dashboardGroup: '대시보드 관리',
    platformGroup: '플랫폼 관리',
    documentGroup: '문서 관리',
    systemGroup: '시스템 관리',
    dashboard: '대시보드',
    platformMenuManagement: '메뉴 관리',
    platformFactoryManagement: '업체 관리',
    platformPlanManagement: '플랜 관리',
    platformRoleManagement: '권한 관리',
    platformRoleMenuManagement: '권한별 메뉴 등록',
    onboarding: '업체등록',
    loginHistory: '로그인이력',
    users: '사용자',
    departments: '부서',
    documents: '문서',
    history: '문서이력',
    logout: '로그아웃',
  },
  pageTitle: {
    login: '로그인',
    onboarding: '업체 온보딩',
    tenantFirstSetup: '업체 관리자 최초 설정',
    users: '사용자 관리',
    departments: '부서 관리',
    documents: '문서 템플릿',
    history: '문서 변경 이력',
    loginHistory: '로그인 이력',
    dashboard: 'HACCP 문서 포털',
    platformMenuManagement: '메뉴 관리',
    platformPlanManagement: '플랜 관리',
    platformRoleManagement: '플랫폼 권한/메뉴 관리',
    platformRoleMenuManagement: '플랫폼 권한/메뉴 관리',
    notFound: '페이지를 찾을 수 없음',
  },
  field: {
    tenantCode: '업체 코드',
    userId: '사용자 ID',
    user: '사용자',
    password: '비밀번호',
    companyName: '업체명',
    businessRegistrationNumber: '사업자번호',
    corporateNumber: '법인번호',
    representativeName: '대표자명',
    businessType: '업종',
    businessCategory: '업태',
    address: '업체 주소',
    phoneNumber: '전화번호',
    registrationDate: '사업자 등록일',
    adminName: '관리자 이름',
    adminEmail: '관리자 이메일',
    name: '이름',
    email: '이메일',
    department: '부서',
    departmentName: '부서명',
    title: '제목',
    category: '구분',
    content: '내용',
    status: '상태',
  },
  action: {
    login: '로그인',
    platformAdminLogin: '플랫폼 관리자 로그인',
    createTenant: '업체 생성',
    issueTenantCode: '업체 코드 발급',
    retry: '다시 시도',
    addUser: '사용자 추가',
    addDepartment: '부서 추가',
    completeFirstSetup: '초기 설정 완료',
    addTemplate: '템플릿 추가',
    activate: '활성화',
    deactivate: '비활성화',
    nextStep: '다음 단계',
    prevStep: '이전으로',
    confirm: '확인',
    edit: '수정하기',
    newTenantRegistration: '새 업체 등록',
    goToDashboard: '대시보드로',
    newIssueTenantCode: '신규 업체 코드 발급',
    logout: '로그아웃',
    changePassword: '비밀번호 변경',
    save: '저장',
  },
  table: {
    title: '제목',
    category: '구분',
    status: '상태',
    version: '버전',
    updatedBy: '작성자',
    name: '이름',
    email: '이메일',
    department: '부서',
    role: '권한',
    action: '작업',
    changedBy: '변경자',
    changedAt: '변경일시',
    summary: '요약',
  },
  message: {
    loginHelp: '도메인을 포함한 로그인 ID를 입력하세요.',
    loginFailed: '로그인 실패: 사용자 ID 또는 비밀번호를 확인하세요.',
    platformAdminLoginFailed:
      '플랫폼 관리자 로그인 실패: 계정 정보를 확인하세요.',
    onboardingDescription:
      '플랫폼 관리자가 신규 업체 관리자 정보를 입력해 업체 코드를 발급합니다.',
    onboardingSuccess: '업체 코드 발급 및 안내 메일 발송이 완료되었습니다.',
    onboardingFailed: '업체 코드 발급에 실패했습니다. 입력값을 확인하세요.',
    onboardingDuplicateBrn:
      '이미 등록된 사업자번호입니다. 사업자번호를 확인하고 수정해주세요.',
    onboardingDuplicateAdminEmail:
      '이미 등록된 업체 관리자 이메일입니다. 이메일을 확인하고 수정해주세요.',
    onboardingBrnFormatError: '사업자번호 형식: 000-00-00000',
    tenantFirstSetupGuide:
      '사용자 1명 이상과 부서 1개 이상을 생성한 뒤 초기 설정 완료를 진행하세요.',
    tenantFirstSetupStatusError:
      '초기 설정 진행 상태를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
    tenantFirstSetupRequirementFailed:
      '완료 조건 미충족: 사용자 1명 이상, 부서 1개 이상이 필요합니다.',
    tenantFirstSetupCompleted:
      '초기 설정이 완료되었습니다. 대시보드로 이동할 수 있습니다.',
    tenantFirstSetupCompleteFailed:
      '초기 설정 완료 처리에 실패했습니다. 조건을 확인한 뒤 다시 시도해주세요.',
    tenantFirstSetupMissingTenantCode:
      '업체 코드 정보를 확인할 수 없습니다. 다시 로그인 후 시도해주세요.',
    notFoundDescription: '요청한 페이지를 찾을 수 없습니다.',
  },
  onboarding: {
    issuedTenantCode: '발급된 업체 코드',
    mailDispatchStatus: '메일 발송 상태',
    mailStatus: {
      MOCK_SENT: '발송 완료 (테스트)',
      QUEUED: '대기열',
      SENT: '발송 완료',
      FAILED: '발송 실패',
    },
    sampleTenantListTitle: '발급된 업체 코드 이력',
    sampleTenantListLoading: '업체 코드 이력을 불러오는 중입니다.',
    sampleTenantListError: '업체 코드 이력을 불러오지 못했습니다.',
    sampleTenantListEmpty: '아직 발급된 업체가 없습니다.',
    wizardSteps: ['업체 정보 입력', '내용 확인', '발급 완료'],
    sectionCompanyInfo: '업체 정보',
    sectionAdminInfo: '담당 관리자 정보',
    confirmTitle: '등록 정보 확인',
    confirmDescription: '아래 내용으로 업체 코드를 발급합니다.',
    completeTitle: '업체 코드 발급 완료',
    completeDescription: '안내 메일이 등록된 관리자에게 발송되었습니다.',
  },
  dashboard: {
    sectionHeading: 'DOCUMENT MANAGEMENT PORTAL',
    totalDocuments: '전체 문서',
    dailyChecks: '일일 점검',
    weeklyChecks: '주간 점검',
    monthlyChecks: '월간 점검',
    issueResponse: '발생시 대응',
    cycleLabel: '주기 필터',
    cycles: ['일', '월', '주', '년', '발생시'] as const,
    columns: {
      no: '번호',
      name: '구분명',
      cycle: '주기',
      owner: '담당자',
    },
    sections: {
      selected: 'HACCP (선별)',
      ha: 'HACCP (HA)',
      others: '기타문서',
    },
    kpi: {
      ccpCompletion: 'CCP 점검 완료율',
      unchecked: '미점검 건수',
      draftDocs: '임시저장 문서 수',
      todayAction: '금일 조치 필요 건수',
    },
    blocks: {
      quickActions: '빠른 작업',
      loginPanel: '로그인 상태',
      todos: '할 일',
      recentHistory: '최근 변경 이력',
      alerts: '점검 및 공지',
    },
    hubs: {
      user: '사용자 허브',
      admin: '관리자 허브',
      users: '사용자 관리',
      departments: '부서 관리',
      onboarding: '업체 온보딩',
      loginHistory: '로그인 이력',
      documents: '문서 템플릿',
      history: '문서 변경 이력',
    },
    todoItems: [
      '미점검 항목 확인',
      '임시저장 문서 검토',
      '신규 사용자 승인',
      '오늘 변경 이력 점검',
    ],
    searchPlaceholder: '구분명, 담당자 검색...',
    platformAdmin: {
      title: '플랫폼 관리자 운영 대시보드',
      errorMessage:
        '플랫폼 관리자 대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도하세요.',
      kpi: {
        activeTenants: '활성 업체 수',
        newTenantsLast7Days: '최근 7일 신규 업체',
        ccpDocCompletionRate: 'CCP 문서 작성률',
        tenantsWithoutCcpDocs: 'CCP 문서 미작성 업체',
      },
      sections: {
        tenantCodeIssuance: '업체 코드 발급 현황',
        tenantList: '업체 목록',
        ccpDocuments: 'CCP 문서 현황',
      },
      summary: {
        totalIssued: '전체 발급',
        issuedThisWeek: '주간 발급',
        totalTenants: '전체 업체',
        activeTenants: '활성 업체',
        completionRate: '평균 작성률',
      },
      table: {
        tenantCode: '업체코드',
        companyName: '업체명',
        issuedAt: '발급일',
        status: '상태',
        adminName: '관리자',
        completionRate: '작성률',
      },
      cta: '신규 업체 코드 발급',
      quickActions: {
        menuManagement: '메뉴 관리',
        roleManagement: '권한/메뉴 관리',
        roleMenuManagement: '권한/메뉴 관리',
      },
      topbar: {
        quickLink: '바로가기 > 신규 업체 코드 등록',
        quickMenuLabel: '자주 찾는 메뉴',
        loginInfoLabel: '로그인 정보',
      },
      statusLabel: {
        ACTIVE: '활성',
        INACTIVE: '비활성',
      },
    },
  },
} as const;

export function getDocumentStatusLabel(status: DocumentStatusCode): string {
  return status === 'DRAFT' ? '임시저장' : '사용중';
}

export function getActiveLabel(active: boolean): string {
  return active ? '활성' : '비활성';
}

export function getRoleLabel(role: UserRole): string {
  if (role === 'PLATFORM_ADMIN') return '플랫폼관리자';
  if (role === 'TENANT_ADMIN') return '업체관리자';
  return '일반사용자';
}
