export type TodoCategoryKey = 'haccpPre' | 'haccpHa' | 'others';

export const TODO_CATEGORY_SECTIONS: Array<{
  key: TodoCategoryKey;
  label: 'HACCP(선행)' | 'HACCP(HA)' | '기타문서';
}> = [
  { key: 'haccpPre', label: 'HACCP(선행)' },
  { key: 'haccpHa', label: 'HACCP(HA)' },
  { key: 'others', label: '기타문서' },
];

export const NOTICE_ITEMS = [
  {
    id: 'notice-1',
    scope: '업체',
    title: 'HACCP CCP 온도기록 누락 점검 주간 운영(6.19~6.26)',
    date: '2026-07-15',
  },
  {
    id: 'notice-2',
    scope: '업체',
    title: '현장 점검 체크리스트 모바일 입력 기능 점검 안내',
    date: '2026-07-14',
  },
  {
    id: 'notice-3',
    scope: '플랫폼',
    title: '플랫폼 공통 문서 템플릿 버전관리 정책 업데이트 안내',
    date: '2026-07-13',
  },
  {
    id: 'notice-4',
    scope: '플랫폼',
    title: '식품안전 사고 대응 보고서 제출 절차 변경 공지',
    date: '2026-07-12',
  },
] as const;
