import { describe, expect, it } from 'vitest';
import { resolveDocumentFieldValues } from '../editor/utils/documentFieldValues';

describe('resolveDocumentFieldValues', () => {
  it('uses the current user and date for read-only document fields', () => {
    const values = resolveDocumentFieldValues({
      now: new Date('2026-07-10T09:15:00.000Z'),
      user: {
        displayName: '홍길동',
        department: '품질관리팀',
        userId: 'user-1',
      },
    });

    expect(values.createdAt).toBe('2026-07-10');
    expect(values.author).toBe('홍길동');
    expect(values.department).toBe('품질관리팀');
  });
});
