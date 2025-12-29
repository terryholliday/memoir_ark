export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, opts: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

function getBaseUrl(): string | null {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  return baseUrl.replace(/\/+$/, '');
}

export function isApiConfigured(): boolean {
  return Boolean(getBaseUrl());
}

export async function apiFetch<TResponse>(
  path: string,
  opts: {
    method: HttpMethod;
    token?: string | null;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new ApiError('API base URL is not configured. Set EXPO_PUBLIC_API_BASE_URL to enable network calls.', {
      status: 0,
      code: 'API_NOT_CONFIGURED',
    });
  }

  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers ?? {}),
  };

  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    throw new ApiError('Network request failed', { status: 0, details: err });
  }

  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      (json && typeof json === 'object' && 'message' in json && typeof (json as any).message === 'string')
        ? (json as any).message
        : `Request failed (${res.status})`,
      { status: res.status, details: json ?? text }
    );
  }

  return json as TResponse;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
