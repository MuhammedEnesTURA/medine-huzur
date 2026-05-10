"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiUrl, authHeaders, readJsonOrThrow } from "../lib/api";

type User = {
  id: string;
  email: string;
  role: string;
  emailConfirmed: boolean;
  createdAtUtc: string;
};

type AuthResponse = {
  token: string;
  user: User;
  message: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  resendVerification: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "medine_huzur_token";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    removeStoredToken();
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();

    if (!currentToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        headers: {
          ...authHeaders(currentToken),
        },
        cache: "no-store",
      });

      const data = await readJsonOrThrow<User>(res);

      setToken(currentToken);
      setUser(data);

      return data;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const currentToken = getStoredToken();

      if (!currentToken) {
        if (!cancelled) {
          setIsReady(true);
        }
        return;
      }

      try {
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: {
            ...authHeaders(currentToken),
          },
          cache: "no-store",
        });

        const data = await readJsonOrThrow<User>(res);

        if (!cancelled) {
          setToken(currentToken);
          setUser(data);
          setIsReady(true);
        }
      } catch {
        removeStoredToken();

        if (!cancelled) {
          setToken(null);
          setUser(null);
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await readJsonOrThrow<AuthResponse>(res);

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await readJsonOrThrow<AuthResponse>(res);

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  }, []);

  const resendVerification = useCallback(async () => {
    if (!token) {
      throw new Error("Oturum bulunamadı.");
    }

    const res = await fetch(apiUrl("/api/auth/resend-verification"), {
      method: "POST",
      headers: {
        ...authHeaders(token),
      },
    });

    const data = await readJsonOrThrow<{ message: string }>(res);
    await refreshUser();

    return data.message;
  }, [refreshUser, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "Admin",
      login,
      register,
      logout,
      refreshUser,
      resendVerification,
    }),
    [
      user,
      token,
      isReady,
      login,
      register,
      logout,
      refreshUser,
      resendVerification,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}