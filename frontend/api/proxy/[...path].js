const DEFAULT_BACKEND_ORIGIN = 'http://218.155.74.34';
const DEFAULT_BACKEND_BASE_PATH = '/haccp-cloud';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function normalizePath(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function extractProxyPath(pathParam) {
  if (Array.isArray(pathParam)) {
    return pathParam.map(normalizePath).filter(Boolean).join('/');
  }

  return normalizePath(pathParam);
}

function buildForwardHeaders(incomingHeaders) {
  const forwarded = new Headers();

  for (const [key, value] of Object.entries(incomingHeaders)) {
    const lower = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(lower)) {
      continue;
    }

    if (Array.isArray(value)) {
      forwarded.set(key, value.join(','));
      continue;
    }

    if (typeof value === 'string') {
      forwarded.set(key, value);
    }
  }

  return forwarded;
}

function buildQueryString(query) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (key === 'path' || typeof value === 'undefined') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.append(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function buildBody(req) {
  const method = String(req.method || 'GET').toUpperCase();

  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  if (typeof req.body === 'string' || req.body instanceof Uint8Array) {
    return req.body;
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return undefined;
}

export default async function handler(req, res) {
  const backendOrigin = process.env.BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN;
  const backendBasePath = (
    process.env.BACKEND_BASE_PATH || DEFAULT_BACKEND_BASE_PATH
  ).replace(/\/+$/, '');
  const proxyPath = extractProxyPath(req.query?.path);
  const queryString = buildQueryString(req.query);

  const targetPath = proxyPath
    ? `${backendBasePath}/${proxyPath}`
    : backendBasePath;
  const targetUrl = `${backendOrigin.replace(/\/+$/, '')}${targetPath.startsWith('/') ? '' : '/'}${targetPath}${queryString}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: buildForwardHeaders(req.headers),
      body: buildBody(req),
      redirect: 'manual',
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(502).json({
      message: 'Proxy request failed',
      targetUrl,
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
