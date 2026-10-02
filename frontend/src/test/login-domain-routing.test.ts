import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadLastLoginTenantNo,
  normalizeTenantNo,
  persistLastLoginTenantNo,
  resolveLoginPathWithLastTenantNo,
} from '../shared/utils/loginDomainRouting';

describe('loginDomainRouting (업체번호)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('accepts only 6-digit tenant numbers without leading zero', () => {
    expect(normalizeTenantNo(' 482913 ')).toBe('482913');
    expect(normalizeTenantNo('012345')).toBe('');
    expect(normalizeTenantNo('48291')).toBe('');
    expect(normalizeTenantNo('f1soft.co.kr')).toBe('');
    expect(normalizeTenantNo('')).toBe('');
  });

  it('persists tenant number and resolves login path', () => {
    persistLastLoginTenantNo('482913');

    expect(loadLastLoginTenantNo()).toBe('482913');
    expect(resolveLoginPathWithLastTenantNo()).toBe('/login/482913');
  });

  it('ignores invalid tenant numbers when persisting', () => {
    persistLastLoginTenantNo('abc');

    expect(loadLastLoginTenantNo()).toBe('');
  });

  it('falls back to /login when nothing is stored', () => {
    expect(resolveLoginPathWithLastTenantNo()).toBe('/login');
  });

  it('does not read the legacy last-login-domain key', () => {
    window.localStorage.setItem('haccp.last-login-domain', 'f1soft.co.kr');

    expect(resolveLoginPathWithLastTenantNo()).toBe('/login');
  });
});