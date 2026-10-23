import { describe, expect, it } from 'vitest';
import { normalizeClipboardHtmlForEditor } from '../../../editor/utils/clipboardPaste';

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
});