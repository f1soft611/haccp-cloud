export type ThemeModePreference = 'light' | 'dark';

const THEME_MODE_STORAGE_PREFIX = 'haccp.theme.mode';
const GUEST_THEME_MODE_STORAGE_KEY = `${THEME_MODE_STORAGE_PREFIX}.guest`;
export const THEME_MODE_CHANGE_EVENT = 'haccp-theme-mode-change';

function isThemeModePreference(value: string): value is ThemeModePreference {
  return value === 'light' || value === 'dark';
}

export function resolveThemeStorageKey(userId?: string): string {
  const normalizedUserId = userId?.trim();

  if (!normalizedUserId) {
    return GUEST_THEME_MODE_STORAGE_KEY;
  }

  return `${THEME_MODE_STORAGE_PREFIX}.${normalizedUserId}`;
}

export function getStoredThemeMode(
  userId?: string,
): ThemeModePreference | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.localStorage.getItem(
    resolveThemeStorageKey(userId),
  );

  if (!storedValue || !isThemeModePreference(storedValue)) {
    return null;
  }

  return storedValue;
}

export function storeThemeMode(
  userId: string | undefined,
  mode: ThemeModePreference,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(resolveThemeStorageKey(userId), mode);
  window.localStorage.setItem(GUEST_THEME_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(THEME_MODE_CHANGE_EVENT));
}

export function clearStoredThemeMode(userId?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(resolveThemeStorageKey(userId));
  window.dispatchEvent(new CustomEvent(THEME_MODE_CHANGE_EVENT));
}
