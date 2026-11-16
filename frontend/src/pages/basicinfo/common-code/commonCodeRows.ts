import type {
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../../services/basicinfo/commonCodeService';
import type { CommonCodeDetailRow, CommonCodeGroupRow, CommonCodeGroupTreeRow, CommonCodeRowState } from './types';

let newRowSeq = 0;
const newRowId = (prefix: string) => `${prefix}-new-${Date.now()}-${++newRowSeq}`;

export function toGroupRows(items: CommonCodeGroupItem[]): CommonCodeGroupRow[] {
    return items.map(({ parentGroupCode, ...item }) => ({
        ...item,
        id: item.groupCode,
        parentId: parentGroupCode,
        rowState: 'saved',
    }));
}

export function toDetailRows(items: CommonCodeDetailItem[]): CommonCodeDetailRow[] {
    return items.map(({ groupCode, parentCode, ...rest }) => ({
        ...rest,
        id: `${groupCode}:${rest.code}`,
        groupId: groupCode,
        parentCode: parentCode ?? '',
        rowState: 'saved',
    }));
}

// 신규 그룹 행, parentId 를 주면 그 그룹의 하위로 만든다
export function createEmptyGroupRow(parentId = ''): CommonCodeGroupRow {
    return { id: newRowId('group'), groupCode: '', groupName: '', groupDesc: '', parentId, rowState: 'new' };
}

export function createEmptyDetailRow(groupId: string, details: CommonCodeDetailRow[]): CommonCodeDetailRow {
    const maxSortOrder = details
    .filter((detail) => detail.groupId === groupId)
    .reduce((max, detail) => Math.max(max, detail.sortOrder ?? 0), 0);
    return {
        id: newRowId('detail'),
        groupId,
        code: '',
        codeName: '',
        parentCode: '',
        parentCodeName: '',
        useAt: true,
        sortOrder: maxSortOrder + 10,
        codeDesc: '',
        rowState: 'new',
    };
}

// 그룹을 트리 순서로 평탄화한다. 형제는 입력(서버 조회) 순서를 유지하고, 부모를 못 찾으면 최상위로 둔다.
// 검색어가 있으면 일치 행과 그 조상만 남기고 접힘은 무시한다.
export function toGroupTreeRows(
    rows: CommonCodeGroupRow[],
    collapsedIds: ReadonlySet<string>,
    keyword: string,
): CommonCodeGroupTreeRow[] {
    const ids = new Set(rows.map((row) => row.id));
    const childrenOf = new Map<string, CommonCodeGroupRow[]>();
    for (const row of rows) {
        const key = ids.has(row.parentId) ? row.parentId : '';
        childrenOf.set(key, [...(childrenOf.get(key) ?? []), row]);
    }
    const needle = keyword.trim().toLowerCase();
    const matches = (row: CommonCodeGroupRow) =>
        [row.groupCode, row.groupName, row.groupDesc].some((value) => value.toLowerCase().includes(needle));

    const visit = (row: CommonCodeGroupRow, depth: number): CommonCodeGroupTreeRow[] => {
        const children = childrenOf.get(row.id) ?? [];
        const childRows = children.flatMap((child) => visit(child, depth + 1));
        if (needle && !matches(row) && childRows.length === 0) return [];
        const showChildren = needle !== '' || !collapsedIds.has(row.id);
        return [{ ...row, depth, hasChildren: children.length > 0 }, ...(showChildren ? childRows : [])];
    };
    return (childrenOf.get('') ?? []).flatMap((row) => visit(row, 0));
}

// 그룹 id와 그 모든 하위 그룹 id. 상위그룹 선택지에서 빼서 순환을 막는 용도
export function collectDescendantIds(rows: CommonCodeGroupRow[], id: string): Set<string> {
    const result = new Set([id]);
    // ponytail: 행 수 x 깊이 만큼 반복, 그룹이 수십 건이라 충분. 수천 건이 되면 childrenOf 맵으로 바꿀 것
    let grew = true;
    while (grew) {
        grew = false;
        for (const row of rows) {
            if (!result.has(row.id) && result.has(row.parentId)) {
                result.add(row.id);
                grew = true;
            }
        }
    }
    return result;
}

export type ParentCodeOption = { value: string; label: string };

// 상세의 상위코드 선택지. 상위그룹이 없거나, 상위그룹에 사용 중인 저장된 상세가 없으면(묶음용 상위그룹) null
export function getParentCodeOptions(
    groups: CommonCodeGroupRow[],
    details: CommonCodeDetailRow[],
    groupId: string | null,
): ParentCodeOption[] | null {
    const group = groups.find((row) => row.id === groupId);
    if (!group || !groups.some((row) => row.id === group.parentId)) return null;
    const options = details
    .filter((detail) => detail.groupId === group.parentId && detail.useAt && detail.rowState !== 'new')
    .map((detail) => ({ value: detail.code, label: detail.codeName }));
    return options.length > 0 ? options : null;
}

// DataGrid processRowUpdate 공통 처리: 변경 없으면 기존 행, 신규는 new 유지, 그 외 modified
export function markEdited<T extends { rowState: CommonCodeRowState }>(
    newRow: T,
    oldRow: T,
    fields: readonly (keyof T)[],
): T {
    if (!fields.some((field) => newRow[field] !== oldRow[field])) return oldRow;
    return { ...newRow, rowState: oldRow.rowState === 'new' ? 'new' : 'modified' };
}

// 기존 -> validateCommonCodes(groups, details) / toCommonCodePayload(groups, details): 그룹+상세 한 번에 저장
// 변경 -> 그룹 저장(플랫폼관리자)과 상세 저장이 분리되어 검증/페이로드도 분리
export function validateGroupRows(groups: CommonCodeGroupRow[]): string | null {
    const seenGroupCodes = new Set<string>();
    for (const group of groups) {
        const code = group.groupCode.trim();
        const label = code || '신규 그룹';
        if (!code) return `${label}: 그룹코드를 입력하세요.`;
        if (!group.groupName.trim()) return `${label}: 그룹명을 입력하세요.`;
        if (seenGroupCodes.has(code)) return `${label}: 그룹코드가 중복됩니다.`;
        seenGroupCodes.add(code);
    }
    return null;
}

export function validateDetailRows(groups: CommonCodeGroupRow[], details: CommonCodeDetailRow[]): string | null {
    const groupById = new Map(groups.map((group) => [group.id, group]));
    const seenDetailKeys = new Set<string>();
    for (const detail of details) {
        const group = groupById.get(detail.groupId);
        const label = group?.groupCode.trim() || '신규 그룹';
        if (group?.rowState === 'new') return `${label}: 그룹을 먼저 저장하세요.`;
        const code = detail.code.trim();
        if (!code) return `${label}: 상세코드를 입력하세요.`;
        if (!detail.codeName.trim()) return `${label}: 상세코드명을 입력하세요.`;
        // 상위그룹이 있으면 변경된 행만 상위코드 필수 (저장된 기존 행은 다른 상세 저장을 막지 않게 건너뜀)
        if (detail.rowState !== 'saved') {
            const parentOptions = getParentCodeOptions(groups, details, detail.groupId);
            if (parentOptions) {
                if (!detail.parentCode) return `${label}: 상위코드를 선택하세요.`;
                if (!parentOptions.some((option) => option.value === detail.parentCode)) {
                    return `${label}: 사용 중인 상위코드가 아닙니다.`;
                }
            }
        }
        const key = `${detail.groupId}:${code}`;
        if (seenDetailKeys.has(key)) return `${label}: 상세코드가 중복됩니다.`;
        seenDetailKeys.add(key);
    }
    return null;
}

// 그룹 저장 payload, 상위그룹은 부모 행의 현재 그룹코드로 변환
export function toGroupPayload(groups: CommonCodeGroupRow[]): CommonCodeGroupItem[] {
    const groupCodeById = new Map(groups.map((group) => [group.id, group.groupCode.trim()]));
    return groups.map((group) => ({
        groupCode: group.groupCode.trim(),
        groupName: group.groupName.trim(),
        groupDesc: group.groupDesc,
        parentGroupCode: groupCodeById.get(group.parentId) ?? '',
    }));
}

// 변경된 상세만 보낸다 (서버는 upsert만 하고 삭제하지 않음)
export function toDetailPayload(groups: CommonCodeGroupRow[], details: CommonCodeDetailRow[]): CommonCodeDetailItem[] {
    const groupCodeById = new Map(groups.map((group) => [group.id, group.groupCode.trim()]));
    return details
    .filter((detail) => detail.rowState !== 'saved')
    .map((detail) => ({
        groupCode: groupCodeById.get(detail.groupId) ?? '',
        code: detail.code.trim(),
        codeName: detail.codeName.trim(),
        parentCode: detail.parentCode,
        parentCodeName: detail.parentCodeName,
        useAt: detail.useAt,
        sortOrder: detail.sortOrder,
        codeDesc: detail.codeDesc,
    }));
}