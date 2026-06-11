import { describe, expect, it } from 'vitest';
import { listUsers } from '../services/usersService';

describe('usersService', () => {
  it('lists users in tenant scope', async () => {
    const users = await listUsers('TENANT-A');
    expect(users.length).toBeGreaterThan(0);
    expect(users.every((user) => user.tenantCode === 'TENANT-A')).toBe(true);
  });
});
