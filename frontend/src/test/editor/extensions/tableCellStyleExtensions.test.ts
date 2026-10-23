import { describe, expect, it } from 'vitest';
import { generateHTML, generateJSON, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import {
    StyledTableCell,
    StyledTableHeader,
} from '../../../editor/extensions/tableCellStyleExtensions';

const extensions = [
    StarterKit,
    Table,
    TableRow,
    StyledTableHeader,
    StyledTableCell,
];

function parseFirstCell(html: string): JSONContent {
    const json = generateJSON(html, extensions);
    return json.content[0].content[0].content[0];
}

describe('StyledTableCell pastedStyle', () => {
    it('붙여넣은 셀 style 에서 기존 속성이 읽는 값은 빼고 나머지를 보관한다', () => {
        const cell = parseFirstCell(
            '<table><tbody><tr><td style="border-top:1px solid black;font-size:11pt;background-color:yellow;text-align:center">a</td></tr></tbody></table>',
        );

        expect(cell.attrs?.pastedStyle).toBe('border-top:1px solid black;font-size:11pt');
        expect(cell.attrs?.backgroundColor).toBe('yellow');
    });

    it('에디터가 그린 셀(data-cell-*)의 style 은 원본으로 보지 않는다', () => {
        const cell = parseFirstCell(
            '<table><tbody><tr><td data-cell-border-color="#000" style="border-color:#000">a</td></tr></tbody></table>',
        );

        expect(cell.attrs?.pastedStyle).toBeNull();
    });

    it('렌더링 시 data-pasted-style 을 남기고 툴바 서식을 뒤에 붙인다', () => {
        const json = generateJSON(
            '<table><tbody><tr><td style="font-size:11pt;background-color:yellow">a</td></tr></tbody></table>',
            extensions,
        );

        const html = generateHTML(json, extensions);
        const cell = new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector('td');

        expect(cell?.getAttribute('data-pasted-style')).toBe('font-size:11pt');
        expect(cell?.style.fontSize).toBe('11pt');
        expect(cell?.style.backgroundColor).toBe('yellow');
        // 원본 서식이 앞, 툴바 서식이 뒤
        expect(cell?.getAttribute('style')).toMatch(/font-size[\s\S]*background-color/);
    });

    it('data-pasted-style 이 있으면 그 값을 다시 읽는다 (에디터 내부 복사)', () => {
        const cell = parseFirstCell(
            '<table><tbody><tr><td data-pasted-style="font-size:11pt" data-cell-background="yellow" style="font-size:11pt;background-color:yellow">a</td></tr></tbody></table>',
        );

        expect(cell.attrs?.pastedStyle).toBe('font-size:11pt');
    });
});