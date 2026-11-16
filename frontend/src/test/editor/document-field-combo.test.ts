import { describe, expect, it } from 'vitest';
import { getComboGroups, normalizeComboAttrs } from '../../editor/utils/documentFieldCombo';

describe('normalizeComboAttrs', () => {
    it('문자열이 아닌 값은 빈 문자열로 바꾸고 공백을 제거한다', () => {
        expect(normalizeComboAttrs({ groupCode: ' COMBO_OX ', value: 'O', valueName: null })).toEqual({
            groupCode: 'COMBO_OX',
            value: 'O',
            valueName: '',
        });
        expect(normalizeComboAttrs(undefined)).toEqual({ groupCode: '', value: '', valueName: '' });
    });
});

describe('getComboGroups', () => {
    it('EDITOR_COMBO 를 상위그룹으로 가진 그룹만 돌려준다', () => {
        const groups = [
            { groupCode: 'EDITOR_COMBO', groupName: '에디터 콤보', groupDesc: '', parentGroupCode: '' },
            { groupCode: 'COMBO_OX', groupName: 'O/X', groupDesc: '', parentGroupCode: 'EDITOR_COMBO' },
            { groupCode: 'ITEM_UNIT', groupName: '품목 단위', groupDesc: '', parentGroupCode: 'ITEM' },
        ];
        expect(getComboGroups(groups)).toEqual([{ code: 'COMBO_OX', name: 'O/X' }]);
    });
});