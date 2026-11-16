import { describe, expect, it } from 'vitest';
import type {
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../services/basicinfo/commonCodeService';
import { getComboItemOptions, normalizeComboAttrs } from '../../editor/utils/documentFieldCombo';

const groups: CommonCodeGroupItem[] = [
    { groupCode: 'EDITOR_COMBO', groupName: '에디터 콤보박스', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'EDITOR_COMBO_ITEM', groupName: '에디터 콤보 하위목록', groupDesc: '', parentGroupCode: 'EDITOR_COMBO' },
    { groupCode: 'ITEM_UNIT', groupName: '품목 단위', groupDesc: '', parentGroupCode: 'ITEM' },
];

function detail(
    groupCode: string,
    code: string,
    codeName: string,
    parentCode: string,
    useAt: boolean,
    sortOrder: number,
): CommonCodeDetailItem {
    return { groupCode, code, codeName, parentCode, parentCodeName: '', useAt, sortOrder, codeDesc: '' };
}

const details: CommonCodeDetailItem[] = [
    detail('EDITOR_COMBO', 'OK_NG', '적합부적합', '', true, 10),
    detail('EDITOR_COMBO', 'USE_YN', '사용미사용', '', true, 20),
    detail('EDITOR_COMBO_ITEM', 'NG', '부적합', 'OK_NG', true, 20),
    detail('EDITOR_COMBO_ITEM', 'OK', '적합', 'OK_NG', true, 10),
    detail('EDITOR_COMBO_ITEM', 'HOLD', '보류', 'OK_NG', false, 30),
    detail('EDITOR_COMBO_ITEM', 'USE', '사용', 'USE_YN', true, 10),
    // 같은 상위코드 값이어도 EDITOR_COMBO 하위 그룹이 아니면 제외
    detail('ITEM_UNIT', 'KG', 'kg', 'OK_NG', true, 10),
];

describe('normalizeComboAttrs', () => {
    it('문자열이 아닌 값은 빈 문자열로 바꾸고 공백을 제거한다', () => {
        expect(
            normalizeComboAttrs({ comboCode: ' OK_NG ', comboName: '적합부적합', value: 'OK', valueName: null }),
        ).toEqual({ comboCode: 'OK_NG', comboName: '적합부적합', value: 'OK', valueName: '' });
        expect(normalizeComboAttrs(undefined)).toEqual({
            comboCode: '',
            comboName: '',
            value: '',
            valueName: '',
        });
    });
});

describe('getComboItemOptions', () => {
    it('EDITOR_COMBO 하위 그룹 상세 중 상위코드가 같고 사용중인 것만 정렬순서대로 돌려준다', () => {
        expect(getComboItemOptions(groups, details, 'OK_NG')).toEqual([
            { code: 'OK', name: '적합' },
            { code: 'NG', name: '부적합' },
        ]);
        expect(getComboItemOptions(groups, details, 'USE_YN')).toEqual([{ code: 'USE', name: '사용' }]);
    });

    it('종류가 비어 있으면 빈 배열', () => {
        expect(getComboItemOptions(groups, details, '')).toEqual([]);
    });
});