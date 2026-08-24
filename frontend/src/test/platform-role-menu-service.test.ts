import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  getPlatformRoleMenuMapping,
  listRoleMenuCandidatesByTenant,
} from '../services/platform-admin/platformRoleMenuService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('platformRoleMenuService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes plan menu candidate codes for authority menu filtering', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          item: {
            menuCodes: ['menu_dashboard', ' MENU_AUTHORITY_MANAGEMENT '],
          },
        },
      },
    });

    await expect(listRoleMenuCandidatesByTenant('PLATFORM')).resolves.toEqual([
      'MENU_DASHBOARD',
      'MENU_AUTHORITY_MANAGEMENT',
    ]);
  });

  it('accepts menuCodes as the selected-role mapping payload alias', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        result: {
          item: {
            roleCode: ' tenant_admin ',
            menuCodes: [' menu_dashboard ', ' MENU_AUTHORITY_MANAGEMENT '],
          },
        },
      },
    });

    await expect(
      getPlatformRoleMenuMapping('tenant_admin', 'PLATFORM'),
    ).resolves.toEqual({
      roleCode: 'TENANT_ADMIN',
      menuIds: ['MENU_DASHBOARD', 'MENU_AUTHORITY_MANAGEMENT'],
    });
  });
});
