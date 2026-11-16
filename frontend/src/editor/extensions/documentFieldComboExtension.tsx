import { Node, mergeAttributes } from '@tiptap/core';
import { toStyleText } from '../utils/documentFieldAttendees';
import {
    COMBO_PLACEHOLDER_TEXT,
    COMBO_STYLE,
    normalizeComboAttrs,
} from '../utils/documentFieldCombo';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentFieldComboNodeView } from '../components/DocumentFieldComboNodeView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        documentFieldCombo: {
            insertDocumentFieldCombo: () => ReturnType;
        };
    }
}

// data-* 속성 하나를 attr 하나로 매핑 (빈 값이면 속성 생략)
function dataAttribute(attrName: 'groupCode' | 'value' | 'valueName', htmlName: string) {
    return {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute(htmlName) ?? '',
        renderHTML: (attributes: Record<string, unknown>) => {
            const value = normalizeComboAttrs(attributes)[attrName];
            return value ? { [htmlName]: value } : {};
        },
    };
}

// 공통코드 EDITOR_COMBO 하위 그룹 선택지로 값을 고르는 인라인 문서필드
export const DocumentFieldComboExtension = Node.create({
    name: 'documentFieldCombo',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            groupCode: dataAttribute('groupCode', 'data-group-code'),
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
                            attrs: { groupCode: '', value: '', valueName: '' },
                        }),
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(DocumentFieldComboNodeView);
    },
});