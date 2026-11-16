import type { CommonCodeDetailItem, CommonCodeGroupItem } from '../../../services/basicinfo/commonCodeService';

export type CommonCodeRowState = 'saved' | 'new' | 'modified';

// 상위그룹은 행 id(parentId, 최상위 '')로 참조한다. 신규 부모의 그룹코드가 바뀌어도 연결이 유지되고, 저장 시 parentGroupCode로 변환한다.
export type CommonCodeGroupRow = Omit<CommonCodeGroupItem, 'parentGroupCode'> & {
    id: string;
    parentId: string;
    rowState: CommonCodeRowState;
};

// 트리 표시용 행: 들여쓰기 깊이와 접기/펼치기 버튼 표시 여부
export type CommonCodeGroupTreeRow = CommonCodeGroupRow & {
    depth: number;
    hasChildren: boolean;
};

// 상세는 그룹을 행 id로 참조한다. 신규 그룹의 그룹코드가 바뀌어도 연결이 유지되고, 저장 시 groupCode로 변환한다.
export type CommonCodeDetailRow = Omit<CommonCodeDetailItem, 'groupCode'> & {
    id: string;
    groupId: string;
    rowState: CommonCodeRowState;
};