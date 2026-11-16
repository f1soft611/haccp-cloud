import type { CSSProperties } from 'react';
import type { CommonCodeGroupItem } from '../../services/basicinfo/commonCodeService';
import { COMMON_CODE_GROUP } from '../../shared/constants/commonCodeGroups';
import type { CommonCodeOption } from '../../shared/hooks/useCommonCodeOptions';

export type DocumentFieldComboAttrs = {
    groupCode: string;
    value: string;
    valueName: string;
};

export const COMBO_PLACEHOLDER_TEXT = '콤보박스: 클릭하여 코드그룹 선택';
export const COMBO_NO_GROUP_TEXT = 'EDITOR_COMBO 하위 그룹이 없습니다';

// 노드 표시/HTML 렌더 공통 스타일 (HTML 은 toStyleText 로 문자열화)
export const COMBO_STYLE: CSSProperties = {
    display: 'inline-block',
    minWidth: 64,
    padding: '0 4px',
    border: '1px dashed #94a3b8',
    borderRadius: 4,
    fontSize: 13,
};

function toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

// 노드 attrs 를 안전한 문자열 3개로 정규화
export function normalizeComboAttrs(attrs: unknown): DocumentFieldComboAttrs {
    const source = (attrs ?? {}) as Record<string, unknown>;
    return {
        groupCode: toText(source.groupCode),
        value: toText(source.value),
        valueName: toText(source.valueName),
    };
}

// EDITOR_COMBO 바로 아래 그룹을 콤보 종류 선택지로 변환
export function getComboGroups(groups: CommonCodeGroupItem[]): CommonCodeOption[] {
    return groups
    .filter((group) => group.parentGroupCode === COMMON_CODE_GROUP.EDITOR_COMBO)
    .map((group) => ({ code: group.groupCode, name: group.groupName }));
}