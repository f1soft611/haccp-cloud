import type {
    CommonCodeData,
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../../services/basicinfo/commonCodeService';
import type { CommonCodeDetailRow, CommonCodeGroupRow, CommonCodeRowState } from './types';

// ponytail: 백엔드 API 전까지 화면 확인용 샘플 데이터
export const SAMPLE_COMMON_CODES: CommonCodeData = {
    groups: [
        { groupCode: 'OCCUR_CYCLE', groupName: '발생 주기', groupDesc: '발생 주기 공통코드' },
        { groupCode: 'UNIT', groupName: '단위', groupDesc: '단위 공통코드' },
        { groupCode: 'STORAGE', groupName: '보관 조건', groupDesc: '보관 조건 공통코드' },
    ],
    details: [
        { groupCode: 'OCCUR_CYCLE', code: 'DAY', codeName: '일', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '발생 주기 - 일' },
        { groupCode: 'OCCUR_CYCLE', code: 'WEEK', codeName: '주', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '발생 주기 - 주' },
        { groupCode: 'OCCUR_CYCLE', code: 'MONTH', codeName: '월', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '발생 주기 - 월' },
        { groupCode: 'OCCUR_CYCLE', code: 'YEAR', codeName: '연', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '발생 주기 - 연' },
        { groupCode: 'OCCUR_CYCLE', code: 'EVENT', codeName: '발생시', parentCodeName: '', useAt: true, sortOrder: 40, codeDesc: '발생 주기 - 발생시' },
        { groupCode: 'UNIT', code: 'KG', codeName: '킬로그램', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
        { groupCode: 'UNIT', code: 'G', codeName: '그램', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
        { groupCode: 'UNIT', code: 'L', codeName: '리터', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '' },
        { groupCode: 'UNIT', code: 'EA', codeName: '개', parentCodeName: '', useAt: true, sortOrder: 40, codeDesc: '' },
        { groupCode: 'UNIT', code: 'BOX', codeName: '박스', parentCodeName: '', useAt: true, sortOrder: 50, codeDesc: '' },
        { groupCode: 'STORAGE', code: 'ROOM', codeName: '실온', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '1~35℃' },
        { groupCode: 'STORAGE', code: 'COLD', codeName: '냉장', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '0~10℃' },
        { groupCode: 'STORAGE', code: 'FROZEN', codeName: '냉동', parentCodeName: '', useAt: true, sortOrder: 30, codeDesc: '-18℃ 이하' },
    ],
};

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

export function validateCommonCodes(
    groups: CommonCodeGroupRow[],
    details: CommonCodeDetailRow[],
): string | null {
    const seenGroupCodes = new Set<string>();
    for (const group of groups) {
        const code = group.groupCode.trim();
        const label = code || '신규 그룹';
        if (!code) return `${label}: 그룹코드를 입력하세요.`;
        if (!group.groupName.trim()) return `${label}: 그룹명을 입력하세요.`;
        if (seenGroupCodes.has(code)) return `${label}: 그룹코드가 중복됩니다.`;
        seenGroupCodes.add(code);
    }

    const groupCodeById = new Map(groups.map((group) => [group.id, group.groupCode.trim()]));
    const seenDetailKeys = new Set<string>();
    for (const detail of details) {
        const label = groupCodeById.get(detail.groupId) || '신규 그룹';
        const code = detail.code.trim();
        if (!code) return `${label}: 상세코드를 입력하세요.`;
        if (!detail.codeName.trim()) return `${label}: 상세코드명을 입력하세요.`;
        const key = `${detail.groupId}:${code}`;
        if (seenDetailKeys.has(key)) return `${label}: 상세코드가 중복됩니다.`;
        seenDetailKeys.add(key);
    }
    return null;
}

export function toCommonCodePayload(
    groups: CommonCodeGroupRow[],
    details: CommonCodeDetailRow[],
): CommonCodeData {
    const groupCodeById = new Map(groups.map((group) => [group.id, group.groupCode.trim()]));
    return {
        groups: groups.map((group) => ({
            groupCode: group.groupCode.trim(),
            groupName: group.groupName.trim(),
            groupDesc: group.groupDesc,
        })),
        details: details.map((detail) => ({
            groupCode: groupCodeById.get(detail.groupId) ?? '',
            code: detail.code.trim(),
            codeName: detail.codeName.trim(),
            parentCodeName: detail.parentCodeName,
            useAt: detail.useAt,
            sortOrder: detail.sortOrder,
            codeDesc: detail.codeDesc,
        })),
    };
}