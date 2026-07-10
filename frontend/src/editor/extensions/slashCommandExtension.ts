import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import {
  SlashCommandList,
  type SlashCommandItem,
  type SlashCommandListHandle,
} from '../components/SlashCommandList';

type SlashCommandKey =
  | 'heading1'
  | 'heading2'
  | 'table'
  | 'image'
  | 'code'
  | 'divider'
  | 'quote'
  | 'todo';

type SlashCommandOption = {
  key: SlashCommandKey;
  title: string;
  description: string;
  searchTerms: string[];
};

const SLASH_OPTIONS: SlashCommandOption[] = [
  {
    key: 'heading1',
    title: '제목 1',
    description: '큰 제목을 추가합니다.',
    searchTerms: ['heading', 'h1', 'title'],
  },
  {
    key: 'heading2',
    title: '제목 2',
    description: '중간 제목을 추가합니다.',
    searchTerms: ['heading', 'h2'],
  },
  {
    key: 'table',
    title: '표',
    description: '4x4 기본 표를 삽입합니다.',
    searchTerms: ['table', 'grid'],
  },
  // {
  //   key: 'image',
  //   title: '이미지 자리표시자',
  //   description: '이미지 블록 확장 전 임시 영역을 넣습니다.',
  //   searchTerms: ['image', 'img', 'photo'],
  // },
  {
    key: 'code',
    title: '코드 블록',
    description: '코드 블록을 삽입합니다.',
    searchTerms: ['code', 'snippet'],
  },
  {
    key: 'divider',
    title: '구분선',
    description: '수평선을 추가합니다.',
    searchTerms: ['divider', 'hr', 'line'],
  },
  // {
  //   key: 'quote',
  //   title: '인용문',
  //   description: '인용문 블록을 추가합니다.',
  //   searchTerms: ['quote', 'blockquote'],
  // },
  {
    key: 'todo',
    title: '할 일 목록',
    description: '체크 가능한 Todo 리스트를 추가합니다.',
    searchTerms: ['todo', 'task', 'checklist'],
  },
];

function runSlashCommand(editor: Editor, range: Range, key: SlashCommandKey) {
  if (key === 'heading1') {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 1 })
      .run();
    return;
  }

  if (key === 'heading2') {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setNode('heading', { level: 2 })
      .run();
    return;
  }

  if (key === 'table') {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertTable({ rows: 3, cols: 4, withHeaderRow: false })
      .run();
    return;
  }

  if (key === 'image') {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: 'blockquote',
          content: [
            { type: 'text', text: '이미지 업로드 블록 (다음 단계에서 구현)' },
          ],
        },
        { type: 'paragraph' },
      ])
      .run();
    return;
  }

  if (key === 'code') {
    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    return;
  }

  if (key === 'divider') {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    return;
  }

  if (key === 'quote') {
    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    return;
  }

  editor.chain().focus().deleteRange(range).toggleTaskList().run();
}

function toSlashItem(option: SlashCommandOption): SlashCommandItem {
  return {
    title: option.title,
    description: option.description,
    searchTerms: option.searchTerms,
    command: () => {
      // Suggestion command callback에서 실제 실행한다.
    },
  };
}

export const SlashCommandExtension = Extension.create({
  name: 'slash-command',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: true,
        items: ({ query }) => {
          const normalized = query.toLowerCase().trim();

          return SLASH_OPTIONS.filter((option) => {
            if (!normalized) {
              return true;
            }

            return (
              option.title.toLowerCase().includes(normalized) ||
              option.description.toLowerCase().includes(normalized) ||
              option.searchTerms.some((term) => term.includes(normalized))
            );
          })
            .slice(0, 8)
            .map(toSlashItem);
        },
        command: ({ editor, range, props }) => {
          const matchedOption = SLASH_OPTIONS.find(
            (option) => option.title === props.title,
          );

          if (!matchedOption) {
            return;
          }

          runSlashCommand(editor, range, matchedOption.key);
        },
        render: () => {
          let reactRenderer: ReactRenderer<SlashCommandListHandle> | null =
            null;
          let popup: TippyInstance | null = null;

          return {
            onStart: (props: SuggestionProps<SlashCommandItem>) => {
              reactRenderer = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: (item: SlashCommandItem) => props.command(item),
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              const instance = tippy(document.body, {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: reactRenderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });

              popup = instance;
            },

            onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
              reactRenderer?.updateProps({
                items: props.items,
                command: (item: SlashCommandItem) => props.command(item),
              });

              popup?.setProps({
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(),
              });
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                popup?.hide();
                return true;
              }

              return (
                reactRenderer?.ref?.onKeyDown(props.event as KeyboardEvent) ??
                false
              );
            },

            onExit: () => {
              popup?.destroy();
              reactRenderer?.destroy();
            },
          };
        },
      }),
    ];
  },
});
