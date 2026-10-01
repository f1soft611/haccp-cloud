import type { CommonCodeDetailItem, CommonCodeGroupItem } from '../../../services/basicinfo/commonCodeService';

export type CommonCodeRowState = 'saved' | 'new' | 'modified';

export type CommonCodeGroupRow = CommonCodeGroupItem & {
    id: string;
    rowState: CommonCodeRowState;
};

// 상세는 그룹을 행 id로 참조한다. 신규 그룹의 그룹코드가 바뀌어도 연결이 유지되고, 저장 시 groupCode로 변환한다.
export type CommonCodeDetailRow = Omit<CommonCodeDetailItem, 'groupCode'> & {
    id: string;
    groupId: string;
    rowState: CommonCodeRowState;
};