const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5096";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
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