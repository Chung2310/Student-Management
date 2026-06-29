/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiFetch, setAccessToken } from '../lib/api';
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
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSandboxEmail?: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const fetchMe = async () => {
    try {
      const res = await apiFetch("/auth/me");
      if (res.success && res.data.user) {
        setUser({
          uid: res.data.user.uid,
          email: res.data.user.email,
          displayName: res.data.user.displayName,
          photoURL: res.data.user.photoURL,
          role: res.data.user.role,
          centerId: res.data.user.centerId,
          createdBy: res.data.user.createdBy,
          bankAccountNo: res.data.user.bankAccountNo,
          bankId: res.data.user.bankId,
          bankAccountName: res.data.user.bankAccountName,
          smtpHost: res.data.user.smtpHost,
          smtpPort: res.data.user.smtpPort,
          smtpSecure: res.data.user.smtpSecure,
          smtpUser: res.data.user.smtpUser,
          smtpPass: res.data.user.smtpPass,
          smtpFrom: res.data.user.smtpFrom,
          smtpSandboxEmail: res.data.user.smtpSandboxEmail,
          smsSettings: res.data.user.smsSettings || null,
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
    const timer = setTimeout(() => {
      fetchMe();
    }, 0);

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("unauthorized", handleUnauthorized);
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
        setUser(res.data.user);
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
