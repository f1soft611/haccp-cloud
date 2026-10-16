import { getSchema } from '@tiptap/core';
import { DOMParser, DOMSerializer, Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { DocumentFieldAttendeesExtension } from '../../editor/extensions/documentFieldAttendeesExtension';
import { normalizeAttendees } from '../../editor/utils/documentFieldAttendees';

const schema = getSchema([StarterKit, DocumentFieldAttendeesExtension]);

function toHtml(attendees: unknown): string {
    const doc = PMNode.fromJSON(schema, {
        type: 'doc',
        content: [{ type: 'documentFieldAttendees', attrs: { attendees } }],
    });
    const container = document.createElement('div');
    container.appendChild(
        DOMSerializer.fromSchema(schema).serializeFragment(doc.content),
    );
    return container.innerHTML;
}

function fromHtml(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return DOMParser.fromSchema(schema).parse(container).toJSON();
}

describe('normalizeAttendees', () => {
    it('keeps valid attendees and drops entries without userId', () => {
        expect(
            normalizeAttendees([
                { userId: 'u1', name: '홍길동', signatureImage: 'data:image/png;base64,AA' },
                { userId: '', name: '무효' },
                { userId: 'u2', name: '  ' },
            ]),
        ).toEqual([
            { userId: 'u1', name: '홍길동', signatureImage: 'data:image/png;base64,AA' },
            { userId: 'u2', name: 'u2' },
        ]);
    });

    it('parses a JSON string and falls back to [] on bad input', () => {
        expect(normalizeAttendees('[{"userId":"u1","name":"김철수"}]')).toEqual([
            { userId: 'u1', name: '김철수' },
        ]);
        expect(normalizeAttendees('not json')).toEqual([]);
        expect(normalizeAttendees(null)).toEqual([]);
    });
});

describe('DocumentFieldAttendeesExtension HTML', () => {
    it('renders a placeholder when no attendees are selected', () => {
        const html = toHtml([]);

        expect(html).toContain('data-document-field-attendees');
        expect(html).toContain('클릭하여 참석자를 선택하세요.');
    });

    it('renders one wrapping card per attendee with signature image', () => {
        const html = toHtml([
            { userId: 'u1', name: '홍길동', signatureImage: 'data:image/png;base64,AA' },
            { userId: 'u2', name: '김철수' },
        ]);

        expect(html).toContain('flex-wrap: wrap');
        expect(html).toContain('홍길동');
        expect(html).toContain('김철수');
        expect(html).toContain('src="data:image/png;base64,AA"');
        expect(html.match(/<img/g)).toHaveLength(1);
    });

    it('round-trips attendees through HTML', () => {
        const attendees = [
            { userId: 'u1', name: '홍길동', signatureImage: 'data:image/png;base64,AA' },
            { userId: 'u2', name: '김철수' },
        ];

        const json = fromHtml(toHtml(attendees));

        expect(json.content?.[0]).toEqual({
            type: 'documentFieldAttendees',
            attrs: { attendees },
        });
    });
});