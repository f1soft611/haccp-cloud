import { getSchema } from '@tiptap/core';
import { DOMParser, DOMSerializer, Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { DocumentFieldComboExtension } from '../../editor/extensions/documentFieldComboExtension';
import {
    COMBO_PLACEHOLDER_TEXT,
    getComboGroups,
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

describe('DocumentFieldComboExtension HTML', () => {
    it('값이 없으면 플레이스홀더 문구를 렌더한다', () => {
        const html = toHtml({ groupCode: '', value: '', valueName: '' });
        expect(html).toContain('data-document-field-combo');
        expect(html).toContain(COMBO_PLACEHOLDER_TEXT);
    });

    it('선택된 값은 코드명을 텍스트로, 코드는 data 속성으로 렌더한다', () => {
        const html = toHtml({ groupCode: 'COMBO_OK_NG', value: 'OK', valueName: '적합' });
        expect(html).toContain('data-group-code="COMBO_OK_NG"');
        expect(html).toContain('data-value="OK"');
        expect(html).toContain('data-value-name="적합"');
        expect(html).toContain('>적합</span>');
    });

    it('HTML 을 다시 파싱하면 attrs 가 복원된다', () => {
        const attrs = { groupCode: 'COMBO_OK_NG', value: 'OK', valueName: '적합' };
        const json = fromHtml(toHtml(attrs));
        expect(json.content?.[0].content?.[0]).toEqual({ type: 'documentFieldCombo', attrs });
    });
});