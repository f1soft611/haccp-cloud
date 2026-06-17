import { describe, expect, it } from 'vitest';
import { listDocuments } from '../services/common/documentsService';

describe('documentsService', () => {
  it('provides enough tenant sample documents for dashboard panels', async () => {
    const documents = await listDocuments('TENANT-A');

    expect(documents.length).toBeGreaterThanOrEqual(12);
    expect(
      documents.every((document) => document.tenantCode === 'TENANT-A'),
    ).toBe(true);
  });
});
