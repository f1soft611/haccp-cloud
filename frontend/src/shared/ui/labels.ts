import type { DocumentStatus } from '../../services/documentsService';
import type { UserRole } from '../store/authStore';

export type DocumentStatusCode = DocumentStatus;

export const APP_LABELS = {
  appTitle: 'HACCP 관리시스템',
  appSubtitle: '문서 포털',
  header: {
    govNotice: '이 서비스는 HACCP 클라우드 시스템 입니다.',
    searchPlaceholder: '문서, 담당자, 작업을 검색하세요',
  },
  menu: {
    dashboard: '대시보드',
    onboarding: '업체등록',
    users: '사용자',
    departments: '부서',
    documents: '문서',
    history: '문서이력',
    logout: '로그아웃',
  },
  pageTitle: {
    login: '로그인',
    onboarding: '업체 온보딩',
    users: '사용자 관리',
    departments: '부서 관리',
    documents: '문서 템플릿',
    history: '문서 변경 이력',
    dashboard: 'HACCP 문서 포털',
    notFound: '페이지를 찾을 수 없음',
  },
  field: {
    tenantCode: '업체 코드',
    userId: '사용자 ID',
    password: '비밀번호',
    companyName: '업체명',
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
    createTenant: '업체 생성',
    addUser: '사용자 추가',
    addDepartment: '부서 추가',
    addTemplate: '템플릿 추가',
    activate: '활성화',
    deactivate: '비활성화',
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
    loginHelp: '테스트 로그인: 업체 코드 + 사용자 ID',
    loginFailed:
      '로그인 실패: 업체 코드, 사용자 ID 또는 비밀번호를 확인하세요.',
    onboardingDescription:
      '플랫폼 관리자가 신규 업체와 초기 관리자 정보를 등록합니다.',
    onboardingSuccess: '업체 등록이 완료되었습니다.',
    onboardingFailed: '업체 등록에 실패했습니다. 업체 코드를 확인하세요.',
    notFoundDescription: '요청한 페이지를 찾을 수 없습니다.',
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
