import { useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { arrayMove } from '@dnd-kit/sortable';

type EditorBlockItem = {
  id: string;
  type: string;
  label: string;
  height: number;
};

type UseEditorBlockDnDResult = {
  blocks: EditorBlockItem[];
  reorderBlocks: (activeId: string, overId: string) => void;
};

function getBlockLabel(block: JSONContent): string {
  if (block.type === 'heading') {
    const level = Number(block.attrs?.level ?? 1);
    return `H${level}`;
  }

  if (block.type === 'paragraph') {
    return '문단';
  }

  if (block.type === 'table') {
    return '표';
  }

  if (block.type === 'blockquote') {
    return '인용';
  }

  if (block.type === 'codeBlock') {
    return '코드';
  }

  if (block.type === 'orderedList') {
    return '번호 목록';
  }

  if (block.type === 'bulletList') {
    return '글머리 목록';
  }

  if (block.type === 'horizontalRule') {
    return '구분선';
  }

  if (block.type === 'taskList') {
    return '할 일';
  }

  return block.type ?? '블록';
}

function toBlockItems(editor: Editor): EditorBlockItem[] {
  const doc = editor.getJSON();

  if (!doc?.content || doc.content.length === 0) {
    return [];
  }

  const domBlocks = Array.from(editor.view.dom.children) as HTMLElement[];

  return doc.content.map((block, index) => {
    const blockId =
      typeof block.attrs?.blockId === 'string' && block.attrs.blockId.trim()
        ? block.attrs.blockId.trim()
        : `${block.type ?? 'block'}-${index}`;

    return {
      id: blockId,
      type: block.type ?? 'unknown',
      label: getBlockLabel(block),
      height: Math.max(domBlocks[index]?.offsetHeight ?? 28, 28),
    };
  });
}

export function useEditorBlockDnD(
  editor: Editor | null,
): UseEditorBlockDnDResult {
  const [blocks, setBlocks] = useState<EditorBlockItem[]>([]);

  useEffect(() => {
    if (!editor) {
      setBlocks([]);
      return;
    }

    const syncBlocks = () => {
      setBlocks(toBlockItems(editor));
    };

    syncBlocks();
    editor.on('update', syncBlocks);
    editor.on('selectionUpdate', syncBlocks);
    window.addEventListener('resize', syncBlocks);

    return () => {
      editor.off('update', syncBlocks);
      editor.off('selectionUpdate', syncBlocks);
      window.removeEventListener('resize', syncBlocks);
    };
  }, [editor]);

  const blockIds = useMemo(() => blocks.map((block) => block.id), [blocks]);

  const reorderBlocks = (activeId: string, overId: string) => {
    if (!editor) {
      return;
    }

    if (activeId === overId) {
      return;
    }

    const oldIndex = blockIds.indexOf(activeId);
    const newIndex = blockIds.indexOf(overId);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const currentDoc = editor.getJSON();
    const currentContent = currentDoc.content ?? [];

    if (currentContent.length <= 1) {
      return;
    }

    const nextContent = arrayMove(currentContent, oldIndex, newIndex);

    editor.commands.setContent({
      ...currentDoc,
      content: nextContent,
    });
  };

  return {
    blocks,
    reorderBlocks,
  };
}
