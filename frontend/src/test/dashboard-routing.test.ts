import { describe, expect, it } from 'vitest';
import {
  resolveDashboardLandingPath,
  resolveDashboardViewType,
} from '../shared/utils/dashboardRouting';

describe('dashboardRouting', () => {
  it('routes PLATFORM_ADMIN with P plan to platform dashboard', () => {
    expect(
      resolveDashboardLandingPath({ role: 'PLATFORM_ADMIN', planCode: 'P' }),
    ).toBe('/platform');
    expect(
      resolveDashboardViewType({ role: 'PLATFORM_ADMIN', planCode: 'P' }),
    ).toBe('platformAdmin');
  });

  it('routes PLATFORM_ADMIN with non-P plan to legacy dashboard', () => {
    expect(
      resolveDashboardLandingPath({ role: 'PLATFORM_ADMIN', planCode: 'C' }),
    ).toBe('/dashboard');
    expect(
      resolveDashboardViewType({ role: 'PLATFORM_ADMIN', planCode: 'C' }),
    ).toBe('legacy');
  });

  it('keeps tenant users on legacy dashboard even with P plan', () => {
    expect(
      resolveDashboardLandingPath({ role: 'TENANT_ADMIN', planCode: 'P' }),
    ).toBe('/dashboard');
    expect(
      resolveDashboardViewType({ role: 'TENANT_ADMIN', planCode: 'P' }),
    ).toBe('legacy');
  });
});
