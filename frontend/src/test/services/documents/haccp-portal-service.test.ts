import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/apiClient';
import { listHaccpPortalDocuments } from '../../../services/documents/haccpPortalService';

vi.mock('../../../services/api/apiClient', () => ({
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
              reg_term: 'DAY',
              reg_term_nm: '일',
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
        cycle: 'DAY',
        cycleName: '일',
        assigneeSummary: '관리자 외 2명',
      },
    ]);
  });

  it('sends search conditions as query params and drops empty values', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    await listHaccpPortalDocuments({
      tenantCode: 'TENANT-A',
      categoryId: 'NONE',
      cycle: 'DAY',
      keyword: 'CCP',
    });
    await listHaccpPortalDocuments({ tenantCode: 'TENANT-A', keyword: '' });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/v1/docs/portal', {
      headers: { 'x-tenant-code': 'TENANT-A' },
      params: { categoryId: 'NONE', cycle: 'DAY', keyword: 'CCP' },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/v1/docs/portal', {
      headers: { 'x-tenant-code': 'TENANT-A' },
      params: { categoryId: undefined, cycle: undefined, keyword: undefined },
    });
  });
});
