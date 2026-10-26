import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../services/api/apiClient.ts';
import { listHaccpBaseWorks, listHaccpWorkTodoCycles } from '../../services/documents/haccpBaseWorkService.ts';

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

  it('converts cycle instance registeredDate to YYYY-MM-DD', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { workId: 1, cycleDate: '20261005', approvalId: 9, statusType: 'in_progress', registeredDate: '20261006' },
        { workId: 2, cycleDate: '20261005', approvalId: 10, statusType: 'approved', registeredDate: null },
      ],
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result.instances).toEqual([
      { workId: '1', cycleDate: '2026-10-05', approvalId: '9', statusType: 'in_progress', registeredDate: '2026-10-06', title: '' },
      { workId: '2', cycleDate: '2026-10-05', approvalId: '10', statusType: 'approved', registeredDate: '', title: '' },
    ]);
    expect(result.expirations).toEqual([]);
    expect(result.displayStartDate).toBe('');
  });

  it('reads displayStartDate from the result envelope as YYYY-MM-DD', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { result: { resultList: [], displayStartDate: '20260610' } },
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result).toEqual({ instances: [], displayStartDate: '2026-06-10', expirations: [] });
  });

  it('normalizes expirations from the result envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        result: {
          resultList: [],
          displayStartDate: '',
          expirations: [
            { workId: 7, approvalId: 900, expirationDate: '20261115', equipmentId: 12, materialType: null, certificationUserId: null, targetName: '설비A' },
            { workId: 8, approvalId: 901, expirationDate: '2026-11', equipmentId: null, materialType: 'MT01', certificationUserId: null, targetName: '' },
          ],
        },
      },
    });

    const result = await listHaccpWorkTodoCycles({
      tenantCode: 'TENANT-A',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });

    expect(result.expirations).toEqual([
      { workId: '7', approvalId: '900', expirationDate: '2026-11-15', equipmentId: '12', materialType: '', certificationUserId: '', targetName: '설비A' },
    ]);
  });

  it('defaults expirationApply to false and approvalApply to true when missing', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { id: 1 },
        { id: 2, expirationApply: true, approvalApply: false },
      ],
    });

    const result = await listHaccpBaseWorks({ tenantCode: 'TENANT-A' });

    expect(
        result.map(({ expirationApply, approvalApply }) => ({ expirationApply, approvalApply })),
    ).toEqual([
      { expirationApply: false, approvalApply: true },
      { expirationApply: true, approvalApply: false },
    ]);
  });
});
