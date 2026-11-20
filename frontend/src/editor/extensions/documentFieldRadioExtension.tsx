import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentFieldRadioNodeView } from '../components/DocumentFieldRadioNodeView';
import { toStyleText } from '../utils/documentFieldAttendees';
import { COMBO_STYLE } from '../utils/documentFieldCombo';
import {
    formatRadioText,
    normalizeRadioAttrs,
    type DocumentFieldRadioAttrs,
} from '../utils/documentFieldRadio';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        documentFieldRadio: {
            insertDocumentFieldRadio: () => ReturnType;
        };
    }
}

// attr 하나를 data-* 속성 하나로 매핑 (빈 값이면 속성 생략)
function dataAttribute(attrName: keyof DocumentFieldRadioAttrs, htmlName: string) {
    return {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute(htmlName) ?? '',
        renderHTML: (attributes: Record<string, unknown>) => {
            const value = normalizeRadioAttrs(attributes)[attrName];
            return value ? { [htmlName]: value } : {};
        },
    };
}

// 공통코드 EDITOR_RADIO 종류를 고른 뒤 그 하위 코드 중 하나를 라디오로 고르는 인라인 문서필드
// 묶음 하나가 노드 하나라서 한 문서에 여러 개를 넣어도 값이 서로 독립된다
export const DocumentFieldRadioExtension = Node.create({
    name: 'documentFieldRadio',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            radioCode: dataAttribute('radioCode', 'data-radio-code'),
            radioName: dataAttribute('radioName', 'data-radio-name'),
            value: dataAttribute('value', 'data-value'),
            valueName: dataAttribute('valueName', 'data-value-name'),
            options: dataAttribute('options', 'data-options'),
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-document-field-radio]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-document-field-radio': '',
                style: toStyleText(COMBO_STYLE),
            }),
            formatRadioText(node.attrs),
        ];
    },

    addCommands() {
        return {
            insertDocumentFieldRadio:
                () =>
                    ({ commands }) =>
                        commands.insertContent({
                            type: this.name,
                            attrs: { radioCode: '', radioName: '', value: '', valueName: '', options: '' },
                        }),
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(DocumentFieldRadioNodeView);
    },
});