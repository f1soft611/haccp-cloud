import { describe, expect, it, beforeEach } from 'vitest';
import {
  loadLastLoginDomain,
  normalizeLoginDomain,
  persistLastLoginDomain,
  resolveLoginPathWithLastDomain,
} from '../shared/utils/loginDomainRouting';

describe('loginDomainRouting', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('normalizes valid domain and rejects invalid values', () => {
    expect(normalizeLoginDomain('F1SOFT.CO.KR')).toBe('f1soft.co.kr');
    expect(normalizeLoginDomain('socra710@f1soft.co.kr')).toBe('f1soft.co.kr');
    expect(normalizeLoginDomain('https://f1soft.co.kr')).toBe('f1soft.co.kr');
    expect(normalizeLoginDomain('/login/f1soft.co.kr')).toBe('f1soft.co.kr');
    expect(normalizeLoginDomain('localhost')).toBe('');
    expect(normalizeLoginDomain('javascript:alert(1)')).toBe('');
  });

  it('persists and resolves domain login path', () => {
    persistLastLoginDomain('f1soft.co.kr');

    expect(loadLastLoginDomain()).toBe('f1soft.co.kr');
    expect(resolveLoginPathWithLastDomain()).toBe('/login/f1soft.co.kr');
  });

  it('falls back to /login when no domain is stored', () => {
    expect(resolveLoginPathWithLastDomain()).toBe('/login');
  });

  it('falls back to session storage when local storage is empty', () => {
    window.sessionStorage.setItem(
      'haccp.last-login-domain',
      '/login/f1soft.co.kr',
    );

    expect(loadLastLoginDomain()).toBe('f1soft.co.kr');
    expect(resolveLoginPathWithLastDomain()).toBe('/login/f1soft.co.kr');
  });
});
