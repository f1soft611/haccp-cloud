const LAST_LOGIN_DOMAIN_STORAGE_KEY = 'haccp.last-login-domain';

const DOMAIN_PATTERN =
  /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function extractDomainFromCandidate(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('@')) {
    return trimmed.split('@').pop() ?? '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return '';
    }
  }

  if (trimmed.startsWith('/login/')) {
    const pathValue = trimmed.replace(/^\/login\//, '').split(/[/?#]/)[0] ?? '';
    try {
      return decodeURIComponent(pathValue);
    } catch {
      return pathValue;
    }
  }

  if (trimmed.includes('/')) {
    return trimmed.split('/')[0] ?? '';
  }

  return trimmed;
}

export function normalizeLoginDomain(value: string): string {
  const normalized = extractDomainFromCandidate(value);
  if (!normalized || !DOMAIN_PATTERN.test(normalized)) {
    return '';
  }

  return normalized;
}

export function loadLastLoginDomain(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const localRaw =
    window.localStorage.getItem(LAST_LOGIN_DOMAIN_STORAGE_KEY) ?? '';
  const localDomain = normalizeLoginDomain(localRaw);
  if (localDomain) {
    return localDomain;
  }

  const sessionRaw =
    window.sessionStorage.getItem(LAST_LOGIN_DOMAIN_STORAGE_KEY) ?? '';
  return normalizeLoginDomain(sessionRaw);
}

export function persistLastLoginDomain(domain: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeLoginDomain(domain);
  if (!normalized) {
    return;
  }

  window.localStorage.setItem(LAST_LOGIN_DOMAIN_STORAGE_KEY, normalized);
}

export function resolveLoginPathWithLastDomain(): string {
  const domain = loadLastLoginDomain();
  if (!domain) {
    return '/login';
  }

  return `/login/${encodeURIComponent(domain)}`;
}
