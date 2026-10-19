// 엑셀 클립보드 HTML 판별 (ProgId 메타 또는 excel 네임스페이스)
const EXCEL_HTML_PATTERN =
    /content=["']?Excel\.Sheet|urn:schemas-microsoft-com:office:excel/i;

// 엑셀 양식 컨트롤 체크박스 개체 이름 (한글/영문). JS의 \b는 한글 경계를 못 잡아서 공백/숫자/끝으로 판별
const CHECKBOX_ALT_PATTERN = /^(확인란|Check Box)(\s|\d|$)/i;

function findOutermostCell(element: Element): HTMLTableCellElement | null {
    let cell = element.closest<HTMLTableCellElement>('td, th');
    let parentCell = cell?.parentElement?.closest<HTMLTableCellElement>('td, th');

    while (parentCell) {
        cell = parentCell;
        parentCell = cell.parentElement?.closest<HTMLTableCellElement>('td, th');
    }

    return cell;
}

function createTaskList(doc: Document, count: number): HTMLUListElement {
    const list = doc.createElement('ul');
    list.setAttribute('data-type', 'taskList');

    for (let index = 0; index < count; index += 1) {
        const item = doc.createElement('li');
        item.setAttribute('data-type', 'taskItem');
        // 엑셀 클립보드 HTML에는 체크 상태가 없어서 항상 미체크로 넣는다
        item.setAttribute('data-checked', 'false');
        item.append(doc.createElement('p'));
        list.append(item);
    }

    return list;
}

/**
 * 엑셀에서 복사한 HTML의 양식 컨트롤 체크박스 이미지(<img class=shape alt="확인란 N">)를
 * 에디터 체크박스(taskList/taskItem)로 바꾼다. 엑셀 HTML이 아니면 원문을 그대로 반환한다.
 */
export function convertExcelCheckboxImages(html: string): string {
    if (!EXCEL_HTML_PATTERN.test(html)) {
        return html;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const checkboxCounts = new Map<HTMLTableCellElement, number>();

    doc.querySelectorAll<HTMLImageElement>('img.shape').forEach((image) => {
        if (!CHECKBOX_ALT_PATTERN.test(image.alt.trim())) {
            return;
        }

        const cell = findOutermostCell(image);
        if (!cell) {
            return;
        }

        checkboxCounts.set(cell, (checkboxCounts.get(cell) ?? 0) + 1);
    });

    if (checkboxCounts.size === 0) {
        return html;
    }

    checkboxCounts.forEach((count, cell) => {
        // 셀 안 텍스트(중첩 table 포함)는 살리고, 이미지·도형 배치용 래퍼는 버린다
        const text = cell.textContent?.trim() ?? '';
        cell.replaceChildren(createTaskList(doc, count));

        if (text) {
            const paragraph = doc.createElement('p');
            paragraph.textContent = text;
            cell.append(paragraph);
        }
    });

    return doc.body.innerHTML;
}