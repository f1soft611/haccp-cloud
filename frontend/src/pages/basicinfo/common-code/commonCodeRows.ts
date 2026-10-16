import type {
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../../services/basicinfo/commonCodeService';
import type { CommonCodeDetailRow, CommonCodeGroupRow, CommonCodeRowState } from './types';

let newRowSeq = 0;
const newRowId = (prefix: string) => `${prefix}-new-${Date.now()}-${++newRowSeq}`;

export function toGroupRows(items: CommonCodeGroupItem[]): CommonCodeGroupRow[] {
    return items.map((item) => ({ ...item, id: item.groupCode, rowState: 'saved' }));
}

export function toDetailRows(items: CommonCodeDetailItem[]): CommonCodeDetailRow[] {
    return items.map(({ groupCode, ...rest }) => ({
        ...rest,
        id: `${groupCode}:${rest.code}`,
        groupId: groupCode,
        rowState: 'saved',
    }));
}

export function createEmptyGroupRow(): CommonCodeGroupRow {
    return { id: newRowId('group'), groupCode: '', groupName: '', groupDesc: '', rowState: 'new' };
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
        parentCodeName: '',
        useAt: true,
        sortOrder: maxSortOrder + 10,
        codeDesc: '',
        rowState: 'new',
    };
}

export function filterGroupRows(rows: CommonCodeGroupRow[], keyword: string): CommonCodeGroupRow[] {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
        [row.groupCode, row.groupName, row.groupDesc].some((value) => value.toLowerCase().includes(needle)),
    );
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
        const key = `${detail.groupId}:${code}`;
        if (seenDetailKeys.has(key)) return `${label}: 상세코드가 중복됩니다.`;
        seenDetailKeys.add(key);
    }
    return null;
}

export function toGroupPayload(groups: CommonCodeGroupRow[]): CommonCodeGroupItem[] {
    return groups.map((group) => ({
        groupCode: group.groupCode.trim(),
        groupName: group.groupName.trim(),
        groupDesc: group.groupDesc,
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
        parentCodeName: detail.parentCodeName,
        useAt: detail.useAt,
        sortOrder: detail.sortOrder,
        codeDesc: detail.codeDesc,
    }));
}