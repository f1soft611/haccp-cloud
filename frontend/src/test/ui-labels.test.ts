import { describe, expect, it } from 'vitest';
import {
  getActiveLabel,
  getDocumentStatusLabel,
  type DocumentStatusCode,
} from '../shared/ui/labels';

describe('UI labels', () => {
  it('maps document status code to korean label', () => {
    expect(getDocumentStatusLabel('DRAFT')).toBe('임시저장');
    expect(getDocumentStatusLabel('ACTIVE')).toBe('사용중');
  });

  it('maps active boolean to korean label', () => {
    expect(getActiveLabel(true)).toBe('활성');
    expect(getActiveLabel(false)).toBe('비활성');
  });

  it('keeps type-safe document status mapping', () => {
    const status: DocumentStatusCode = 'DRAFT';
    expect(getDocumentStatusLabel(status)).toBe('임시저장');
  });
});
