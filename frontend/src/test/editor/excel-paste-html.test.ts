import { getSchema } from '@tiptap/core';
import { DOMParser as PMDOMParser } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { describe, expect, it } from 'vitest';
import { convertExcelCheckboxImages } from '../../editor/utils/excelPasteHtml';

const EXCEL_HEAD =
    '<html xmlns:x="urn:schemas-microsoft-com:office:excel">' +
    '<head><meta name=ProgId content=Excel.Sheet></head><body>';

function excelHtml(cells: string): string {
    return `${EXCEL_HEAD}<table><tr>${cells}</tr></table></body></html>`;
}

function checkboxImg(alt: string): string {
    return (
        '<span style="position:absolute;z-index:1;margin-left:81px;margin-top:26px;width:33px;height:27px;">' +
        `<img width=33 height=27 src="file:///C:/Users/USER/AppData/Local/Temp/clip.png" alt="${alt}" class=shape>` +
        '</span>'
    );
}

// 실제 엑셀 클립보드에서 체크박스가 들어 있던 셀 구조 (2026-10-19 수집)
const REAL_EXCEL_CHECKBOX_CELL =
    '<td colspan=3 rowspan=4 height=88 width=216 style="height:66.0pt;width:162pt;" align=left valign=top>' +
    checkboxImg('확인란 13') +
    '<span style="">' +
    '<table cellpadding=0 cellspacing=0><tr>' +
    '<td colspan=3 rowspan=4 height=88 class=xl70 width=216 style="height:66.0pt;width:162pt;"></td>' +
    '</tr></table>' +
    '</span></td>';

function convertAndParse(html: string): Document {
    return new DOMParser().parseFromString(
        convertExcelCheckboxImages(html),
        'text/html',
    );
}

describe('convertExcelCheckboxImages', () => {
    it('실제 엑셀 체크박스 셀을 taskItem 1개로 바꾸고 이미지를 제거한다', () => {
        const doc = convertAndParse(excelHtml(REAL_EXCEL_CHECKBOX_CELL));

        expect(doc.querySelectorAll('img')).toHaveLength(0);
        const items = doc.querySelectorAll(
            'td > ul[data-type="taskList"] > li[data-type="taskItem"]',
        );
        expect(items).toHaveLength(1);
        expect(items[0].getAttribute('data-checked')).toBe('false');
        expect(items[0].querySelector('p')).not.toBeNull();
    });

    it('엑셀이 넣은 빈 중첩 table을 제거한다', () => {
        const doc = convertAndParse(excelHtml(REAL_EXCEL_CHECKBOX_CELL));

        expect(doc.querySelectorAll('table')).toHaveLength(1);
    });

    it('셀의 colspan, rowspan을 유지한다', () => {
        const doc = convertAndParse(excelHtml(REAL_EXCEL_CHECKBOX_CELL));
        const cell = doc.querySelector('td')!;

        expect(cell.getAttribute('colspan')).toBe('3');
        expect(cell.getAttribute('rowspan')).toBe('4');
    });

    it('한 셀에 체크박스가 2개면 taskItem 2개를 만든다', () => {
        const doc = convertAndParse(
            excelHtml(`<td>${checkboxImg('확인란 1')}${checkboxImg('확인란 2')}</td>`),
        );

        expect(doc.querySelectorAll('li[data-type="taskItem"]')).toHaveLength(2);
        expect(doc.querySelectorAll('ul[data-type="taskList"]')).toHaveLength(1);
    });

    it('영문 엑셀 alt("Check Box 1")도 변환한다', () => {
        const doc = convertAndParse(excelHtml(`<td>${checkboxImg('Check Box 1')}</td>`));

        expect(doc.querySelectorAll('li[data-type="taskItem"]')).toHaveLength(1);
        expect(doc.querySelectorAll('img')).toHaveLength(0);
    });

    it('중첩 table 안의 텍스트는 taskList 뒤에 문단으로 남긴다', () => {
        const doc = convertAndParse(
            excelHtml(
                `<td>${checkboxImg('확인란 1')}<span><table><tr><td>확인함</td></tr></table></span></td>`,
            ),
        );
        const cell = doc.querySelector('td')!;

        expect(cell.children[0].tagName).toBe('UL');
        expect(cell.children[1].tagName).toBe('P');
        expect(cell.children[1].textContent).toBe('확인함');
    });

    it('엑셀 HTML이라도 체크박스가 아닌 그림은 그대로 둔다', () => {
        const doc = convertAndParse(excelHtml(`<td>${checkboxImg('그림 1')}</td>`));

        expect(doc.querySelectorAll('img')).toHaveLength(1);
        expect(doc.querySelectorAll('ul[data-type="taskList"]')).toHaveLength(0);
    });

    it('엑셀이 아닌 HTML은 원문 그대로 반환한다', () => {
        const html = `<table><tr><td>${checkboxImg('확인란 1')}</td></tr></table>`;

        expect(convertExcelCheckboxImages(html)).toBe(html);
    });

    it('변환 결과를 에디터 스키마로 파싱하면 표 셀 안에 taskItem이 생긴다', () => {
        const schema = getSchema([
            StarterKit,
            Table,
            TableRow,
            TableCell,
            TableHeader,
            TaskList,
            TaskItem.configure({ nested: false }),
        ]);
        const doc = convertAndParse(excelHtml(REAL_EXCEL_CHECKBOX_CELL));
        const pmDoc = PMDOMParser.fromSchema(schema).parse(doc.body);

        const found: string[] = [];
        pmDoc.descendants((node, _pos, parent) => {
            if (node.type.name === 'taskItem') {
                found.push(parent?.type.name ?? '');
            }
        });
        expect(found).toEqual(['taskList']);
        expect(pmDoc.toJSON().content[0].type).toBe('table');
        expect(JSON.stringify(pmDoc.toJSON())).not.toContain('"image"');
    });
});