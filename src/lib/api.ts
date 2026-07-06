let accessToken: string | null = localStorage.getItem("accessToken");

export const AUTH_REFRESHED_EVENT = "auth:refreshed";

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
}

export function getAccessToken() {
  return accessToken;
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
}

interface ApiErrorResponse {
  error?: string;
}

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken?: string;
    user?: unknown;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(`/api/v1${endpoint}`, window.location.origin);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.append(key, String(val));
      }
    });
  }

  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== "/auth/refresh-token" && endpoint !== "/auth/login") {
    try {
      const refreshRes = await fetch("/api/v1/auth/refresh-token", { method: "POST" });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json() as RefreshTokenResponse;
        if (refreshData.success && refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          if (typeof window !== "undefined" && refreshData.data.user) {
            window.dispatchEvent(new CustomEvent(AUTH_REFRESHED_EVENT, { detail: refreshData.data.user }));
          }

          headers.set("Authorization", `Bearer ${accessToken}`);
          const retryRes = await fetch(url.toString(), { ...options, headers });
          if (!retryRes.ok) {
            const errData = await retryRes.json() as ApiErrorResponse;
            throw new Error(errData.error || "Yêu cầu thử lại thất bại.");
          }
          return await retryRes.json() as T;
        }
      }
    } catch (refreshErr) {
      console.error("Lỗi tự động làm mới token:", refreshErr);
    }

    setAccessToken(null);
    window.dispatchEvent(new Event("unauthorized"));
    throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const data = await response.json() as T | ApiErrorResponse;
  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data !== null && 'error' in data
      ? data.error
      : undefined;
    throw new Error(errorMessage || "Yêu cầu thất bại.");
  }

  return data as T;
}
