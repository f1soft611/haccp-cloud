import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import { listHaccpBaseWorks } from '../services/documents/haccpBaseWorkService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(apiClient.get).mockReset();
});

describe('haccpBaseWorkService', () => {
  it('normalizes snake_case work id for work division options', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        result: {
          resultList: [
            {
              drafting_work_category_id: 101,
              code_name: 'CCP-1B 검증기록',
              cata_name: 'HACCP(HA)',
              use_at: 'Y',
            },
          ],
        },
      },
    });

    const result = await listHaccpBaseWorks({
      tenantCode: 'TENANT-A',
      active: 'Y',
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '101',
          divisionName: 'CCP-1B 검증기록',
        }),
      ]),
    );
  });
});
