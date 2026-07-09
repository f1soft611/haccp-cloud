import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

type UseEditorImageUploadResult = {
  insertImagesFromFiles: (files: FileList | File[]) => Promise<void>;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('이미지 변환 실패'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

function normalizeImageFiles(files: FileList | File[]): File[] {
  return Array.from(files).filter((file) => file.type.startsWith('image/'));
}

export function useEditorImageUpload(
  editor: Editor | null,
): UseEditorImageUploadResult {
  const insertImagesFromFiles = async (files: FileList | File[]) => {
    if (!editor) {
      return;
    }

    const imageFiles = normalizeImageFiles(files);
    if (imageFiles.length === 0) {
      return;
    }

    for (const file of imageFiles) {
      try {
        const src = await readFileAsDataUrl(file);
        editor
          .chain()
          .focus()
          .setImage({
            src,
            alt: file.name,
          })
          .insertContent({ type: 'paragraph' })
          .run();
      } catch {
        // Ignore broken image files and continue.
      }
    }
  };

  useEffect(() => {
    if (!editor) {
      return;
    }

    const dom = editor.view.dom;

    const onDragOver = (event: Event) => {
      const dragEvent = event as DragEvent;
      const hasFiles = Boolean(dragEvent.dataTransfer?.files?.length);
      if (hasFiles) {
        dragEvent.preventDefault();
      }
    };

    const onDrop = (event: Event) => {
      const dragEvent = event as DragEvent;
      const files = dragEvent.dataTransfer?.files;

      if (!files || files.length === 0) {
        return;
      }

      dragEvent.preventDefault();
      void insertImagesFromFiles(files);
    };

    dom.addEventListener('dragover', onDragOver);
    dom.addEventListener('drop', onDrop);

    return () => {
      dom.removeEventListener('dragover', onDragOver);
      dom.removeEventListener('drop', onDrop);
    };
  }, [editor]);

  return {
    insertImagesFromFiles,
  };
}
