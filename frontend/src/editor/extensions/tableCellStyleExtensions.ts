import { mergeAttributes } from '@tiptap/core';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

type CellBorderStyle = 'solid' | 'dashed' | 'double' | 'none';

// 기존 -> 툴바 서식 속성만 있음
// 변경 -> 붙여넣은 원본 서식(pastedStyle) 추가
type CellStyleAttributes = {
  backgroundColor?: string | null;
  verticalAlign?: 'top' | 'middle' | 'bottom' | null;
  textColor?: string | null;
  borderColor?: string | null;
  borderWidth?: string | null;
  borderStyle?: CellBorderStyle | null;
  pastedStyle?: string | null;
};

function composeCellStyle(attrs: CellStyleAttributes): string | undefined {
  const styles: string[] = [];

  if (attrs.backgroundColor) {
    styles.push(`background-color:${attrs.backgroundColor}`);
  }

  if (attrs.verticalAlign && attrs.verticalAlign !== 'top') {
    styles.push(`vertical-align:${attrs.verticalAlign}`);
  }

  if (attrs.textColor) {
    styles.push(`color:${attrs.textColor}`);
  }

  if (attrs.borderStyle === 'none') {
    styles.push('border:none');
    return styles.join(';');
  }

  if (attrs.borderColor) {
    styles.push(`border-color:${attrs.borderColor}`);
  }

  if (attrs.borderStyle) {
    styles.push(`border-style:${attrs.borderStyle}`);
  }

  if (attrs.borderWidth) {
    styles.push(`border-width:${attrs.borderWidth}`);
    if (!attrs.borderStyle) {
      styles.push('border-style:solid');
    }
  }

  if (styles.length === 0) {
    return undefined;
  }

  return styles.join(';');
}

// backgroundColor, textColor, verticalAlign, textAlign 이 같은 style 에서 읽어 가는 속성은 중복 보관하지 않는다
const PASTED_STYLE_EXCLUDED_PROPERTIES = new Set([
  'background',
  'background-color',
  'color',
  'vertical-align',
  'text-align',
]);

function filterPastedStyle(style: string | null): string | null {
  const declarations = (style ?? '')
  .split(';')
  .map((declaration) => declaration.trim())
  .filter((declaration) => {
    const property = declaration.split(':')[0].trim().toLowerCase();
    return (
        declaration.includes(':') &&
        !PASTED_STYLE_EXCLUDED_PROPERTIES.has(property)
    );
  });

  return declarations.length > 0 ? declarations.join(';') : null;
}

function isEditorRenderedCell(element: HTMLElement): boolean {
  return Array.from(element.attributes).some(
      (attribute) =>
          attribute.name.startsWith('data-cell-') ||
          attribute.name === 'data-text-color',
  );
}

// 원본 서식을 앞에, 툴바 서식을 뒤에 둬서 툴바 서식이 이기게 한다
function joinCellStyle(attrs: CellStyleAttributes): string | undefined {
  const styles = [attrs.pastedStyle, composeCellStyle(attrs)].filter(Boolean);
  return styles.length > 0 ? styles.join(';') : undefined;
}

const styleAttributes = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-cell-background') ||
      element.style.backgroundColor ||
      null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.backgroundColor;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-cell-background': value,
      };
    },
  },
  verticalAlign: {
    default: 'top',
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-cell-vertical-align') ||
      element.style.verticalAlign ||
      'top',
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.verticalAlign;
      if (!value || typeof value !== 'string' || value === 'top') {
        return {};
      }

      return {
        'data-cell-vertical-align': value,
      };
    },
  },
  textColor: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-text-color') || element.style.color || null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.textColor;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-text-color': value,
      };
    },
  },
  borderColor: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-cell-border-color') ||
      element.style.borderColor ||
      null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.borderColor;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-cell-border-color': value,
      };
    },
  },
  borderWidth: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.getAttribute('data-cell-border-width') ||
      element.style.borderWidth ||
      null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.borderWidth;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-cell-border-width': value,
      };
    },
  },
  borderStyle: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      (element.getAttribute(
        'data-cell-border-style',
      ) as CellBorderStyle | null) ||
      (element.style.borderStyle as CellBorderStyle | '') ||
      null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.borderStyle;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-cell-border-style': value,
      };
    },
  },
  pastedStyle: {
    default: null,
    parseHTML: (element: HTMLElement) => {
      if (element.hasAttribute('data-pasted-style')) {
        return filterPastedStyle(element.getAttribute('data-pasted-style'));
      }

      // 에디터가 그린 셀의 style 은 툴바 값이므로 원본으로 보관하지 않는다
      return isEditorRenderedCell(element)
          ? null
          : filterPastedStyle(element.getAttribute('style'));
    },
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes.pastedStyle;
      if (!value || typeof value !== 'string') {
        return {};
      }

      return {
        'data-pasted-style': value,
      };
    },
  },

};

export const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...styleAttributes,
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // 기존 -> const style = composeCellStyle(node.attrs as CellStyleAttributes);
    // 변경 -> 붙여넣은 원본 서식 뒤에 툴바 서식을 붙인다
    const style = joinCellStyle(node.attrs as CellStyleAttributes);

    return [
      'td',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        ...(style ? { style } : {}),
      }),
      0,
    ];
  },
});

export const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...styleAttributes,
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // 기존 -> const style = composeCellStyle(node.attrs as CellStyleAttributes);
    // 변경 -> 붙여넣은 원본 서식 뒤에 툴바 서식을 붙인다
    const style = joinCellStyle(node.attrs as CellStyleAttributes);

    return [
      'th',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        ...(style ? { style } : {}),
      }),
      0,
    ];
  },
});
