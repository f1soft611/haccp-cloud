import { Node, mergeAttributes } from '@tiptap/core';
import {
    ATTENDEES_PLACEHOLDER_TEXT,
    ATTENDEES_STYLES,
    normalizeAttendees,
    toStyleText,
} from '../utils/documentFieldAttendees';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        documentFieldAttendees: {
            insertDocumentFieldAttendees: () => ReturnType;
        };
    }
}

export const DocumentFieldAttendeesExtension = Node.create({
    name: 'documentFieldAttendees',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            attendees: {
                default: [],
                // ponytail: 서명 data URL이 data-attendees와 <img src>에 두 번 들어간다. 문서 크기가 문제되면 data-attendees에서 signatureImage를 빼고 img에서 읽도록 변경
                parseHTML: (element: HTMLElement) =>
                    normalizeAttendees(element.getAttribute('data-attendees')),
                renderHTML: (attributes: Record<string, unknown>) => ({
                    'data-attendees': JSON.stringify(
                        normalizeAttendees(attributes.attendees),
                    ),
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-document-field-attendees]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const attendees = normalizeAttendees(node.attrs.attendees);
        const attrs = mergeAttributes(HTMLAttributes, {
            'data-document-field-attendees': '',
        });

        if (attendees.length === 0) {
            return [
                'div',
                { ...attrs, style: toStyleText(ATTENDEES_STYLES.placeholder) },
                ATTENDEES_PLACEHOLDER_TEXT,
            ];
        }

        return [
            'div',
            { ...attrs, style: toStyleText(ATTENDEES_STYLES.list) },
            ...attendees.map((attendee) => [
                'div',
                { style: toStyleText(ATTENDEES_STYLES.card) },
                ['div', { style: toStyleText(ATTENDEES_STYLES.name) }, attendee.name],
                [
                    'div',
                    { style: toStyleText(ATTENDEES_STYLES.sign) },
                    ...(attendee.signatureImage
                        ? [
                            [
                                'img',
                                {
                                    src: attendee.signatureImage,
                                    alt: `${attendee.name} 서명`,
                                    style: toStyleText(ATTENDEES_STYLES.image),
                                },
                            ],
                        ]
                        : []),
                ],
            ]),
        ];
    },

    addCommands() {
        return {
            insertDocumentFieldAttendees:
                () =>
                    ({ chain }) =>
                        chain()
                        .insertContent([
                            { type: this.name, attrs: { attendees: [] } },
                            { type: 'paragraph' },
                        ])
                        .run(),
        };
    },
});