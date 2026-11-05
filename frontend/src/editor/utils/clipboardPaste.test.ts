import { createNodeFromContent, getSchema } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it } from 'vitest';
import { normalizeClipboardHtmlForEditor } from './clipboardPaste';

function firstCell(html: string): HTMLTableCellElement {
    const cell = new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector('td');
    if (!cell) {
        throw new Error(`td 없음: ${html}`);
    }
    return cell;
}

const EXCEL_HEAD =
    '<head><meta name=ProgId content=Excel.Sheet>' +
    '<style>.xl65{font-size:11pt;color:red;font-family:"맑은 고딕";}</style></head>';

describe('normalizeClipboardHtmlForEditor', () => {
    it('엑셀 <style> 클래스 서식을 셀 style 로 옮긴다', () => {
        const html = `<html>${EXCEL_HEAD}<body><table><tr><td class=xl65>값</td></tr></table></body></html>`;

        const cell = firstCell(normalizeClipboardHtmlForEditor(html));

        expect(cell.style.fontSize).toBe('11pt');
        expect(cell.style.color).toBe('red');
        expect(cell.style.fontFamily).toContain('맑은 고딕');
        expect(cell.textContent).toBe('값');
    });

    it('엑셀 체크박스를 taskList 로 바꾸고 셀 텍스트와 클래스 서식을 유지한다', () => {
        const html =
            `<html>${EXCEL_HEAD}<body><table><tr><td class=xl65>` +
            '<span><img class=shape src="file:///C:/x.png" alt="확인란 1"></span>' +
            '<table><tr><td>적합</td></tr></table>' +
            '</td></tr></table></body></html>';

        const result = normalizeClipboardHtmlForEditor(html, '적합');

        expect(result).toContain(
            '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
        );
        expect(result).toContain('<p>적합</p>');
        expect(firstCell(result).style.fontSize).toBe('11pt');
    });

    it('한글 <font> 태그를 span 서식으로 바꾼다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<p><font face="함초롬바탕" size="4" color="#0000ff">한글</font></p>',
        );

        expect(result).toContain('font-family:함초롬바탕');
        expect(result).toContain('color:#0000ff');
        expect(result).toContain('font-size:14pt');
    });

    it('문단 정렬과 밑줄을 유지하고 문단 글자색은 span 으로 내린다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<p style="text-align:center;color:red"><u>밑줄</u></p>',
        );

        expect(result).toContain('<p style="text-align:center">');
        expect(result).toContain('<span style="color:red"><u>밑줄</u></span>');
    });

    it('script 와 on* 속성을 제거한다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<p onclick="alert(1)">안녕<script>alert(1)</script></p>',
        );

        expect(result).toBe('<p>안녕</p>');
    });

    it('표 앞뒤 문단을 순서대로 유지한다 (한글 제목 + 표 + 비고)', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<p style="text-align:center"><font size="5">제목</font></p>' +
            '<table><tr><td>내용</td></tr></table>' +
            '<p>비고</p>',
        );

        expect(result).toMatch(/제목[\s\S]*<table>[\s\S]*내용[\s\S]*<\/table>[\s\S]*비고/);
        expect(result).toContain('<p style="text-align:center">');
        expect(result).toContain('font-size:18pt');
        expect(result).not.toContain('clipboard-table');
    });

    it('셀 padding 을 유지한다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<table><tr><td style="padding:1.4pt 5.1pt 1.4pt 5.1pt">x</td></tr></table>',
        );

        expect(cells(result)[0].getAttribute('style')).toContain(
            'padding:1.4pt 5.1pt',
        );
    });
});

function cells(html: string): HTMLTableCellElement[] {
    return Array.from(
        new DOMParser().parseFromString(html, 'text/html').querySelectorAll('td'),
    );
}

const colwidths = (html: string) =>
    cells(html).map((cell) => cell.getAttribute('colwidth'));

const td = (width: string, attributes = '') =>
    `<td ${attributes} style="width:${width}">x</td>`;

