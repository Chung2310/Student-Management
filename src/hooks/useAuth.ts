import { useState, useEffect } from 'react';
import { apiFetch, setAccessToken } from '../lib/api';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  gasUrl?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchMe = async () => {
    try {
      const res = await apiFetch("/auth/me");
      if (res.success && res.data.user) {
        setUser({
          uid: res.data.user.uid,
          email: res.data.user.email,
          displayName: res.data.user.displayName,
          gasUrl: res.data.user.gasUrl,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  const login = async () => {
    alert("Đăng nhập bằng Google đã bị loại bỏ. Vui lòng sử dụng Email và Mật khẩu.");
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : "Đăng nhập thất bại.", { cause: error });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string, gasUrl: string) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password: pass, displayName, gasUrl }),
      });
      if (res.success) {
        await loginWithEmail(email, pass);
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : "Đăng ký thất bại.", { cause: error });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error: unknown) {
      console.error("Logout error:", error);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return { user, loading, login, loginWithEmail, registerWithEmail, logout, isLoggingIn };
}
