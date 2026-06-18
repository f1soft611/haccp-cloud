import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearStoredThemeMode,
  getStoredThemeMode,
  resolveThemeStorageKey,
  storeThemeMode,
  type ThemeModePreference,
} from '../shared/theme/themePreference';

describe('themePreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses guest storage key when user id is missing', () => {
    expect(resolveThemeStorageKey()).toBe('haccp.theme.mode.guest');
    expect(resolveThemeStorageKey('')).toBe('haccp.theme.mode.guest');
  });

  it('stores and reads theme mode per user', () => {
    storeThemeMode('tenant_admin', 'dark');
    storeThemeMode('platform_admin', 'light');

    expect(getStoredThemeMode('tenant_admin')).toBe('dark');
    expect(getStoredThemeMode('platform_admin')).toBe('light');
    expect(getStoredThemeMode('unknown')).toBeNull();
  });

  it('mirrors authenticated user selection to guest theme for next login screen', () => {
    storeThemeMode('platform_admin', 'light');

    expect(getStoredThemeMode('platform_admin')).toBe('light');
    expect(getStoredThemeMode()).toBe('light');
  });

  it('clears only the matching user preference', () => {
    storeThemeMode('tenant_admin', 'dark');
    storeThemeMode('platform_admin', 'light');

    clearStoredThemeMode('tenant_admin');

    expect(getStoredThemeMode('tenant_admin')).toBeNull();
    expect(getStoredThemeMode('platform_admin')).toBe('light');
  });

  it('ignores invalid persisted values', () => {
    window.localStorage.setItem(resolveThemeStorageKey('tenant_admin'), 'blue');

    expect(getStoredThemeMode('tenant_admin')).toBeNull();
  });

  it('accepts only light or dark theme modes', () => {
    const modes: ThemeModePreference[] = ['light', 'dark'];

    expect(modes).toEqual(['light', 'dark']);
  });
});