describe('normalizeClipboardHtmlForEditor 표 크기', () => {
    it('colgroup 이 없으면 셀 너비로 colwidth 를 만들고 셀 style 에는 width 를 남기지 않는다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('100px')}${td('200px')}${td('300px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['100', '200', '300']);
        expect(cells(result)[0].style.width).toBe('');
    });

    it('첫 행이 병합되어도 아래 행 너비로 열 너비를 만든다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('600px', 'colspan="3"')}</tr>` +
            `<tr>${td('100px')}${td('200px')}${td('300px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['100,200,300', '100', '200', '300']);
    });

    it('rowspan 으로 밀린 셀을 실제 열에 맞춘다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('100px', 'rowspan="2"')}${td('500px', 'colspan="2"')}</tr>` +
            `<tr>${td('200px')}${td('300px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['100', '200,300', '200', '300']);
    });

    it('병합 셀로만 알 수 있는 열은 병합 셀 너비에서 빼서 채운다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('300px', 'colspan="2"')}${td('300px')}</tr>` +
            `<tr>${td('100px')}<td>x</td>${td('300px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['100,200', '300', '100', '200', '300']);
    });

    it('pt 단위 셀 너비를 px 로 바꾼다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('75pt')}${td('150pt')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['100', '200']);
    });

    it('% 너비만 있으면 colwidth 없이 셀 style 을 유지한다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('50%')}${td('50%')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual([null, null]);
        expect(cells(result)[0].style.width).toBe('50%');
    });

    it('너비를 알 수 없는 열이 남으면 colwidth 를 만들지 않는다', () => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${td('100px')}<td>x</td></tr></table>`,
        );

        expect(colwidths(result)).toEqual([null, null]);
        expect(cells(result)[0].style.width).toBe('100px');
    });

    it('colgroup 너비가 셀 너비보다 우선한다 (엑셀)', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<table><colgroup><col width="80"><col width="120"></colgroup>' +
            `<tr>${td('999px')}${td('999px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['80', '120']);
    });

    it('colgroup 에 비어 있는 열은 셀 너비로 채운다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<table><colgroup><col width="80"><col></colgroup>' +
            `<tr>${td('999px')}${td('120px')}</tr></table>`,
        );

        expect(colwidths(result)).toEqual(['80', '120']);
    });
});

const pasteSchema = getSchema([
    StarterKit,
    Table,
    TableRow,
    TableCell,
    TableHeader,
]);

// insertContent 와 같은 방식으로 파싱하고 검사한다 (잘못된 셀이면 RangeError)
function checkAsInsertContent(html: string): void {
    createNodeFromContent(html, pasteSchema, {
        slice: true,
        parseOptions: { preserveWhitespace: 'full' },
    }).forEach((node) => node.check());
}

describe('normalizeClipboardHtmlForEditor 빈 셀', () => {
    it.each([
        ['첫 셀', '<td>&nbsp;</td><td>b</td>', '\tb\r\n'],
        ['마지막 셀', '<td>a</td><td>&nbsp;</td>', 'a\t\r\n'],
    ])('%s 이 비어도 에디터에 넣을 수 있다 (엑셀 표시값 경로)', (_, row, text) => {
        const result = normalizeClipboardHtmlForEditor(
            `<table><tr>${row}</tr></table>`,
            text,
        );

        expect(result).toContain('<td><p></p></td>');
        expect(() => checkAsInsertContent(result)).not.toThrow();
    });

    it('표시값 없이 빈 태그로 와도 에디터에 넣을 수 있다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<table><tr><td>a</td><td></td></tr></table>',
        );

        expect(() => checkAsInsertContent(result)).not.toThrow();
    });

    it('내용이 있는 셀은 그대로 둔다', () => {
        const result = normalizeClipboardHtmlForEditor(
            '<table><tr><td>a</td></tr></table>',
        );

        expect(result).toBe('<table><tbody><tr><td>a</td></tr></tbody></table>');
    });
});

describe('normalizeClipboardHtmlForEditor 인라인 서식 우선', () => {
    const excelTable = (rule: string, cell: string) =>
        `<html><head><style>${rule}</style></head><body><table><tr>${cell}</tr></table></body></html>`;

    it('병합 셀의 인라인 테두리가 클래스의 none 에 지워지지 않는다', () => {
        const html = excelTable(
            '.xl80{border-top:.5pt solid windowtext;border-right:none;border-bottom:none;border-left:.5pt solid windowtext}',
            '<td class=xl80 style="border-right:.5pt solid black;border-bottom:.5pt solid black">값</td>',
        );

        const style = firstCell(normalizeClipboardHtmlForEditor(html)).getAttribute('style');

        expect(style).toContain('border-right:0.5pt solid black');
        expect(style).toContain('border-bottom:0.5pt solid black');
        expect(style).toContain('border-top:0.5pt solid windowtext');
    });

    it('인라인 border-left:none 이 클래스 테두리를 끈다', () => {
        const html = excelTable(
            '.xl81{border-top:.5pt solid windowtext;border-right:.5pt solid windowtext;border-bottom:.5pt solid windowtext;border-left:.5pt solid windowtext}',
            '<td class=xl81 style="border-left:none">값</td>',
        );

        const style = firstCell(normalizeClipboardHtmlForEditor(html)).getAttribute('style');

        expect(style).not.toMatch(/border-left:[^;]*solid/);
        expect(style).toContain('border-right:0.5pt solid windowtext');
    });

    it('글자 서식도 인라인이 클래스보다 우선한다', () => {
        const html = excelTable(
            '.xl65{color:red;font-size:11pt}',
            '<td class=xl65 style="color:blue">값</td>',
        );

        const cell = firstCell(normalizeClipboardHtmlForEditor(html));

        expect(cell.style.color).toBe('blue');
        expect(cell.style.fontSize).toBe('11pt');
    });
});