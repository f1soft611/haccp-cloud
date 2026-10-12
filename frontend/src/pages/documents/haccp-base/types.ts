export type HaccpCycle = '일' | '주' | '월' | '발생시';

export type HaccpCategoryOption = {
  id: string;
  code: string;
  name: string;
};

export type HaccpBaseRow = {
  id: string;
  no: number;
  divisionCode: string;
  divisionName: string;
  categoryId: string;
  categoryName: string;
  cycle: string;
  cycleName: string;
  createdBy: string;
  createdAt: string;
  owner: string;
  assigneeSummary: string;
  assigneeIds: string[];
  reviewerId: string;
  reviewerName: string;
  approverId: string;
  approverName: string;
  assigneeMapped: boolean;
  hasDocument: boolean;
  useAt: 'Y' | 'N';
};

export type HaccpBaseCreateForm = {
  divisionCode: string;
  divisionName: string;
  categoryId: string;
  cycle: string;
  reviewerId: string;
  approverId: string;
  assigneeIds: string[];
  useAt: 'Y' | 'N';
};

// 기존 -> HACCP_CYCLE_OPTIONS = ['일', '주', '월', '발생시'] / 변경 -> 공통코드로 대체
