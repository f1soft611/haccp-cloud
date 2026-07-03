import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../services/api/apiClient';
import {
  createDepartment,
  listDepartments,
  updateDepartment,
} from '../services/organization/departmentsService';

vi.mock('../services/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('departmentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes backend departmentId and parentDepartmentId from list response', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          departmentId: 200,
          tenantCode: 'TENANT_A',
          name: '품질팀',
          parentDepartmentId: 100,
          parentName: '생산본부',
          sortOrder: '3',
          active: true,
          hasChildren: false,
        },
      ],
    });

    const items = await listDepartments({
      tenantCode: 'TENANT_A',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/v1/departments', {
      headers: { 'x-tenant-code': 'TENANT_A' },
      params: {
        name: undefined,
        active: undefined,
      },
    });

    expect(items[0]).toMatchObject({
      id: '200',
      parentId: '100',
      sortOrder: 3,
      name: '품질팀',
    });
  });

  it('sends normalized parentId and maps created response', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        departmentId: 301,
        tenantCode: 'TENANT_A',
        name: '생산1팀',
        parentDepartmentId: 300,
        parentName: '생산본부',
        sortOrder: 1,
        active: true,
        hasChildren: false,
      },
    });

    const created = await createDepartment({
      tenantCode: 'TENANT_A',
      name: '생산1팀',
      parentId: ' 300 ',
      sortOrder: 1,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/departments',
      {
        name: '생산1팀',
        parentId: '300',
        sortOrder: 1,
      },
      { headers: { 'x-tenant-code': 'TENANT_A' } },
    );

    expect(created.id).toBe('301');
    expect(created.parentId).toBe('300');
  });

  it('maps updated response to ui model', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        departmentId: '401',
        tenantCode: 'TENANT_A',
        name: '개선팀',
        parentDepartmentId: null,
        parentName: null,
        sortOrder: 7,
        active: false,
        hasChildren: true,
      },
    });

    const updated = await updateDepartment({
      tenantCode: 'TENANT_A',
      id: '401',
      name: '개선팀',
      parentId: null,
      sortOrder: 7,
      active: false,
    });

    expect(updated).toMatchObject({
      id: '401',
      parentId: null,
      active: false,
      hasChildren: true,
    });
  });
});
