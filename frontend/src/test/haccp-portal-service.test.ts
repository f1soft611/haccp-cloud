import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { listHaccpPortalDocuments } from '../services/documents/haccpPortalService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(apiClient.get).mockReset();
});

describe('haccpPortalService', () => {
  it('normalizes envelope response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        result: {
          resultList: [
            {
              drafting_work_category_id: 101,
              category_name: 'HACCP(HA)',
              code_name: 'CCP-1B 검증기록',
              reg_term: '일',
              assignee_summary: '관리자 외 2명',
            },
          ],
        },
      },
    });

    const result = await listHaccpPortalDocuments({ tenantCode: 'TENANT-A' });

    expect(result).toEqual([
      {
        id: '101',
        categoryName: 'HACCP(HA)',
        divisionName: 'CCP-1B 검증기록',
        cycle: '일',
        assigneeSummary: '관리자 외 2명',
      },
    ]);
  });
});
