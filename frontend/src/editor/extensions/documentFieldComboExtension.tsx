import { Node, mergeAttributes } from '@tiptap/core';
import { toStyleText } from '../utils/documentFieldAttendees';
import {
    COMBO_PLACEHOLDER_TEXT,
    COMBO_STYLE,
    normalizeComboAttrs,
    type DocumentFieldComboAttrs,
} from '../utils/documentFieldCombo';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        documentFieldCombo: {
            insertDocumentFieldCombo: () => ReturnType;
        };
    }
}

// attr 하나를 data-* 속성 하나로 매핑 (빈 값이면 속성 생략)
function dataAttribute(attrName: keyof DocumentFieldComboAttrs, htmlName: string) {
    return {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute(htmlName) ?? '',
        renderHTML: (attributes: Record<string, unknown>) => {
            const value = normalizeComboAttrs(attributes)[attrName];
            return value ? { [htmlName]: value } : {};
        },
    };
}

// 공통코드 EDITOR_COMBO 종류를 고른 뒤 그 하위 코드 중 하나를 값으로 고르는 인라인 문서필드
export const DocumentFieldComboExtension = Node.create({
    name: 'documentFieldCombo',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            comboCode: dataAttribute('comboCode', 'data-combo-code'),
            comboName: dataAttribute('comboName', 'data-combo-name'),
            value: dataAttribute('value', 'data-value'),
            valueName: dataAttribute('valueName', 'data-value-name'),
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-document-field-combo]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const { valueName } = normalizeComboAttrs(node.attrs);
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-document-field-combo': '',
                style: toStyleText(COMBO_STYLE),
            }),
            valueName || COMBO_PLACEHOLDER_TEXT,
        ];
    },

    addCommands() {
        return {
            insertDocumentFieldCombo:
                () =>
                    ({ commands }) =>
                        commands.insertContent({
                            type: this.name,
                            attrs: { comboCode: '', comboName: '', value: '', valueName: '' },
                        }),
        };
    },
});