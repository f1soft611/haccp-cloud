import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';

const lowlight = createLowlight();

lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('json', json);
lowlight.register('html', xml);
lowlight.register('css', css);
lowlight.register('sql', sql);
lowlight.register('bash', bash);

export const SUPPORTED_CODE_LANGUAGES = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
] as const;

export const EditorCodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: 'plaintext',
});
