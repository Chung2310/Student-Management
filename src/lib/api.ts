let accessToken: string | null = localStorage.getItem("accessToken");

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<any> {
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
    // Attempt silent token refresh
    try {
      const refreshRes = await fetch("/api/v1/auth/refresh-token", { method: "POST" });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          
          // Retry the original request
          headers.set("Authorization", `Bearer ${accessToken}`);
          const retryRes = await fetch(url.toString(), { ...options, headers });
          if (!retryRes.ok) {
            const errData = await retryRes.json();
            throw new Error(errData.error || "Yêu cầu thử lại thất bại.");
          }
          return await retryRes.json();
        }
      }
    } catch (refreshErr) {
      console.error("Lỗi tự động làm mới token:", refreshErr);
    }
    
    setAccessToken(null);
    window.dispatchEvent(new Event("unauthorized"));
    throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Yêu cầu thất bại.");
  }

  return data;
}
