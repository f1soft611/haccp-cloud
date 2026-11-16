import { describe, expect, it } from 'vitest';
import {
    collectDescendantIds,
    createEmptyDetailRow,
    createEmptyGroupRow,
    getParentCodeOptions,
    markEdited,
    toDetailRows,
    toGroupRows,
    toGroupTreeRows,
    validateGroupRows,
    validateDetailRows,
    toGroupPayload,
    toDetailPayload,
} from '../../../pages/basicinfo/common-code/commonCodeRows';
import type { CommonCodeGroupTreeRow } from '../../../pages/basicinfo/common-code/types';

const groups = toGroupRows([
    { groupCode: 'CURRENCY', groupName: '통화', groupDesc: '통화 공통코드', parentGroupCode: '' },
    { groupCode: 'WF_FORM_CYCLE', groupName: '기안양식 등록주기', groupDesc: '', parentGroupCode: '' },
]);
const tree = toGroupRows([
    { groupCode: 'ITEM_UNIT', groupName: '품목 단위', groupDesc: '', parentGroupCode: 'ITEM' },
    { groupCode: 'CURRENCY', groupName: '통화', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'ITEM', groupName: '품목', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'ITEM_UNIT_SUB', groupName: '세부 단위', groupDesc: '', parentGroupCode: 'ITEM_UNIT' },
    { groupCode: 'ORPHAN', groupName: '고아', groupDesc: '', parentGroupCode: 'GONE' },
]);
const shape = (rows: CommonCodeGroupTreeRow[]) => rows.map((row) => `${row.depth}:${row.groupCode}`);
const details = toDetailRows([
    { groupCode: 'WF_FORM_CYCLE', code: 'DAY', codeName: '일', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
    { groupCode: 'WF_FORM_CYCLE', code: 'WEEK', codeName: '주', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
]);

// COMBO_ITEM 의 상위그룹은 COMBO. COMBO 상세 중 OK 만 사용 중
const comboGroups = toGroupRows([
    { groupCode: 'COMBO', groupName: '콤보', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'COMBO_ITEM', groupName: '콤보 하위', groupDesc: '', parentGroupCode: 'COMBO' },
]);
const comboDetails = toDetailRows([
    { groupCode: 'COMBO', code: 'OK', codeName: '적합', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
    { groupCode: 'COMBO', code: 'OLD', codeName: '폐기', parentCodeName: '', useAt: false, sortOrder: 20, codeDesc: '' },
    { groupCode: 'COMBO_ITEM', code: 'A', codeName: '에이', parentCode: 'OK', parentCodeName: '적합', useAt: true, sortOrder: 10, codeDesc: '' },
    // 상위코드 없이 저장돼 있던 기존 행
    { groupCode: 'COMBO_ITEM', code: 'LEGACY', codeName: '옛값', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
]);
const newComboItem = (parentCode: string) => ({
    ...createEmptyDetailRow('COMBO_ITEM', comboDetails),
    code: 'B',
    codeName: '비',
    parentCode,
});

describe('commonCodeRows', () => {
    it('조회 데이터를 saved 행으로 변환한다', () => {
        expect(groups[0]).toMatchObject({ id: 'CURRENCY', parentId: '', rowState: 'saved' });
        expect(details[0]).toMatchObject({ id: 'WF_FORM_CYCLE:DAY', groupId: 'WF_FORM_CYCLE', parentCode: '', rowState: 'saved' });
    });

    it('부모 아래에 자식을 depth와 함께 평탄화하고, 부모를 못 찾으면 최상위로 둔다', () => {
        const rows = toGroupTreeRows(tree, new Set(), '');
        expect(shape(rows)).toEqual(['0:CURRENCY', '0:ITEM', '1:ITEM_UNIT', '2:ITEM_UNIT_SUB', '0:ORPHAN']);
        expect(rows.find((row) => row.groupCode === 'ITEM')?.hasChildren).toBe(true);
        expect(rows.find((row) => row.groupCode === 'CURRENCY')?.hasChildren).toBe(false);
    });

    it('접힌 그룹의 자손은 숨긴다', () => {
        expect(shape(toGroupTreeRows(tree, new Set(['ITEM']), ''))).toEqual(['0:CURRENCY', '0:ITEM', '0:ORPHAN']);
    });

    it('검색 시 일치 행과 그 조상만 남기고 접힘은 무시한다', () => {
        expect(shape(toGroupTreeRows(tree, new Set(['ITEM']), '세부'))).toEqual([
            '0:ITEM',
            '1:ITEM_UNIT',
            '2:ITEM_UNIT_SUB',
        ]);
        expect(shape(toGroupTreeRows(tree, new Set(), 'currency'))).toEqual(['0:CURRENCY']);
        expect(toGroupTreeRows(tree, new Set(), '  ')).toHaveLength(5);
    });

    it('자기 자신과 모든 하위 그룹 id를 모은다', () => {
        expect([...collectDescendantIds(tree, 'ITEM')].sort()).toEqual(['ITEM', 'ITEM_UNIT', 'ITEM_UNIT_SUB']);
        expect([...collectDescendantIds(tree, 'CURRENCY')]).toEqual(['CURRENCY']);
    });

    it('신규 상세의 정렬순서는 같은 그룹 최대값 + 10', () => {
        expect(createEmptyDetailRow('WF_FORM_CYCLE', details)).toMatchObject({
            groupId: 'WF_FORM_CYCLE',
            useAt: true,
            sortOrder: 30,
            rowState: 'new',
        });
        expect(createEmptyDetailRow('CURRENCY', details).sortOrder).toBe(10);
    });

    it('편집 여부에 따라 rowState를 정한다', () => {
        const saved = groups[0];
        expect(markEdited({ ...saved }, saved, ['groupName'])).toBe(saved);
        expect(markEdited({ ...saved, groupName: '화폐' }, saved, ['groupName']).rowState).toBe('modified');
        const fresh = createEmptyGroupRow();
        expect(markEdited({ ...fresh, groupName: 'A' }, fresh, ['groupName']).rowState).toBe('new');
    });

    it('그룹 필수값/중복을 검증한다', () => {
        expect(validateGroupRows(groups)).toBeNull();
        expect(validateGroupRows([createEmptyGroupRow(), ...groups])).toBe('신규 그룹: 그룹코드를 입력하세요.');
        expect(validateGroupRows([{ ...groups[0], groupName: ' ' }, groups[1]])).toBe('CURRENCY: 그룹명을 입력하세요.');
        expect(
            validateGroupRows([...groups, { ...createEmptyGroupRow(), groupCode: 'CURRENCY', groupName: 'X' }]),
        ).toBe('CURRENCY: 그룹코드가 중복됩니다.');
    });

    it('상세 필수값/중복과 미저장 그룹을 검증한다', () => {
        expect(validateDetailRows(groups, details)).toBeNull();
        expect(
            validateDetailRows(groups, [...details, createEmptyDetailRow('WF_FORM_CYCLE', details)]),
        ).toBe('WF_FORM_CYCLE: 상세코드를 입력하세요.');
        expect(
            validateDetailRows(groups, [...details, { ...createEmptyDetailRow('WF_FORM_CYCLE', details), code: 'DAY', codeName: '일2' }]),
        ).toBe('WF_FORM_CYCLE: 상세코드가 중복됩니다.');
        const fresh = { ...createEmptyGroupRow(), groupCode: 'NEW_G', groupName: '신규' };
        expect(
            validateDetailRows([...groups, fresh], [{ ...createEmptyDetailRow(fresh.id, []), code: 'A', codeName: '에이' }]),
        ).toBe('NEW_G: 그룹을 먼저 저장하세요.');
    });

    it('상위코드 선택지는 상위그룹의 사용 중이고 저장된 상세만, 상위그룹이 없으면 null', () => {
        const unsavedParent = { ...createEmptyDetailRow('COMBO', comboDetails), code: 'NEW', codeName: '신규' };
        expect(getParentCodeOptions(comboGroups, [...comboDetails, unsavedParent], 'COMBO_ITEM')).toEqual([
            { value: 'OK', label: '적합' },
        ]);
        expect(getParentCodeOptions(comboGroups, comboDetails, 'COMBO')).toBeNull();
        expect(getParentCodeOptions(comboGroups, comboDetails, null)).toBeNull();
    });

    it('상위그룹에 사용 중인 저장된 상세가 없으면 상위코드 선택지는 null 이고 상위코드 없이 저장된다', () => {
        // 상위그룹 COMBO 의 상세(OK, OLD)를 모두 뺀 상태 = 묶음용 상위그룹
        const emptyParentDetails = comboDetails.filter((detail) => detail.groupId !== 'COMBO');
        expect(getParentCodeOptions(comboGroups, emptyParentDetails, 'COMBO_ITEM')).toBeNull();
        expect(validateDetailRows(comboGroups, [...emptyParentDetails, newComboItem('')])).toBeNull();
    });

    it('상위그룹이 있는 그룹의 변경된 상세는 사용 중인 상위코드가 필수', () => {
        expect(validateDetailRows(comboGroups, comboDetails)).toBeNull();
        expect(validateDetailRows(comboGroups, [...comboDetails, newComboItem('')])).toBe(
            'COMBO_ITEM: 상위코드를 선택하세요.',
        );
        expect(validateDetailRows(comboGroups, [...comboDetails, newComboItem('OLD')])).toBe(
            'COMBO_ITEM: 사용 중인 상위코드가 아닙니다.',
        );
        expect(validateDetailRows(comboGroups, [...comboDetails, newComboItem('OK')])).toBeNull();
    });

    it('그룹 payload는 trim 하고 rowState를 뺀다', () => {
        const fresh = { ...createEmptyGroupRow(), groupCode: ' NEW_G ', groupName: ' 신규 ' };
        expect(toGroupPayload([fresh])).toEqual([
            { groupCode: 'NEW_G', groupName: '신규', groupDesc: '', parentGroupCode: '' },
        ]);
    });

    it('그룹 payload의 상위그룹은 부모 행의 현재 그룹코드로 보낸다', () => {
        const parent = { ...createEmptyGroupRow(), groupCode: ' NEW_P ', groupName: '부모' };
        const child = { ...createEmptyGroupRow(parent.id), groupCode: 'NEW_C', groupName: '자식' };
        expect(toGroupPayload([parent, child]).map((group) => group.parentGroupCode)).toEqual(['', 'NEW_P']);
    });

    it('상세 payload는 변경된 행만, groupId를 그룹코드로 바꾼다', () => {
        const added = { ...createEmptyDetailRow('WF_FORM_CYCLE', details), code: ' A ', codeName: '에이' };
        expect(toDetailPayload(groups, [...details, added])).toEqual([
            { groupCode: 'WF_FORM_CYCLE', code: 'A', codeName: '에이', parentCode: '', parentCodeName: '', useAt: true, sortOrder: added.sortOrder, codeDesc: '' },
        ]);
    });

    it('상세 payload에 상위코드를 담는다', () => {
        expect(toDetailPayload(comboGroups, [...comboDetails, newComboItem('OK')])).toMatchObject([
            { groupCode: 'COMBO_ITEM', code: 'B', parentCode: 'OK' },
        ]);
    });
});