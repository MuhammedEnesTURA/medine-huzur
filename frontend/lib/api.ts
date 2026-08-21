const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5096";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
export const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60;
const TRANSIENT_PUBLIC_GET_STATUSES = new Set([502, 503, 504]);
const PUBLIC_GET_MAX_ATTEMPTS = 2;
const PUBLIC_GET_RETRY_DELAY_MS = 250;

type ApiFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}

export type ApiFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number | null };

export async function fetchJsonResult<T>(
  path: string,
  init?: ApiFetchInit
): Promise<ApiFetchResult<T>> {
  const method = (init?.method ?? "GET").toUpperCase();
  const canRetry = method === "GET";

  for (let attempt = 1; attempt <= PUBLIC_GET_MAX_ATTEMPTS; attempt++) {
    try {
      const requestInit =
        attempt === 1 || init?.signal
          ? init
          : { ...(init ?? {}), signal: new AbortController().signal };
      const response = await fetch(apiUrl(path), requestInit);
      const shouldRetry =
        canRetry &&
        attempt < PUBLIC_GET_MAX_ATTEMPTS &&
        TRANSIENT_PUBLIC_GET_STATUSES.has(response.status);

      if (shouldRetry) {
        await new Promise((resolve) =>
          setTimeout(resolve, PUBLIC_GET_RETRY_DELAY_MS)
        );
        continue;
      }

      if (!response.ok) {
        return { ok: false, status: response.status };
      }

      const data = await response.json().catch(() => null);
      if (data === null) {
        return { ok: false, status: response.status };
      }

      return { ok: true, status: response.status, data: data as T };
    } catch {
      const shouldRetry =
        canRetry &&
        attempt < PUBLIC_GET_MAX_ATTEMPTS &&
        !init?.signal?.aborted;

      if (!shouldRetry) {
        return { ok: false, status: null };
      }

      await new Promise((resolve) =>
        setTimeout(resolve, PUBLIC_GET_RETRY_DELAY_MS)
      );
    }
  }

  return { ok: false, status: null };
}

export async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : "İşlem sırasında bir hata oluştu.";

    throw new Error(message);
  }

  return data as T;
}

export function authHeaders(token?: string | null): HeadersInit {
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}
