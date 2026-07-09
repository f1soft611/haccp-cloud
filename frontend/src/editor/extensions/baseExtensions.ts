import type { Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { EditorImageExtension } from './imageExtension';
import { EditorCodeBlockExtension } from './codeBlockExtension';

export function createBaseExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      codeBlock: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['http', 'https', 'mailto'],
    }),
    TextStyle,
    Color,
    Table.configure({
      resizable: true,
      allowTableNodeSelection: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    EditorCodeBlockExtension,
    EditorImageExtension,
  ];
}
