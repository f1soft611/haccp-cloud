import type { CSSProperties } from 'react';
import type {
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../services/basicinfo/commonCodeService';
import { COMMON_CODE_GROUP } from '../../shared/constants/commonCodeGroups';
import type { CommonCodeOption } from '../../shared/hooks/useCommonCodeOptions';

export type DocumentFieldComboAttrs = {
    comboCode: string;
    comboName: string;
    value: string;
    valueName: string;
};

export const COMBO_PLACEHOLDER_TEXT = '콤보박스: 종류를 선택하세요';
export const COMBO_EMPTY_KIND_TEXT = 'EDITOR_COMBO 상세코드가 없습니다';

// 노드 표시와 HTML 렌더가 같이 쓰는 스타일 (HTML 은 toStyleText 로 문자열화)
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

// 노드 attrs 를 안전한 문자열 4개로 정규화
export function normalizeComboAttrs(attrs: unknown): DocumentFieldComboAttrs {
    const source = (attrs ?? {}) as Record<string, unknown>;
    return {
        comboCode: toText(source.comboCode),
        comboName: toText(source.comboName),
        value: toText(source.value),
        valueName: toText(source.valueName),
    };
}

// 콤보 종류(EDITOR_COMBO 상세코드)에 속한 값 선택지: EDITOR_COMBO 하위 그룹 상세 중 상위코드가 같은 사용중 코드
// ponytail: 하위 그룹이 여러 개이고 같은 종류 아래 코드가 겹치면 중복 표시됨. 생기면 code 기준 중복 제거 추가
export function getComboItemOptions(
    groups: CommonCodeGroupItem[],
    details: CommonCodeDetailItem[],
    comboCode: string,
): CommonCodeOption[] {
    if (!comboCode) return [];
    const childGroupCodes = new Set(
        groups
        .filter((group) => group.parentGroupCode === COMMON_CODE_GROUP.EDITOR_COMBO)
        .map((group) => group.groupCode),
    );
    return details
    .filter((detail) => childGroupCodes.has(detail.groupCode) && detail.parentCode === comboCode && detail.useAt)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((detail) => ({ code: detail.code, name: detail.codeName }));
}