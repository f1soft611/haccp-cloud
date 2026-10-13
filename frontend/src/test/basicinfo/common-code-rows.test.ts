import { describe, expect, it } from 'vitest';
import {
    createEmptyDetailRow,
    createEmptyGroupRow,
    filterGroupRows,
    markEdited,
    toDetailRows,
    toGroupRows,
    validateGroupRows,
    validateDetailRows,
    toGroupPayload,
    toDetailPayload,
} from '../../pages/basicinfo/common-code/commonCodeRows';

const groups = toGroupRows([
    { groupCode: 'CURRENCY', groupName: '통화', groupDesc: '통화 공통코드' },
    { groupCode: 'WF_FORM_CYCLE', groupName: '기안양식 등록주기', groupDesc: '' },
]);
const details = toDetailRows([
    { groupCode: 'WF_FORM_CYCLE', code: 'DAY', codeName: '일', parentCodeName: '', useAt: true, sortOrder: 10, codeDesc: '' },
    { groupCode: 'WF_FORM_CYCLE', code: 'WEEK', codeName: '주', parentCodeName: '', useAt: true, sortOrder: 20, codeDesc: '' },
]);

describe('commonCodeRows', () => {
    it('조회 데이터를 saved 행으로 변환한다', () => {
        expect(groups[0]).toMatchObject({ id: 'CURRENCY', rowState: 'saved' });
        expect(details[0]).toMatchObject({ id: 'WF_FORM_CYCLE:DAY', groupId: 'WF_FORM_CYCLE', rowState: 'saved' });
    });

    it('그룹을 코드/명/설명으로 대소문자 무시 검색한다', () => {
        expect(filterGroupRows(groups, 'wf_form').map((g) => g.groupCode)).toEqual(['WF_FORM_CYCLE']);
        expect(filterGroupRows(groups, '통화 공통').map((g) => g.groupCode)).toEqual(['CURRENCY']);
        expect(filterGroupRows(groups, '  ')).toHaveLength(2);
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

    it('그룹 payload는 trim 하고 rowState를 뺀다', () => {
        const fresh = { ...createEmptyGroupRow(), groupCode: ' NEW_G ', groupName: ' 신규 ' };
        expect(toGroupPayload([fresh])).toEqual([{ groupCode: 'NEW_G', groupName: '신규', groupDesc: '' }]);
    });

    it('상세 payload는 변경된 행만, groupId를 그룹코드로 바꾼다', () => {
        const added = { ...createEmptyDetailRow('WF_FORM_CYCLE', details), code: ' A ', codeName: '에이' };
        expect(toDetailPayload(groups, [...details, added])).toEqual([
            { groupCode: 'WF_FORM_CYCLE', code: 'A', codeName: '에이', parentCodeName: '', useAt: true, sortOrder: added.sortOrder, codeDesc: '' },
        ]);
    });
});