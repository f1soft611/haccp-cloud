import type { HaccpPortalDocumentItem } from '../../../services/documents/haccpPortalService';

// 기존 -> PortalSection { key, title, items } (분류별 패널)
// 변경 -> 그리드 행 + 검색값
export type PortalRow = HaccpPortalDocumentItem & {
  cycleLabel: string;
};

export type PortalSearchValue = {
  category: 'ALL' | string;
  cycle: 'ALL' | string;
  keyword: string;
};
