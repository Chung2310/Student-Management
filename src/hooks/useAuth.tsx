/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiFetch, AUTH_REFRESHED_EVENT, setAccessToken } from '../lib/api';
import { useToast } from './useToast';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "superadmin" | "admin" | "user";
  centerId: string;
  createdBy?: string;
  bankAccountNo?: string;
  bankId?: string;
  bankAccountName?: string;
  bankQrEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSandboxEmail?: string;
  businessType?: "driving" | "language" | "general";
  smsSettings?: {
    provider?: "twilio" | "stringee" | "tingting";
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    twilioMessagingServiceSid?: string;
    twilioStatusCallbackUrl?: string;
    tingtingApiKey?: string;
    tingtingSender?: string;
    stringeeApiUrl?: string;
    stringeeApiKey?: string;
    stringeeSecretKey?: string;
    stringeeBrandname?: string;
    stringeeSender?: string;
    stringeeStatusCallbackUrl?: string;
  } | null;
  permissions?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAuthUser(rawUser: Record<string, unknown>): AuthUser {
  return {
    uid: String(rawUser.uid || ''),
    email: String(rawUser.email || ''),
    displayName: String(rawUser.displayName || ''),
    photoURL: typeof rawUser.photoURL === 'string' ? rawUser.photoURL : undefined,
    role: rawUser.role as AuthUser['role'],
    centerId: String(rawUser.centerId || ''),
    createdBy: typeof rawUser.createdBy === 'string' ? rawUser.createdBy : undefined,
    bankAccountNo: typeof rawUser.bankAccountNo === 'string' ? rawUser.bankAccountNo : undefined,
    bankId: typeof rawUser.bankId === 'string' ? rawUser.bankId : undefined,
    bankAccountName: typeof rawUser.bankAccountName === 'string' ? rawUser.bankAccountName : undefined,
    bankQrEnabled: typeof rawUser.bankQrEnabled === 'boolean' ? rawUser.bankQrEnabled : undefined,
    smtpHost: typeof rawUser.smtpHost === 'string' ? rawUser.smtpHost : undefined,
    smtpPort: typeof rawUser.smtpPort === 'number' ? rawUser.smtpPort : undefined,
    smtpSecure: typeof rawUser.smtpSecure === 'boolean' ? rawUser.smtpSecure : undefined,
    smtpUser: typeof rawUser.smtpUser === 'string' ? rawUser.smtpUser : undefined,
    smtpPass: typeof rawUser.smtpPass === 'string' ? rawUser.smtpPass : undefined,
    smtpFrom: typeof rawUser.smtpFrom === 'string' ? rawUser.smtpFrom : undefined,
    smtpSandboxEmail: typeof rawUser.smtpSandboxEmail === 'string' ? rawUser.smtpSandboxEmail : undefined,
    businessType: (rawUser.businessType as AuthUser['businessType']) || "driving",
    smsSettings: (rawUser.smsSettings as AuthUser['smsSettings']) || null,
    permissions: Array.isArray(rawUser.permissions) ? (rawUser.permissions as string[]) : [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const fetchMe = async () => {
    try {
      const res = await apiFetch("/auth/me");
      if (res.success && res.data.user) {
        setUser(normalizeAuthUser(res.data.user));
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
    const timer = setTimeout(() => {
      fetchMe();
    }, 0);

    const handleUnauthorized = () => {
      setUser(null);
    };
    const handleAuthRefreshed = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      if (customEvent.detail) {
        setUser(normalizeAuthUser(customEvent.detail));
      }
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    window.addEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed as EventListener);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("unauthorized", handleUnauthorized);
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed as EventListener);
    };
  }, []);

  const login = async () => {
    toast.warning("Đăng nhập bằng Google đã bị loại bỏ. Vui lòng sử dụng Email và Mật khẩu.");
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
        setUser(normalizeAuthUser(res.data.user));
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : "Đăng nhập thất bại.", { cause: error });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password: pass, displayName }),
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

  return (
    <AuthContext.Provider value={{ user, loading, isLoggingIn, login, loginWithEmail, registerWithEmail, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
