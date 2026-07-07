export type HaccpFormCategory = 'HACCP문서(HA)' | '일반' | '기타';

export type HaccpCycle = '일' | '주' | '월' | '발생시';

export type HaccpBaseRow = {
  id: string;
  no: number;
  divisionCode: string;
  divisionName: string;
  category: HaccpFormCategory;
  cycle: HaccpCycle;
  createdBy: string;
  createdAt: string;
  owner: string;
};

export type HaccpBaseCreateForm = {
  divisionCode: string;
  divisionName: string;
  category: HaccpFormCategory;
  cycle: HaccpCycle;
};

export const HACCP_CATEGORY_OPTIONS: HaccpFormCategory[] = [
  'HACCP문서(HA)',
  '일반',
  '기타',
];

export const HACCP_CYCLE_OPTIONS: HaccpCycle[] = ['일', '주', '월', '발생시'];
