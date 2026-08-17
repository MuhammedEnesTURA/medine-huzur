const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5096";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
export const PUBLIC_CATALOG_REVALIDATE_SECONDS = 60;

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
  try {
    const response = await fetch(apiUrl(path), init);

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json().catch(() => null);
    if (data === null) {
      return { ok: false, status: response.status };
    }

    return { ok: true, status: response.status, data: data as T };
  } catch {
    return { ok: false, status: null };
  }
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
