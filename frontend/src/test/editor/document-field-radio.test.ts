import { getSchema } from '@tiptap/core';
import { DOMParser, DOMSerializer, Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { DocumentFieldRadioExtension } from '../../editor/extensions/documentFieldRadioExtension';
import {
    formatRadioText,
    normalizeRadioAttrs,
    parseRadioOptions,
    RADIO_PLACEHOLDER_TEXT,
    serializeRadioOptions,
} from '../../editor/utils/documentFieldRadio';

const yesNo = serializeRadioOptions([
    { code: 'Y', name: '예' },
    { code: 'N', name: '아니오' },
]);

const schema = getSchema([StarterKit, DocumentFieldRadioExtension]);

function radioNode(attrs: Record<string, string>) {
    return { type: 'documentFieldRadio', attrs };
}

function toHtml(nodes: ReturnType<typeof radioNode>[]): string {
    const doc = PMNode.fromJSON(schema, {
        type: 'doc',
        content: [{ type: 'paragraph', content: nodes }],
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

const empty = { radioCode: '', radioName: '', value: '', valueName: '', options: '' };
const selected = { radioCode: 'YES_NO', radioName: '예아니오', value: 'Y', valueName: '예', options: yesNo };

describe('normalizeRadioAttrs', () => {
    it('문자열이 아닌 값은 빈 문자열로 바꾸고 공백을 제거한다', () => {
        expect(
            normalizeRadioAttrs({ radioCode: ' YES_NO ', radioName: '예아니오', value: 'Y', valueName: null, options: 1 }),
        ).toEqual({ radioCode: 'YES_NO', radioName: '예아니오', value: 'Y', valueName: '', options: '' });
        expect(normalizeRadioAttrs(undefined)).toEqual({
            radioCode: '',
            radioName: '',
            value: '',
            valueName: '',
            options: '',
        });
    });
});

describe('parseRadioOptions', () => {
    it('직렬화한 선택지를 그대로 복원한다', () => {
        expect(parseRadioOptions(yesNo)).toEqual([
            { code: 'Y', name: '예' },
            { code: 'N', name: '아니오' },
        ]);
    });

    it('빈 문자열, 깨진 JSON, 배열이 아닌 값은 빈 배열', () => {
        expect(parseRadioOptions('')).toEqual([]);
        expect(parseRadioOptions('{broken')).toEqual([]);
        expect(parseRadioOptions('{"code":"Y"}')).toEqual([]);
    });

    it('code, name 이 문자열이 아닌 항목은 버린다', () => {
        expect(parseRadioOptions('[{"code":"Y","name":"예"},{"code":1},null]')).toEqual([
            { code: 'Y', name: '예' },
        ]);
    });
});

describe('formatRadioText', () => {
    it('종류가 없으면 플레이스홀더', () => {
        expect(formatRadioText({})).toBe(RADIO_PLACEHOLDER_TEXT);
    });

    it('선택된 값은 ◉, 나머지는 ○ 로 표시한다', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', value: 'N', options: yesNo })).toBe('○ 예 ◉ 아니오');
    });

    it('아무것도 안 골랐으면 모두 ○', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', value: '', options: yesNo })).toBe('○ 예 ○ 아니오');
    });

    it('스냅샷이 비어 있으면 종류명을 보여준다', () => {
        expect(formatRadioText({ radioCode: 'YES_NO', radioName: '예아니오', options: '' })).toBe('예아니오');
    });
});

describe('DocumentFieldRadioExtension HTML', () => {
    it('종류가 없으면 플레이스홀더 문구를 렌더한다', () => {
        const html = toHtml([radioNode(empty)]);
        expect(html).toContain('data-document-field-radio');
        expect(html).toContain(RADIO_PLACEHOLDER_TEXT);
    });

    it('선택 상태를 텍스트로, 코드는 data 속성으로 렌더한다', () => {
        const html = toHtml([radioNode(selected)]);
        expect(html).toContain('data-radio-code="YES_NO"');
        expect(html).toContain('data-radio-name="예아니오"');
        expect(html).toContain('data-value="Y"');
        expect(html).toContain('data-value-name="예"');
        expect(html).toContain('data-options=');
        expect(html).toContain('◉ 예 ○ 아니오</span>');
    });

    it('HTML 을 다시 파싱하면 attrs 5개가 복원된다', () => {
        const json = fromHtml(toHtml([radioNode(selected)]));
        expect(json.content?.[0].content?.[0]).toEqual(radioNode(selected));
    });

    it('한 문서의 라디오 3개는 값이 서로 섞이지 않는다', () => {
        const nodes = [
            radioNode({ ...selected, value: 'Y', valueName: '예' }),
            radioNode({ ...selected, value: 'N', valueName: '아니오' }),
            radioNode({ ...selected, value: '', valueName: '' }),
        ];
        const json = fromHtml(toHtml(nodes));
        const values = json.content?.[0].content?.map((node: { attrs?: { value?: string } }) => node.attrs?.value);
        expect(values).toEqual(['Y', 'N', '']);
    });
});