import { mergeAttributes } from '@tiptap/core';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

type CellBorderStyle = 'solid' | 'dashed' | 'double' | 'none';

type CellStyleAttributes = {
  backgroundColor?: string | null;
  verticalAlign?: 'top' | 'middle' | 'bottom' | null;
  textColor?: string | null;
  borderColor?: string | null;
  borderWidth?: string | null;
  borderStyle?: CellBorderStyle | null;
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
};

export const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...styleAttributes,
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = composeCellStyle(node.attrs as CellStyleAttributes);

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
    const style = composeCellStyle(node.attrs as CellStyleAttributes);

    return [
      'th',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        ...(style ? { style } : {}),
      }),
      0,
    ];
  },
});
