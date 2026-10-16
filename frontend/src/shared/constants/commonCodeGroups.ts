// 공통코드 그룹 코드. 새 그룹은 여기에 한 줄 추가한다.
export const COMMON_CODE_GROUP = {
    WORK_CYCLE: 'WF_FORM_CYCLE',
    ITEM_UNIT: 'ITEM_UNIT',
    ITEM_TYPE: 'ITEM_TYPE',
} as const;

export type CommonCodeGroupCode = (typeof COMMON_CODE_GROUP)[keyof typeof COMMON_CODE_GROUP];