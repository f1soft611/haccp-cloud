import type { Node as PMNode } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import { TableMap } from '@tiptap/pm/tables';

// 표 우클릭 행추가: rowIndex 행 바로 아래에 같은 열 셀 내용을 복사한 행을 넣는다.
// 새 행 위치를 가로지르는 병합 셀과 맨 앞 열 병합 그룹(마지막 줄에서 추가한 경우)은 rowspan +1 로 새 행까지 덮는다.
export function addRowBelowWithCopy(
  tr: Transaction,
  tablePos: number,
  rowIndex: number,
): Transaction | null {
  const table = tr.doc.nodeAt(tablePos);
  if (!table || table.type.spec.tableRole !== 'table' || rowIndex < 0 || rowIndex >= table.childCount) {
    return null;
  }

  const map = TableMap.get(table);
  const tableStart = tablePos + 1;
  const insertRow = rowIndex + 1;
  const leadRect = map.findCell(map.map[rowIndex * map.width]);
  const extendLead = leadRect.top < rowIndex && leadRect.bottom === insertRow;

  const extendPositions = new Set<number>();
  const cells: PMNode[] = [];
  const seen = new Set<number>();

  for (let col = 0; col < map.width; col += 1) {
    const pos = map.map[rowIndex * map.width + col];
    if (seen.has(pos)) {
      continue;
    }
    seen.add(pos);

    const rect = map.findCell(pos);
    if (rect.bottom > insertRow || (col === 0 && extendLead)) {
      extendPositions.add(pos);
      continue;
    }

    const cell = table.nodeAt(pos)!;
    cells.push(cell.type.create({ ...cell.attrs, rowspan: 1 }, cell.content, cell.marks));
  }

  if (cells.length === 0) {
    return null;
  }

  extendPositions.forEach((pos) => {
    const cell = table.nodeAt(pos)!;
    tr.setNodeMarkup(tableStart + pos, null, { ...cell.attrs, rowspan: cell.attrs.rowspan + 1 });
  });

  let rowEnd = tableStart;
  for (let index = 0; index <= rowIndex; index += 1) {
    rowEnd += table.child(index).nodeSize;
  }

  return tr.insert(rowEnd, table.child(rowIndex).type.create(null, cells));
}