import { describe, expect, it } from 'vitest';
import {
  listUsers,
  listUsersPaged,
  resetUserPassword,
} from '../services/organization/usersService';

describe('usersService', () => {
  it('lists users in tenant scope', async () => {
    const users = await listUsers('TENANT-A');
    expect(users.length).toBeGreaterThan(0);
    expect(users.every((user) => user.tenantCode === 'TENANT-A')).toBe(true);
  });

  it('lists paged users in tenant scope', async () => {
    const page = await listUsersPaged({
      tenantCode: 'TENANT-A',
      pageIndex: 1,
      pageSize: 10,
      keyword: '',
      filterActive: 'all',
    });

    expect(page.totalCount).toBeGreaterThan(0);
    expect(page.items.every((user) => user.tenantCode === 'TENANT-A')).toBe(
      true,
    );
  });

  it('resets a user password and returns the temp password from the server', async () => {
    const tempPassword = await resetUserPassword({
      tenantCode: 'TENANT-A',
      id: 'U-1',
    });

    expect(tempPassword).toBe('U-1U-1');
  });
});
