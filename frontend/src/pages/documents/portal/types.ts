import type { HaccpPortalDocumentItem } from '../../../services/documents/haccpPortalService';

// 기존 -> PortalRow = HaccpPortalDocumentItem & { cycleLabel: string }
// 변경 -> 서비스가 cycle(코드)/cycleName(이름)을 주므로 별도 라벨 없음
export type PortalRow = HaccpPortalDocumentItem;

export type PortalSearchValue = {
  category: 'ALL' | string;
  cycle: 'ALL' | string;
  keyword: string;
};
