import { getSchema } from '@tiptap/core';
import { DOMParser, DOMSerializer, Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import type {
    CommonCodeDetailItem,
    CommonCodeGroupItem,
} from '../../services/basicinfo/commonCodeService';
import { DocumentFieldComboExtension } from '../../editor/extensions/documentFieldComboExtension';
import {
    COMBO_PLACEHOLDER_TEXT,
    getEditorItemOptions,
    normalizeComboAttrs,
} from '../../editor/utils/documentFieldCombo';

const schema = getSchema([StarterKit, DocumentFieldComboExtension]);

function toHtml(attrs: Record<string, string>): string {
    const doc = PMNode.fromJSON(schema, {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'documentFieldCombo', attrs }] }],
    });
    const container = document.createElement('div');
    container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
    return container.innerHTML;
}

function fromHtml(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(container).toJSON();
}

const groups: CommonCodeGroupItem[] = [
    { groupCode: 'EDITOR_COMBO', groupName: '에디터 콤보박스', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'EDITOR_COMBO_ITEM', groupName: '에디터 콤보 하위목록', groupDesc: '', parentGroupCode: 'EDITOR_COMBO' },
    { groupCode: 'ITEM_UNIT', groupName: '품목 단위', groupDesc: '', parentGroupCode: 'ITEM' },
    { groupCode: 'EDITOR_RADIO', groupName: '에디터 라디오버튼', groupDesc: '', parentGroupCode: '' },
    { groupCode: 'EDITOR_RADIO_ITEM', groupName: '에디터 라디오 하위목록', groupDesc: '', parentGroupCode: 'EDITOR_RADIO' },
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

    // 라디오 하위 그룹에 같은 종류 코드(OK_NG)가 있어도 콤보 조회에는 섞이지 않아야 한다
    detail('EDITOR_RADIO', 'OK_NG', '적합부적합', '', true, 10),
    detail('EDITOR_RADIO_ITEM', 'R_OK', '적합(라디오)', 'OK_NG', true, 10),
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

describe('getEditorItemOptions', () => {
    it('상위그룹 하위 그룹 상세 중 상위코드가 같고 사용중인 것만 정렬순서대로 돌려준다', () => {
        expect(getEditorItemOptions(groups, details, 'EDITOR_COMBO', 'OK_NG')).toEqual([
            { code: 'OK', name: '적합' },
            { code: 'NG', name: '부적합' },
        ]);
        expect(getEditorItemOptions(groups, details, 'EDITOR_COMBO', 'USE_YN')).toEqual([
            { code: 'USE', name: '사용' },
        ]);
    });

    it('다른 상위그룹 아래의 같은 종류 코드는 섞이지 않는다', () => {
        expect(getEditorItemOptions(groups, details, 'EDITOR_RADIO', 'OK_NG')).toEqual([
            { code: 'R_OK', name: '적합(라디오)' },
        ]);
    });

    it('종류가 비어 있으면 빈 배열', () => {
        expect(getEditorItemOptions(groups, details, 'EDITOR_COMBO', '')).toEqual([]);
    });
});

describe('DocumentFieldComboExtension HTML', () => {
    const selected = { comboCode: 'OK_NG', comboName: '적합부적합', value: 'OK', valueName: '적합' };

    it('값이 없으면 플레이스홀더 문구를 렌더한다', () => {
        const html = toHtml({ comboCode: '', comboName: '', value: '', valueName: '' });
        expect(html).toContain('data-document-field-combo');
        expect(html).toContain(COMBO_PLACEHOLDER_TEXT);
    });

    it('선택된 값은 코드명을 텍스트로, 코드는 data 속성으로 렌더한다', () => {
        const html = toHtml(selected);
        expect(html).toContain('data-combo-code="OK_NG"');
        expect(html).toContain('data-combo-name="적합부적합"');
        expect(html).toContain('data-value="OK"');
        expect(html).toContain('data-value-name="적합"');
        expect(html).toContain('적합</span>');
    });

    it('HTML 을 다시 파싱하면 attrs 가 복원된다', () => {
        const json = fromHtml(toHtml(selected));
        expect(json.content?.[0].content?.[0]).toEqual({ type: 'documentFieldCombo', attrs: selected });
    });
});