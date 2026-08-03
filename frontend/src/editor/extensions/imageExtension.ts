import { mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  createElement,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';

function resolveAlignStyle(align: string): string {
  if (align === 'left') {
    return 'display:block;margin:0.75rem 0.75rem 0.75rem 0;';
  }

  if (align === 'right') {
    return 'display:block;margin:0.75rem 0 0.75rem auto;';
  }

  return 'display:block;margin:0.75rem auto;';
}

export function normalizeImageWidth(width: unknown): string {
  const value = String(width ?? '100%').trim();
  if (!value) {
    return '100%';
  }

  if (!value.endsWith('%')) {
    return '100%';
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return '100%';
  }

  return `${Math.min(100, Math.max(20, Math.round(parsed)))}%`;
}

export function resolveImageWidthFromDelta(
  currentWidth: unknown,
  deltaPx: number,
  containerWidthPx: number,
): string {
  const normalized = normalizeImageWidth(currentWidth);
  const currentPercent = Number.parseFloat(normalized) || 100;
  const safeContainerWidth = Math.max(120, containerWidthPx);
  const currentWidthPx = (currentPercent / 100) * safeContainerWidth;
  const nextPercent = Math.round(
    ((currentWidthPx + deltaPx) / safeContainerWidth) * 100,
  );
  const clamped = Math.min(100, Math.max(20, nextPercent));
  return `${clamped}%`;
}

function ImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props;
  const width = normalizeImageWidth(node.attrs.width);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startWidth: string;
    horizontalDirection: 1 | -1;
  } | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || !imageRef.current || !wrapperRef.current) {
        return;
      }

      const containerWidth = Math.max(
        120,
        wrapperRef.current.parentElement?.clientWidth ??
          imageRef.current.clientWidth,
      );
      const deltaPx =
        (event.clientX - dragState.startX) * dragState.horizontalDirection;
      const nextWidth = resolveImageWidthFromDelta(
        dragState.startWidth,
        deltaPx,
        containerWidth,
      );
      updateAttributes({ width: nextWidth });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [updateAttributes]);

  const handleResizeStart = (
    event: ReactPointerEvent<HTMLDivElement>,
    horizontalDirection: 1 | -1,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: width,
      horizontalDirection,
    };
    document.body.style.cursor = 'ew-resize';
  };

  const handles: Array<{
    key: string;
    cursor: string;
    style: Record<string, string | number>;
    horizontalDirection: 1 | -1;
  }> = [
    {
      key: 'nw',
      cursor: 'nwse-resize',
      horizontalDirection: -1,
      style: { left: '-6px', top: '-6px' },
    },
    {
      key: 'ne',
      cursor: 'nesw-resize',
      horizontalDirection: 1,
      style: { right: '-6px', top: '-6px' },
    },
    {
      key: 'sw',
      cursor: 'nesw-resize',
      horizontalDirection: -1,
      style: { left: '-6px', bottom: '-6px' },
    },
    {
      key: 'se',
      cursor: 'nwse-resize',
      horizontalDirection: 1,
      style: { right: '-6px', bottom: '-6px' },
    },
  ];

  return createElement(
    NodeViewWrapper,
    {
      as: 'div',
      className: `image-node-view ${selected ? 'is-selected' : ''}`,
      contentEditable: false,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        margin: '0.75rem 0',
      },
    },
    createElement(
      'div',
      {
        ref: wrapperRef,
        style: {
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        },
      },
      createElement(
        'div',
        {
          style: {
            position: 'relative',
            width,
            maxWidth: '100%',
            borderRadius: '8px',
            border: selected ? '2px solid #2563eb' : '2px solid transparent',
            boxSizing: 'border-box',
          },
        },
        createElement('img', {
          ref: imageRef,
          src: node.attrs.src,
          alt: node.attrs.alt ?? '이미지',
          style: {
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '6px',
            margin: '0 auto',
          },
        }),
        selected
          ? handles.map((handle) =>
              createElement('div', {
                key: handle.key,
                onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) =>
                  handleResizeStart(event, handle.horizontalDirection),
                style: {
                  position: 'absolute',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  border: '1px solid #2563eb',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  cursor: handle.cursor,
                  ...handle.style,
                },
              }),
            )
          : null,
      ),
    ),
  );
}

export const EditorImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') ?? '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const width = String(HTMLAttributes.width ?? '100%');
    const align = String(HTMLAttributes.align ?? 'center');
    const inlineStyle = `${resolveAlignStyle(align)}width:${width};max-width:100%;height:auto;`;

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: inlineStyle,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
